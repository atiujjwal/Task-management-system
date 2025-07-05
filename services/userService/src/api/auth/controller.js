const bcrypt = require("bcryptjs");

const {
  getUserDetails,
  createUser,
  updateUser,
  getUserOtp,
  saveUserOtp,
  formatName
} = require("../../models/user");

const {
  validateRegisterUserData,
  validateLoginUserData,
  validateSendOtpData
} = require("../../schema/user");

const {
  generateAccessToken,
  generateRefreshToken,
  getRefreshToken,
  updateRefreshToken,
  saveRefreshToken,
  invalidateRefreshToken,
  generateUserVerificationToken
} = require("../../middlewares/auth/helper");

const { sendMail } = require("../../services/mail/mailHandler");
const { sendSms } = require("../../services/sms/smsHandler");
const { constants } = require("../../../constants");

const {
  LOCAL_BASE_URL
} = process.env;

// @desc   Registers a user
// @route  POST /api/users/register
// @access public 
exports.registerUser = async (req, res) => {
  try {
    const { error, value: body } = validateRegisterUserData(req.body);

    if (error)
      return res.status(400).send({
        code: 400,
        message: error.details[0].message
        // message: "Invalid data format."
      });

    const {
      email,
      mobile,
    } = body;

    // check if user already exists
    const existingUser = await getUserDetails({
      email,
      mobile,
    });

    if (existingUser) {
      if (!existingUser.verified) {
        return res.send({
          code: 409,
          message: "Please, verify your email and mobile number."
        });
      }
      return res.send({
        code: 409,
        message: "A user with this email or mobile number already exists."
      });
    }

    //create a user
    const userId = await createUser(body);

    if (!userId)
      return res.send({
        code: 500,
        message: "Failed to register the user."
      });


    let verificationTokens = generateUserVerificationToken(4);


    let emailData = {
      to: body.email,
      fullName: (body.first_name + " " + body.last_name),
      firstName: body.first_name,
      verificationLink: `${LOCAL_BASE_URL}/api/users/verify/${verificationTokens.email}`
    };
    //Welcome + email verification email
    sendMail(2, emailData);

    let mobileData = {
      to: body.mobile,
      body: `Welcome to TaskFlow AI. Please click the link to verify your number. We're excited to have you! Link: ${LOCAL_BASE_URL}verify/token:${verificationTokens.mobile}`
    };

    // //  //Welcome + mobile verification message
    //   sendSms(mobileData);
    console.log(`87: Email verification link: ${emailData.verificationLink}`);
    console.log(`88: Mobile verification link: ${LOCAL_BASE_URL}verify/token:${verificationTokens.mobile}`);

    return res.send({
      code: 200,
      message: "User registered successfully."
    });
  } catch (error) {
    console.log("Error registering the user: ", error);
    return res.send({
      code: 500,
      message: "Internal server error."
    })
  }
};

//TODO:
// @desc    Verify User
// @route   POST /api/users/verifyUser
// @access  Public
exports.verifyEmailAndMobile = async (req, res) => {
  const {
    id,
    type
  } = req.params.token;

  try {
    let isUpdated;
    if (type == "email") {
      isUpdated = await updateUser({
        id,
        data: { email_verified: 1 }
      });
    } else {
      isUpdated = await updateUser({
        id,
        data: { mobile_verified: 1 }
      });
    }

    if (!isUpdated)
      return type == "email" ? res.send({
        code: 200,
        message: "Failed to verify email."
      }) : res.send({
        code: 200,
        message: "Failed to verify mobile."
      });


    return type == "email" ? res.send({
      code: 200,
      message: "Your email verified successfully."
    }) : res.send({
      code: 200,
      message: "Your mobile verified successfully."
    });
  } catch (error) {
    console.log("Error verifying user: ", error);
    return res.send({
      code: 500,
      message: "Email or mobile verification failed."
    });
  }
};

//TODO:
// @desc    Verify User
// @route   POST /api/users/verifyUser
// @access  Public
exports.sendOtp = async (req, res) => {
  const { type } = req.params;
  if (!constants.validOtpTypes.includes(type))
    return res.send({
      code: 400,
      message: "Invalid request."
    });
  try {
    const { error, value: query } = validateSendOtpData(req.query);
    if (error)
      return res.status(400).send({
        code: 400,
        // message: error.details[0].message,
        message: "Invalid data format."
      });

    const {
      email,
      mobile
    } = query;

    const userData = await getUserDetails({ email, mobile });

    if (!userData)
      return res.send({
        code: 401,
        message: "Not authenticated."
      });

    let userOtp = await getUserOtp({ email, mobile, type });

    if (!userOtp) {
      userOtp = Math.floor(1000 + Math.random() * 9999);
      await saveUserOtp({
        email,
        mobile,
        type,
        otp: userOtp,
        expires_at: new Date(Date.now() + 2 * 60 * 1000)
      });
    }

    if (email) {
      sendMail(3, {
        to: userData.email,
        firstName: formatName([userData.first_name, userData.middle_name, userData.last_name]),
        otp: userOtp
      });
    } else {
      console.log("An Otp to reset your password will be sent.");
      // sendSms({
      //   to: body.mobile,
      //   body: `Hi, ${formatName([userData.first_name, userData.middle_name, userData.last_name])}. OTP to reset your password: ${userOtp}. OTP will expire in 2 minutes. Hurry!!!`
      // });
    }

    return res.send({
      code: 200,
      message: "Otp sent successfully."
    });
  } catch (error) {
    console.log("Error sending OTP: ", error);
    return res.send({
      code: 500,
      message: "Failed to send otp."
    });
  }
};

// @desc    Authenticate user & get tokens/Login
// @route   POST /api/users/login
// @access  Public
exports.loginUser = async (req, res) => {
  try {
    const { error, value: body } = validateLoginUserData(req.body);

    if (error)
      return res.status(400).send({
        code: 400,
        // message: error.details[0].message,
        message: "Invalid data format."
      });

    const {
      email,
      mobile,
      password
    } = body;

    const user = await getUserDetails({ email, mobile });

    if (!user)
      return res.send({
        code: 400,
        message: "No account found with the provided email or mobile number. Please register."
      });

    if (!user.mobile_verified || !user.email_verified)
      return res.send({
        code: 400,
        message: "Please, verify your email and mobile number."
      });

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword)
      return res.send({
        code: 400,
        message: "Incorrect password"
      });

    let userData = {
      id: user.id,
      first_name: user.first_name,
      middle_name: user.middle_name,
      last_name: user.last_name,
      email: user.email,
      mobile: user.mobile
    };

    let [
      accessToken,
      refreshToken
    ] = await Promise.all([
      generateAccessToken(userData),
      getRefreshToken(user.id)
    ]);

    if (refreshToken) {
      refreshToken = generateRefreshToken(user.id);
      let isUpdated = await updateRefreshToken(
        user.id,
        {
          token: refreshToken,
          expires_at: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
          revoked_at: null
        }
      );
      if (!isUpdated)
        return res.send({
          code: 400,
          message: "Failed to login."
        });
    } else if (!refreshToken) {
      refreshToken = generateRefreshToken(user.id);
      let isSaved = await saveRefreshToken({
        user_id: user.id,
        token: refreshToken,
        expires_at: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        revoked_at: null
      });

      if (!isSaved)
        return res.send({
          code: 400,
          message: "Failed to login."
        });
    }

    return res.send({
      code: 200,
      message: "Login successful",
      user: userData,
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error("Error logging in user:", error);
    return res.send(({
      code: 500,
      message: "Server error during login."
    }));
  }
};

// @desc    Refresh Access and refresh Token and fetches user details
// @route   POST /api/users/refreshTokens
// @access  Public (but requires valid refresh token)
exports.refreshTokens = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await getUserDetails({ id: userId });
    let refreshToken = await getRefreshToken(userId);

    if (!user || refreshToken == "revoked" || refreshToken != req.user.refresh_token) {

      if (user) invalidateRefreshToken(user.id);

      return res.send({
        code: 403,
        message: "Invalid or revoked refresh token."
      });
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user.id);

    updateRefreshToken(
      user.id,
      {
        token: refreshToken,
        expires_at: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        revoked_at: null
      }
    );

    return res.send({
      code: 200,
      message: "Tokens refreshed successfully",
      data: {
        userData: {
          id: user.id,
          first_name: user.first_name,
          middle_name: user.middle_name,
          last_name: user.last_name,
          email: user.email,
          mobile: user.mobile
        },
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      }
    });
  } catch (error) {
    console.log("Error refreshing token: ", error);
    if (error.name === "TokenExpiredError") {
      return res.send({
        code: 403,
        message: "Refresh token expired. Please log in again."
      });
    }
    return res.send({
      code: 403,
      message: "Invalid refresh token."
    });
  }
};

// @desc    Logout user (invalidate refresh token)
// @route   POST /api/users/logout
// @access  Private (requires access token)
exports.logoutUser = async (req, res) => {
  const userId = req.user.id;

  if (!userId)
    return res.send({
      code: 401,
      message: "Not authenticated."
    });

  try {
    invalidateRefreshToken(userId);
    return res.send({
      code: 200,
      message: "Logged out successfully."
    });
  } catch (error) {
    console.log("Error during logout: ", error);
    return res.send({
      code: 500,
      message: "Server error during logout."
    });
  }
};

// @desc    Change password or Forgot password
// @route   POST /api/users/changePassword
// @access  public (requires access token)
exports.changePassword = async (req, res) => {
  try {
    const { error, value: body } = validateChangePasswordData(req.body);

    if (error)
      return res.status(400).send({
        code: 400,
        message: error.details[0].message
        // message: "Invalid data format."
      });


    const {
      email,
      mobile,
      otp,
    } = req.query;

    let user = await getUserDetails({ email, mobile });

    if (!user)
      return res.send({
        code: 401,
        message: "Invalid email or mobile."
      });




    if (email) {
      //send otp to email and verify
    }


  } catch (error) {
    console.log("Error during logout: ", error);
    return res.send({
      code: 500,
      message: "Server error during logout."
    });
  }
};
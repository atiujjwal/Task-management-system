const bcrypt = require("bcryptjs");
const { getUserDetails, createUser } = require("../../models/user");
const { validateRegisterUserData } = require("../../schema/user");
const {
  generateAccessToken,
  generateRefreshToken,
  getRefreshToken,
  updateRefreshToken,
  saveRefreshToken,
  invalidateRefreshToken
} = require("../../middlewares/auth/helper");
const { sendMail } = require("../../services/mail/mailHandler");

// @desc   Registers a user
// @route  POST /api/users/register
// @access public 
exports.registerUser = async (req, res) => {
  try {
    const { error, value: body } = validateRegisterUserData(req.body);

    if (error)
      return res.status(400).send({
        code: 400,
        // message: error.details[0].message,
        message: "Invalid data format."
      });

    const {
      email,
      mobile,
    } = body;

    // //check if user already exists
    const existingUser = await getUserDetails({
      email,
      mobile,
    });

    if (existingUser)
      return res.send({
        code: 409,
        message: "A user with this email or mobile number already exists."
      });

    //TODO: capitalize first letter and then save the name

    //create a user
    const userId = await createUser(body);

    if (!userId)
      return res.send({
        code: 500,
        message: "Failed to register the user."
      });

    //TODO: send and save verification OTP to mobile
    //TODO:send and save verification OTP to email

    let emailData = {
      to: body.email,
      name: (body.first_name + " " + body.last_name),
    };

    sendMail(2, emailData);

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
exports.verifyUser = async (req, res) => {
  const userId = req.user.id;

  //TODO: send otp to mobile and email (sent while registering user)
  //TODO: get email and mobile OTP then match it with dataBase

  //TODO: verify email
  //TODO: verify mobile

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
    console.log("Error verifying user: ", error);
    return res.send({
      code: 500,
      message: "Error verifying user."
    });
  }
};

// @desc    Authenticate user & get tokens/Login
// @route   POST /api/users/login
// @access  Public
exports.loginUser = async (req, res) => {
  const { email, mobile, password } = req.body;

  try {
    const user = await getUserDetails({ email, mobile });

    if (!user)
      return res.send({
        code: 400,
        message: "No account found with the provided email or mobile number. Please register."
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
    res
      .status(500)
      .json({ message: "Server error during login", error: error.message });
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

// @desc    Forgot password
// @route   POST /api/users/forgotPassword
// @access  public (requires access token)
exports.forgotPassword = async (req, res) => {
  //send otp to registered mobile
  //send otp to registered email
  const userId = req.user.id;

  if (!userId)
    return res.send({
      code: 401,
      message: "Not authenticated."
    });

  //use otp verification : mobile and otp
  //

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
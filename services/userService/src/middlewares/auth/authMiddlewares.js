const jwt = require("jsonwebtoken");
const path = require("path");
const { config } = require("../../config");
const { getUserDetails } = require("../../models/user");

exports.verifyAccessToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res.send({
      code: 401,
      message: "No token provided or invalid token format.",
    });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await getUserDetails({ id: decoded.id });

    if (!user)
      return res.send({
        code: 401,
        message: "Not authorized, user not found",
      });

    console.log("UserService: Access Token verified.");
    req.user = decoded;
    next();
  } catch (error) {
    console.log("Error verifying access token: ", error);
    if (error.name === "TokenExpiredError")
      return res.status(401).json({ message: "Token expired." });
    return res.status(403).json({ message: "Failed to authenticate token." });
  }
};

exports.verifyRefreshToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res.send({
      code: 401,
      message: "No token provided or invalid token format.",
    });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await getUserDetails({ id: decoded.id });

    if (!user)
      return res.send({
        code: 401,
        message: "Not authorized, user not found",
      });

    console.log("UserService: Refresh Token verified.");
    req.user = user;
    req.user.refresh_token = token;
    next();
  } catch (error) {
    console.log("Error verifying refresh token: ", error);
    if (error.name === "TokenExpiredError")
      return res.status(401).json({ message: "Token expired." });
    return res.status(403).json({ message: "Failed to authenticate token." });
  }
};

exports.verifyUserVerificationToken = async (req, res, next) => {
  const { token } = req.params;
  console.log("70: verification middleware");
  
  if (!token)
    return res.send({
      code: 401,
      message: "Unauthorized access.",
    });

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await getUserDetails({ id: decoded.id });

    if (!user)
      return res.send({
        code: 401,
        message: "Not authorized, user not found",
      });
    
    const {
      mobile_verified,
      email_verified
    } = user;

    const {
      type
    } = decoded;

    if ((type == "email" && email_verified == 1) || (type == "mobile" && mobile_verified == 1)) {
      // return res.send({
      //   code: 200,
      //   message: "Your Email is already Verified."
      // });
      res.sendFile(path.join(__dirname, "../../api/auth/emailAlreadyVerified.html"));
    }

    console.log("UserService: User verification token verified.");
    req.params.token = decoded;
    next();
  } catch (error) {
    console.log("Error verifying access token: ", error);
    if (error.name === "TokenExpiredError")
      return res.status(401).json({ message: "Token expired." });
    return res.status(403).json({ message: "Failed to authenticate token." });
  }
};

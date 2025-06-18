const jwt = require("jsonwebtoken");
const { config } = require("../config");
const User = require("../models/user");

exports.authMiddleware = async (req, res, next) => {
  const userId = req.headers["x-user-id"];
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res
      .status(401)
      .json({ message: "No token provided or invalid token format." });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await User.findUserById(decoded.id);

    if (!user)
      return res
        .status(401)
        .json({ message: "Not authorized, user not found" });

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError")
      return res.status(401).json({ message: "Token expired." });
    return res.status(403).json({ message: "Failed to authenticate token." });
  }
};

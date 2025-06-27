const User = require("../../models/user");
const jwt = require("jsonwebtoken");
const { config } = require("../../config");


// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    delete user.password;
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res
      .status(500)
      .json({ message: "Server error fetching profile", error: error.message });
  }
};

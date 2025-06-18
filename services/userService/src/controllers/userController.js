const User = require("../models/user");
const jwt = require("jsonwebtoken");
const { config } = require("../config");

// Helper function to generate a JWT
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      roles: user.roles,
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
};

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
exports.registerUser = async (req, res) => {
  const { username, email, password, roles } = req.body;

  try {
    let user = await User.findUserByEmail(email);
    if (user) {
      return res
        .status(400)
        .json({ message: "User with that email already exists" });
    }

    const newUser = await User.createUser({
      username,
      email,
      password,
      roles: roles || ["team_member"],
    });

    const token = generateToken(newUser);

    res.status(201).json({
      message: "User registered successfully",
      user: newUser,
      token,
    });
  } catch (error) {
    console.error("Error registering user:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(400)
        .json({
          message:
            "Duplicate entry detected (e.g., username or email already taken).",
        });
    }
    res
      .status(500)
      .json({
        message: "Server error during registration",
        error: error.message,
      });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/users/login
// @access  Public
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await User.comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user);

    res.status(200).json({
      message: "Logged in successfully",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        roles: user.roles,
      },
      token,
    });
  } catch (error) {
    console.error("Error logging in user:", error);
    res
      .status(500)
      .json({ message: "Server error during login", error: error.message });
  }
};

// @desc    Get user profile (example of a protected route)
// @route   GET /api/users/profile
// @access  Private (requires token)
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

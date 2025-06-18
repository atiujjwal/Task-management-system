const express = require('express');
const { registerUser, loginUser, getUserProfile } = require('../controllers/userController');
const { authMiddleware } = require('../middlewares/authMiddlewares');

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Private routes
router.get('/profile',
    // authMiddleware,
    getUserProfile
);

module.exports = router;
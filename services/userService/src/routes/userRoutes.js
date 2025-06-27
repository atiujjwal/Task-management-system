const express = require('express');
const {
    registerUser,
    loginUser,
    forgotPassword,
    logoutUser,
    refreshTokens
} = require('../api/auth/controller');
const {
    verifyRefreshToken,
    verifyAccessToken
} = require('../middlewares/auth/authMiddlewares');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
// router.post('/forgotPassword', forgotPassword);
router.post('/refreshTokens', verifyRefreshToken, refreshTokens);
router.post('/logout', verifyAccessToken, logoutUser);

module.exports = router;
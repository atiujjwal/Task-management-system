const express = require('express');
const path = require("path");
const {
    registerUser,
    loginUser,
    forgotPassword,
    logoutUser,
    refreshTokens,
    verifyEmailAndMobile,
    sendOtp
} = require('../api/auth/controller');
const {
    verifyRefreshToken,
    verifyAccessToken,
    verifyUserVerificationToken
} = require('../middlewares/auth/authMiddlewares');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgotPassword', forgotPassword);
router.post('/refreshTokens', verifyRefreshToken, refreshTokens);
router.post('/logout', verifyAccessToken, logoutUser);
router.post('/sendOtp/:type', sendOtp);


//APIs to verify email and mobile
router.get('/verify/:token', verifyUserVerificationToken, (req, res) => {
    res.sendFile(path.join(__dirname, '../api/auth/verifyEmail.html'));
});
router.post('/verify/:token', verifyUserVerificationToken, verifyEmailAndMobile);


module.exports = router;
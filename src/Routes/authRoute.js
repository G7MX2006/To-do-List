const express = require("express");
const router = express.Router();

const {
  register,
  verifyEmailOTP,
  resendVerificationOTP,
  login,
  forgotPassword,
  resetPassword,
} = require("../Controllers/auth");

const {validate} = require("../Middlewares/validateData");

const {
  registerSchema,
  loginSchema,
  verifyEmailOTPSchema,
  resendVerificationOTPSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require("../validators/authValidator");

const {
  loginLimiter,
  registerLimiter,
  otpSendLimiter,
  otpVerifyLimiter,
} = require("../Middlewares/ratelimiter");

// Register
router.post("/register", registerLimiter, validate(registerSchema), register);

// Verify email using OTP
router.post(
  "/verify-email",
  otpVerifyLimiter,
  validate(verifyEmailOTPSchema),
  verifyEmailOTP,
);

// Resend verification OTP
router.post(
  "/resend-verification",
  otpSendLimiter,
  validate(resendVerificationOTPSchema),
  resendVerificationOTP,
);

// Login
router.post("/login", loginLimiter, validate(loginSchema), login);

// Request password reset OTP
router.post(
  "/forgot-password",
  otpSendLimiter,
  validate(forgotPasswordSchema),
  forgotPassword,
);

// Reset password using OTP
router.post(
  "/reset-password",
  otpVerifyLimiter,
  validate(resetPasswordSchema),
  resetPassword,
);

module.exports = router;

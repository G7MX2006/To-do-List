
const userModel = require("../Models/userModel");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../config/email");

// Generate JWT after successful login
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// Generate a 6-digit OTP
const generateOTP = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

// Store a hash instead of the original OTP
const hashOTP = (otp) => {
  return crypto.createHash("sha256").update(otp).digest("hex");
};

// Create and email an OTP
const createAndSendOTP = async (user, purpose) => {
  const otp = generateOTP();

  user.otpHash = hashOTP(otp);
  user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
  user.otpPurpose = purpose;
  user.otpAttempts = 0;

  await user.save();

  const subject =
    purpose === "email_verification"
      ? "Verify your email"
      : "Reset your password";

  const message =
    `Your OTP is: ${otp}\n\n` +
    "This code expires in 5 minutes. " +
    "Do not share it with anyone.";

  await sendEmail(user.email, subject, message);
};

// Check OTP, purpose, expiry and attempt count
const checkOTP = async (user, otp, purpose) => {
  if (
    !user.otpHash ||
    !user.otpExpires ||
    user.otpPurpose !== purpose ||
    user.otpExpires.getTime() <= Date.now()
  ) {
    return false;
  }

  if (user.otpAttempts >= 5) {
    return false;
  }

  const submittedHash = hashOTP(otp);
  const storedHash = Buffer.from(user.otpHash, "hex");
  const providedHash = Buffer.from(submittedHash, "hex");

  const isValid =
    storedHash.length === providedHash.length &&
    crypto.timingSafeEqual(storedHash, providedHash);

  if (!isValid) {
    user.otpAttempts += 1;
    await user.save();
    return false;
  }

  return true;
};

// Clear OTP data after use
const clearOTP = (user) => {
  user.otpHash = undefined;
  user.otpExpires = undefined;
  user.otpPurpose = undefined;
  user.otpAttempts = 0;
};

// Register
const register = async (req, res) => {
  try {
    const { firstname, secondname, email, password } = req.body;

    if (!firstname || !secondname || !email || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await userModel.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "This email is already registered",
      });
    }

    const user = await userModel.create({
      firstname,
      secondname,
      email: normalizedEmail,
      password,
      emailVerified: false,
    });

    try {
      await createAndSendOTP(user, "email_verification");
    } catch (emailError) {
      console.error("Verification email failed:", emailError.message);

      return res.status(201).json({
        message:
          "Account created, but the verification email could not be sent. Please request a new code.",
        email: user.email,
      });
    }

    return res.status(201).json({
      message: "Account created. Check your email for the verification code.",
      email: user.email,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "This email is already registered",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Verify email OTP
const verifyEmailOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !/^\d{6}$/.test(String(otp || ""))) {
      return res.status(400).json({
        message: "A valid email and 6-digit OTP are required",
      });
    }

    const user = await userModel
      .findOne({ email: email.trim().toLowerCase() })
      .select("+otpHash +otpExpires +otpPurpose +otpAttempts");

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired OTP",
      });
    }

    if (user.emailVerified) {
      return res.status(200).json({
        message: "Email is already verified",
      });
    }

    const isValid = await checkOTP(
      user,
      String(otp),
      "email_verification"
    );

    if (!isValid) {
      return res.status(400).json({
        message: "Invalid, expired, or exhausted OTP attempts",
      });
    }

    user.emailVerified = true;
    clearOTP(user);
    await user.save();

    return res.status(200).json({
      message: "Email verified successfully. You can now log in.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Resend email verification OTP
const resendVerificationOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const user = await userModel.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user) {
      return res.status(200).json({
        message: "If the account exists, a verification email will be sent.",
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        message: "Email is already verified",
      });
    }

    await createAndSendOTP(user, "email_verification");

    return res.status(200).json({
      message: "If the account exists, a verification email will be sent.",
    });
  } catch (error) {
    console.error("Resend verification email failed:", error.message);
    return res.status(500).json({
      message: "Could not send the email. Please try again later.",
    });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await userModel
      .findOne({ email: email.trim().toLowerCase() })
      .select("+password");

    if (!user || !(await bcryptjs.compare(password, user.password))) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in",
      });
    }

    const token = generateToken(user._id.toString());

    res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Login successful",
      user: {
        _id: user._id,
        firstname: user.firstname,
        secondname: user.secondname,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Request a password-reset OTP
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const user = await userModel.findOne({
      email: email.trim().toLowerCase(),
    });

    // Same response whether the account exists or not
    if (!user) {
      return res.status(200).json({
        message: "If the account exists, a password-reset code will be sent.",
      });
    }

    if (!user.emailVerified) {
      return res.status(200).json({
        message: "If the account exists, a password-reset code will be sent.",
      });
    }

    await createAndSendOTP(user, "password_reset");

    return res.status(200).json({
      message: "If the account exists, a password-reset code will be sent.",
    });
  } catch (error) {
    console.error("Password-reset email failed:", error.message);
    return res.status(500).json({
      message: "Could not process the request. Please try again later.",
    });
  }
};

// Verify reset OTP and change password
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (
      !email ||
      !/^\d{6}$/.test(String(otp || "")) ||
      !newPassword
    ) {
      return res.status(400).json({
        message: "Email, 6-digit OTP and new password are required",
      });
    }

    const user = await userModel
      .findOne({ email: email.trim().toLowerCase() })
      .select("+password +otpHash +otpExpires +otpPurpose +otpAttempts");

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired OTP",
      });
    }

    const isValid = await checkOTP(
      user,
      String(otp),
      "password_reset"
    );

    if (!isValid) {
      return res.status(400).json({
        message: "Invalid, expired, or exhausted OTP attempts",
      });
    }

    // Mongoose validates and hashes the new password on save
    user.password = newPassword;
    clearOTP(user);
    await user.save();

    return res.status(200).json({
      message: "Password reset successfully. You can now log in.",
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = {
  register,
  verifyEmailOTP,
  resendVerificationOTP,
  login,
  forgotPassword,
  resetPassword,
};

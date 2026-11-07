const { z } = require("zod");

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Please provide a valid email address");

const otpSchema = z.string().regex(/^\d{6}$/, "OTP must be exactly 6 digits");

const passwordSchema = z
  .string()
  .regex(
    passwordRegex,
    "Password must contain uppercase, lowercase, number, special character and at least 8 characters",
  );

// Register
const registerSchema = z
  .object({
    firstname: z
      .string()
      .trim()
      .min(3, "Firstname must be at least 3 characters")
      .max(16, "Firstname must be at most 16 characters"),

    secondname: z
      .string()
      .trim()
      .min(3, "Secondname must be at least 3 characters")
      .max(16, "Secondname must be at most 16 characters"),

    email: emailSchema,

    password: passwordSchema,

    confirmpassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmpassword, {
    message: "Passwords do not match",
    path: ["confirmpassword"],
  });

// Login
const loginSchema = z.object({
  email: emailSchema,

  password: z
    .string()
    .min(1, "Password is required")
    .max(100, "Password is too long"),
});

// Verify email OTP
const verifyEmailOTPSchema = z.object({
  email: emailSchema,
  otp: otpSchema,
});

// Resend email verification OTP
const resendVerificationOTPSchema = z.object({
  email: emailSchema,
});

// Forgot password
const forgotPasswordSchema = z.object({
  email: emailSchema,
});

// Reset password
const resetPasswordSchema = z.object({
  email: emailSchema,
  otp: otpSchema,
  newPassword: passwordSchema,
});

module.exports = {
  registerSchema,
  loginSchema,
  verifyEmailOTPSchema,
  resendVerificationOTPSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};


const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
      required: [true, "firstname must be provided"],
      minlength: [3, "firstname must be at least 3 characters"],
      maxlength: [16, "firstname must be at most 16 characters"],
      trim: true,
    },

    secondname: {
      type: String,
      required: [true, "secondname must be provided"],
      minlength: [3, "secondname must be at least 3 characters"],
      maxlength: [16, "secondname must be at most 16 characters"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "email must be provided"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
        "Please provide a valid email address",
      ],
    },

    password: {
      type: String,
      required: [true, "password must be provided"],
      select: false,
      match: [
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        "Password must contain uppercase, lowercase, number, special character and at least 8 characters",
      ],
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    otpHash: {
      type: String,
      select: false,
    },

    otpExpires: {
      type: Date,
      select: false,
    },

    otpPurpose: {
      type: String,
      enum: ["email_verification", "password_reset"],
      select: false,
    },

    otpAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
  },
  {
    timestamps: true,
    collection: "User",
  }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcryptjs.genSalt(10);
  this.password = await bcryptjs.hash(this.password, salt);
});

const User = mongoose.model("User", userSchema);

module.exports = User;

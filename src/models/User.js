import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["admin", "lecturer", "student"],
      required: true,
    },

    indexNumber: {
      type: String,
      default: null,
    },

    staffId: {
      type: String,
      default: null,
    },
    isVerified: {
  type: Boolean,
  default: false,
},

verificationCode: {
  type: String,
  default: null,
},

verificationCodeExpires: {
  type: Date,
  default: null,
},

    department: {
      type: String,
      default: null,
    },

    level: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
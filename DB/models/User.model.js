import { systemRoles } from "../../scr/Utlis/system-roles.js"
import mongoose from "mongoose";

const userschema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 20,
    tirm: true,
    lowercase: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    tirm: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
  },
  phoneNumbers: [{
    type: String,
    required: true,
  }],
  addresses: [{
    type: String,
    required: true
  }],
  role: {
    type: String,
    enum: [systemRoles.USER, systemRoles.ADMIN,systemRoles.SUPER_ADMIN],
    default: systemRoles.USER
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  age: {
    type: Number,
    min: 18,
    max: 100
  },
  isLoggedIn: {
    type: Boolean,
    default: false
  }
},
  {
    timestamps: true, toJSON: { virtuals: true }
  })

const User = mongoose.model('User', userschema)

export default User
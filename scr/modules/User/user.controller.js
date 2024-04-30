
import bcrypt from 'bcryptjs'
import Jwt from 'jsonwebtoken'
import User from '../../../DB/models/User.model.js'
import { generateOTP } from '../../Utlis/generate-otp.js'
import sendEmailService from '../services/send-email.services.js'
//=============================== Update Profile User ==============================//
export const updateAccount = async (req, res, next) => {
    // Destructure the required data from the request body
    const { _id } = req.authUser;
    const { username, email, age, phoneNumbers, addresses } = req.body;

    // Check if the email already exists
    const isEmailExists = await User.findOne({ email });
    if (isEmailExists) return next({ cause: 400, message: "Email already exists" });

    // Update user profile
    const updateProfile = await User.findByIdAndUpdate({ _id }, {
        username,
        email,
        age,
        phoneNumbers,
        addresses
    });

    // Send response with updated profile data
    res.status(200).json({ success: true, message: 'User Profile updated successfully', data: updateProfile });
}

export const updatePassword = async (req, res, next) => {
    // Get data from request
    const { password } = req.body;
    // Check if the user is logged in
    const { _id, password: hashedPassword } = req.authUser;
    
    // Hash the new password
    const hashPass = bcrypt.hashSync(password, +process.env.SALT_ROUNDS);
    
    // Update the password
    const updatedUser = await User.findByIdAndUpdate({ _id }, { password: hashPass }, { new: true });

    // Check if the password update was successful
    if (!updatedUser) {
        return res.status(400).json({ message: 'Failed to update password' });
    }
    
    // Password updated successfully
    return res.status(200).json({ message: 'Password updated successfully', data: updatedUser });
}

export const deleteAccount = async (req, res, next) => {
    // Check user must be logged in
    const { _id } = req.authUser;

    // Delete user 
    const deleteUser = await User.findByIdAndDelete({ _id });

    // Check if user was deleted successfully
    if (!deleteUser) { 
        return res.status(400).json({ message: 'Deletion failed' }); 
    }
    
    // Send success message
    res.status(200).json({ message: 'Deleted successfully' });
}

export const SoftDeleteAccount = async (req, res, next) => {
    // Check user must be logged in
    const { _id } = req.authUser;

    // Soft delete user 
    const softDeleteUser = await User.findByIdAndUpdate({ _id }, { isAccountDeleted: true });

    // Check if user was soft deleted successfully
    if (!softDeleteUser) { 
        return res.status(400).json({ message: 'Deletion failed' }); 
    }
    
    // Send success message
    res.status(200).json({ message: 'Deleted successfully' });
}
export const getProfileData = async (req, res, next) => {
    // Check if user is logged in
    const { _id } = req.authUser;
    // Get profile data by user ID
    const ProfileData = await User.findById(_id);
    if (!ProfileData) { 
        return res.status(400).json({ message: 'Profile data not found' }); 
    }
    // Send profile data in response
    res.status(200).json({ message: 'Profile data retrieved successfully', ProfileData });
}

export const ForgetPassword = async (req, res, next) => {
    // Get data from request
    const { email } = req.body;
    // Check if user exists with the provided email
    const user = await User.findOne({ email });
    if (!user) return next(new Error('Sorry, but there is no account registered with this email', { cause: 409 }));

    // Generate OTP
    const otp = generateOTP();
    // Generate JWT token
    const Token = Jwt.sign({ email }, 'ForgetPasswordSecretCode', { expiresIn: '7d' });

    // Send email with OTP
    const isEmailSent = await sendEmailService({
        to: email,
        subject: 'Account Protection',
        message: `<h1>To reset your password, please enter the following single-use code:</h1>
        <b style="font-size: 50px; text-align: center">Code: ${otp}</b>`
    });

    // Check if email sending failed
    if (!isEmailSent) {
        return next(new Error('Email is not sent, please try again later', { cause: 500 }));
    }

    // Update user's OTP field
    user.passwordResetOtp = otp;
    await user.save();

    return res.status(200).json({ message: 'Please check your email to change your password' });
}

export const ResetPassword = async (req, res, next) => {
    // Get data from request
    const { sentOtp, newPassword } = req.body;

    // Find user by OTP
    const user = await User.findOne({ passwordResetOtp: sentOtp });

    // Check if user with OTP exists
    if (!user) {
        next(new Error('Invalid OTP', { cause: 404 }));
    }

    // Hash the new password
    const hashedPassword = bcrypt.hashSync(newPassword, 9);

    // Update user's password and clear OTP
    user.password = hashedPassword;
    user.passwordResetOtp = null;
    await user.save();

    // Send success response
    res.status(200).json({ message: "Password updated successfully" });
}

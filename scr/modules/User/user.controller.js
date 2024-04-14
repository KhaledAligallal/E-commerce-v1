
import bcrypt from 'bcryptjs'
import Jwt from 'jsonwebtoken'
import User from '../../../DB/models/User.model.js'
import { generateOTP } from '../../Utlis/generate-otp.js'
import sendEmailService from '../services/send-email.services.js'
//=============================== Update Profile User ==============================//
export const updateAccount = async (req, res, next) => {

    // * destructuring the required data from the request body
    const { _id } = req.authUser
    const {
        username,
        email,
        password,
        oldPassword,
        age,
        phoneNumbers,
        addresses } = req.body

    // check email 
    const isEmailexists = await User.findOne({ email })
    if (isEmailexists) return next({ cause: 400, message: "email is already exists" })
    //old password check
    const isOldPassword = bcrypt.compareSync(oldPassword, req.authUser.password)
    if (!isOldPassword) return next({ cause: 400, message: "old password is incorrect" })
    //hash password
    const hashPassword = bcrypt.hashSync(password, +process.env.SALT_ROUNDS)
    // update user profile
    const updateProfile = await User.findByIdAndUpdate({ _id }, {
        username,
        email,
        password: hashPassword,
        age,
        phoneNumbers,
        addresses
    })
    res.status(200).json({ success: true, message: 'User Profile updated successfully', data: updateProfile })

}

export const deleteAccount = async (req, res, next) => {

    //check user must be logged in
    const { _id } = req.authUser

    // delete user 
    const deleteUser = await User.findByIdAndDelete({ _id })

    if (!deleteUser) { return res.status(400).json({ message: 'deleted failed' }) }
    res.status(200).json({ message: 'deleted successfully' })

}


export const SoftDeleteAccount = async (req, res, next) => {

    //check user must be logged in
    const { _id } = req.authUser

    // delete user 
    const deleteUser = await User.findByIdAndUpdate({ _id },{isAccountDeleted:true})

    if (!deleteUser) { return res.status(400).json({ message: 'deleted failed' }) }
    res.status(200).json({ message: 'deleted successfully' })

}



export const getProfileData = async (req, res, next) => {
    //check user must be logged in
    const { _id } = req.authUser
//get profile data by id
    const ProfileData = await User.findById(_id)
    if (!ProfileData) { return res.status(400).json({ message: 'not found' }) }
    res.status(200).json({ message: 'done', ProfileData })


}
export const ForgetPassword = async (req, res, next) => {

    // get data from request
    const { email } = req.body
    // check  mobileNumber
    const user = await User.findOne({ email })
    if (!user) return next(new Error('Sorry, but there is no account registered with this email ', { cause: 409 }))

    const otp = generateOTP()
    const Token = Jwt.sign({ email }, ' ForgetPasswordSecretCode', { expiresIn: '7d' })


    const isEmailSent = await sendEmailService({

        to: email,
        subject: 'account protection',       
        message: `<h1>To be safe, to reset the password for this account,
         you will need to confirm your identity by entering the following single-use code </h1>
        <b style="font-size: 50px ; text-align: center">code is  ${otp}  </b>`

    })
    if (!isEmailSent) {
        return next(new Error('Email is not sent, please try again later', { cause: 500 }))
    }
    // Update user's OTP field
    user.passwordResetOtp = otp
    await user.save()
    //  console.log(otp);
    return res.status(200).json({ message: 'please check your email to chenge your password' })
}

export const ResetPassword = async (req, res, next) => {

    const { sentOtp, newPassword } = req.body

    // Find user by email
    const user = await User.findOne({ passwordResetOtp:sentOtp })

    if (!user) {
        next(new Error('userOTP is not found', { cause: 404 }))
    }
    // hash new password
    const hashedPassword = bcrypt.hashSync(newPassword, 9)
    // Update user's password
    user.password = hashedPassword;
    user.passwordResetOtp = null;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
}


import bcrypt from 'bcryptjs'
import Jwt from 'jsonwebtoken'
import User from '../../../DB/models/User.model.js'

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

export const getProfileData = async (req, res, next) => {
    //check user must be logged in
    const { _id } = req.authUser
//get profile data by id
    const ProfileData = await User.findById(_id)
    if (!ProfileData) { return res.status(400).json({ message: 'not found' }) }
    res.status(200).json({ message: 'done', ProfileData })


}
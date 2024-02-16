import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

import User from "../../../DB/models/User.model.js"
import sendEmailService from '../services/send-email.services.js'


// ========================================= SignUp API ================================//

/**
 * destructuring the required data from the request body
 * check if the user already exists in the database using the email
 * if exists return error email is already exists
 * password hashing
 * create new document in the database
 * return the response
 */
//================================================== SIGNUP API =============================//
export const signUp = async (req, res, next) => {
    // 1- destructure the required data from the request body 
    const {
        username,
        email,
        password,
        age,
        role,
        phoneNumbers,
        addresses,
    } = req.body


    // 2- check if the user already exists in the database using the email
    const isEmailDuplicated = await User.findOne({ email })
    if (isEmailDuplicated) {
        return next(new Error('Email already exists,Please try another email', { cause: 409 }))
    }
    const userToken = jwt.sign({ email }, process.env.JWT_SECRET_VERFICATION, { expiresIn: '45d' })


    const isEmailSent = await sendEmailService({

        to: email,
        subject: 'email verification',
        message: `<h1>please verify your email</h1>
   <a href="http://localhost:3000/auth/verify-email?token=${userToken}">Verify Email</a>
    `

    })
    if (!isEmailSent) {
        return next(new Error('Email is not sent, please try again later', { cause: 500 }))
    }


    // 5- password hashing
    const hashedPassword = bcrypt.hashSync(password, +process.env.SALT_ROUNDS)

    // 6- create new document in the database
    const newUser = await User.create({
        username,
        email,
        password: hashedPassword,
        age,
        role,
        phoneNumbers,
        addresses,
    })

    // 7- return the response
    res.status(201).json({
        success: true,
        message: 'User created successfully, please check your email to verify your account',
        data: newUser
    })
}

// ========================================= VerifyEmail API ================================//
export const verifyEmail = async (req, res, next) => {
    const { token } = req.query
    const decodedData = jwt.verify(token, process.env.JWT_SECRET_VERFICATION)
    // get uset by email , isEmailVerified = false
    const user = await User.findOneAndUpdate({
        email: decodedData.email, isEmailVerified: false
    }, { isEmailVerified: true }, { new: true })
    if (!user) {
        return next(new Error('User not found', { cause: 404 }))
    }

    res.status(200).json({
        success: true,
        message: 'Email verified successfully, please try to login'
    })
}
// ========================================= SignIn API ================================//
export const signIn = async (req, res, next) => {
    // * destructuring the required data from the request body
    const { email, password } = req.body
    //check is email exists and verified
    const user = await User.findOne({ email, isEmailVerified: true })
    if (!user) {
        return next(new Error('Email is not exists,Please try another email', { cause: 409 }))
    }
    //check is password correct 
    const isPasswordValid = bcrypt.compareSync(password, user.password)
    if (!isPasswordValid) {
        return next(new Error('Invalid login credentails', { cause: 404 }))
    }
    // generate login token
    const token = jwt.sign({ email, id: user._id, loggedIn: true }, process.env.JWT_SECRET_LOGIN, { expiresIn: '1d' })
    // updated isLoggedIn = true  in database
    user.isLoggedIn = true

    await user.save()

    res.status(200).json({
        success: true,
        message: 'User logged in successfully',
        data: {
            token
        },
        loggedIn: user.isLoggedIn
    })
}























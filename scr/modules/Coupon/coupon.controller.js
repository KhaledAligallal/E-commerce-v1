import CouponUsers from '../../../DB/models/coupon-users.model.js'
import Coupon from '../../../DB/models/coupon.model.js'
import User from '../../../DB/models/User.model.js'
import { applyCouponValidation } from '../../Utlis/coupon.validation.js'

export const addCoupon = async (req, res, next) => {


    const { couponCode, couponAmount, isFixed, isPercentage, fromDate, toDate,Users } = req.body
    const { _id: addedBy } = req.authUser

    const isCouponCodeExists = await Coupon.findOne({ couponCode })

    if (isCouponCodeExists) return next({ message: 'coupon code is alrady exists', cause: 404 })
    if (isFixed == isPercentage) return next({ message: 'coupon can be either fixed or precentage ', cause: 404 })

    if (isPercentage) {
        if (couponAmount > 100) return next({ message: "Percentage should be less than 100", cause: 400 })
    }
    const couponOpj = {
        couponCode,
        couponAmount,
        isFixed,
        isPercentage,
        fromDate,
        toDate,
        addedBy
        

    }

    const newCoupon = await Coupon.create(couponOpj)

    const userIds = []
    for (const user of Users) {
        userIds.push(user.userId)
    }
    const isUserExist = await User.find({ _id: { $in: userIds } })
    if (isUserExist.length != Users.length) return next({ message: "User not found", cause: 404 })


    const couponUsers = await CouponUsers.create(
        Users.map(ele => ({ ...ele, couponId: newCoupon._id }))
    )
    res.status(201).json({ message: "Coupon added successfully", newCoupon, couponUsers })

}

export const validteCouponApi = async (req, res, next) => {
    const { code } = req.body
    const { _id: userId } = req.authUser 

    // applyCouponValidation
    const isCouponValid = await applyCouponValidation(code, userId)
    if (isCouponValid.status) {
        return next({ message: isCouponValid.msg, cause: isCouponValid.status })
    }

    res.json({ message: 'coupon is valid', coupon: isCouponValid })

}

import CouponUsers from '../../../DB/models/coupon-users.model.js'
import Coupon from '../../../DB/models/coupon.model.js'
import User from '../../../DB/models/User.model.js'
import { applyCouponValidation } from '../../Utlis/coupon.validation.js'
import { APIFeatures } from '../../Utlis/api-features.js'


export const addCoupon = async (req, res, next) => {


    const { couponCode, couponAmount, isFixed, isPercentage, fromDate, toDate, Users } = req.body
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

export const disableCoupon = async (req, res, next) => {
    const { couponId } = req.params
    const { _id: user } = req.authUser
    const updatedCoupon = await Coupon.findByIdAndUpdate
        (couponId, {
            isEnabled: false,
            disabledAt: new Date(),
            disabledBy: user
        },
            { new: true });
    if (!updatedCoupon) {
        return next({ message: 'Coupon not found', cause: 404 })
    }

    res.json({ message: 'Coupon disabled successfully', coupon: updatedCoupon });

}
export const enableCoupon = async (req, res, next) => {
    const { couponId } = req.params
    const { _id: user } = req.authUser
    const updatedCoupon = await Coupon.findByIdAndUpdate
        (couponId, {
            isEnabled: true,
            enabledAt: new Date(),
            enabledBy: user
        },
            { new: true });
    if (!updatedCoupon) {
        return next({ message: 'Coupon not found', cause: 404 })
    }

    res.json({ message: 'Coupon enabled successfully', coupon: updatedCoupon });

}


export const getAllCoupons = async (req, res, next) => {

    const { page, size, sort, ...search } = req.query
    const features = new APIFeatures(req.query, Coupon.find())
        .pagination({ page, size })
        .sort(sort)
        .filters(search)


    const allCoupons = await features.mongooseQuery

    res.status(200).json({ success: true, message: 'Coupons fetched successfully', data: allCoupons })


}


export const getCouponById = async (req, res, next) => {
    const { couponId } = req.params

    const coupon = await Coupon.findById(couponId)
    if (!coupon) return next({ cause: 404, message: 'coupon not found' })

    res.status(200).json({ success: true, message: 'coupon fetched successfully', data: coupon })
}

//.............................. update coupon ............................
export const updateCoupon = async (req, res, next) => {
    //  destructuring data from body
    const { couponCode, couponAmount, isFixed, isPercentage, fromDate, toDate, isEnabled } = req.body
    const { couponId } = req.params
    const { _id: updatedBy } = req.authUser

    // check if the coupon code is already exist
    const coupon = await Coupon.findById(couponId)
    if (!coupon) return next({ message: 'Coupon not found', cause: 404 })


    if (updatedBy.toString() !== coupon.addedBy.toString()) {
        return next({ message: 'You are not the owner of this coupon', cause: 401 })
    }

    //check if the coupon code is already exist
    if (couponCode) {
        const isCouponCodeDuplicated = await Coupon.findOne({ couponCode })
        if (isCouponCodeDuplicated) return next({ cause: 404, message: 'Coupon code already exist' })

        coupon.couponCode = couponCode
    }

    coupon.couponAmount = couponAmount;
    coupon.isEnabled = isEnabled;
    coupon.updatedBy = updatedBy;
    coupon.updatedAt = new Date();

    if (isFixed || isPercentage) {
        // check that isfixed and isPercentage is not equal
        if (isFixed == isPercentage) {
            return next({ cause: 400, message: 'coupon can be either isFixed or isPercentage' })
        }

        //  check that if ispercentage doesnt exceed 100
        if (isPercentage) {
            if (couponAmount > 100) return next({ cause: 400, message: 'Percentage should be less than 100' })
        }

        coupon.isFixed = isFixed;
        coupon.isPercentage = isPercentage;
    }

    coupon.fromDate = fromDate
    coupon.toDate = toDate

    if (isEnabled) {
        coupon.enabledBy = updatedBy;
        coupon.enabledAt = new Date();
        coupon.disabledBy = undefined;
        coupon.disabledAt = undefined;
    } else {
        coupon.disabledBy = updatedBy;
        coupon.disabledAt = new Date();
        coupon.enabledBy = undefined;
        coupon.enabledAt = undefined;
    }

    await coupon.save()

    res.status(200).json({ message: 'Coupon updated successfully', coupon });
}


import CouponUsers from '../../../DB/models/coupon-users.model.js'
import Coupon from '../../../DB/models/coupon.model.js'
import User from '../../../DB/models/User.model.js'
import { applyCouponValidation } from '../../Utlis/coupon.validation.js'
import { APIFeatures } from '../../Utlis/api-features.js'

// Controller function to add a new coupon
export const addCoupon = async (req, res, next) => {
    // Destructuring request body
    const { couponCode, couponAmount, isFixed, isPercentage, fromDate, toDate, Users } = req.body;
    const { _id: addedBy } = req.authUser;

    // Checking if the coupon code already exists
    const isCouponCodeExists = await Coupon.findOne({ couponCode });
    if (isCouponCodeExists) return next({ message: 'coupon code is already exists', cause: 404 });

    // Checking if the coupon type is either fixed or percentage
    if (isFixed === isPercentage) return next({ message: 'coupon can be either fixed or percentage', cause: 404 });

    // Validating percentage coupon amount
    if (isPercentage) {
        if (couponAmount > 100) return next({ message: "Percentage should be less than 100", cause: 400 });
    }

    // Creating coupon object
    const couponObj = {
        couponCode,
        couponAmount,
        isFixed,
        isPercentage,
        fromDate,
        toDate,
        addedBy
    };

    // Creating the new coupon
    const newCoupon = await Coupon.create(couponObj);

    // Checking if all users exist
    const userIds = Users.map(user => user.userId);
    const isUserExist = await User.find({ _id: { $in: userIds } });
    if (isUserExist.length !== Users.length) return next({ message: "User not found", cause: 404 });

    // Creating coupon users
    const couponUsers = await CouponUsers.create(
        Users.map(ele => ({ ...ele, couponId: newCoupon._id }))
    );

    // Sending success response
    res.status(201).json({ message: "Coupon added successfully", newCoupon, couponUsers });
};

// Controller function to validate a coupon
export const validteCouponApi = async (req, res, next) => {
    // Destructuring request body
    const { code } = req.body;
    const { _id: userId } = req.authUser;

    // Validating the coupon
    const isCouponValid = await applyCouponValidation(code, userId);
    if (isCouponValid.status) {
        return next({ message: isCouponValid.msg, cause: isCouponValid.status });
    }

    // Sending response if coupon is valid
    res.json({ message: 'coupon is valid', coupon: isCouponValid });
};

// Controller function to disable a coupon
export const disableCoupon = async (req, res, next) => {
    // Extracting coupon ID from request parameters
    const { couponId } = req.params;
    const { _id: user } = req.authUser;

    // Disabling the coupon
    const updatedCoupon = await Coupon.findByIdAndUpdate(
        couponId,
        {
            isEnabled: false,
            disabledAt: new Date(),
            disabledBy: user
        },
        { new: true }
    );

    // Sending response if coupon is not found
    if (!updatedCoupon) {
        return next({ message: 'Coupon not found', cause: 404 });
    }

    // Sending success response
    res.json({ message: 'Coupon disabled successfully', coupon: updatedCoupon });
};

// Controller function to enable a coupon
export const enableCoupon = async (req, res, next) => {
    // Extracting coupon ID from request parameters
    const { couponId } = req.params;
    const { _id: user } = req.authUser;

    // Enabling the coupon
    const updatedCoupon = await Coupon.findByIdAndUpdate(
        couponId,
        {
            isEnabled: true,
            enabledAt: new Date(),
            enabledBy: user
        },
        { new: true }
    );

    // Sending response if coupon is not found
    if (!updatedCoupon) {
        return next({ message: 'Coupon not found', cause: 404 });
    }

    // Sending success response
    res.json({ message: 'Coupon enabled successfully', coupon: updatedCoupon });
};

// Controller function to fetch all coupons with pagination, sorting, and filtering
export const getAllCoupons = async (req, res, next) => {
    const { page, size, sort, ...search } = req.query;
    const features = new APIFeatures(req.query, Coupon.find())
        .pagination({ page, size })
        .sort(sort)
        .filters(search);

    const allCoupons = await features.mongooseQuery;

    res.status(200).json({ success: true, message: 'Coupons fetched successfully', data: allCoupons });
}

// Controller function to fetch a coupon by its ID
export const getCouponById = async (req, res, next) => {
    const { couponId } = req.params;

    const coupon = await Coupon.findById(couponId);
    if (!coupon) return next({ cause: 404, message: 'coupon not found' });

    res.status(200).json({ success: true, message: 'coupon fetched successfully', data: coupon });
}

// Controller function to update a coupon
export const updateCoupon = async (req, res, next) => {
    // Destructuring data from request body
    const { couponCode, couponAmount, isFixed, isPercentage, fromDate, toDate, isEnabled } = req.body;
    const { couponId } = req.params;
    const { _id: updatedBy } = req.authUser;

    // Check if the coupon exists
    const coupon = await Coupon.findById(couponId);
    if (!coupon) return next({ message: 'Coupon not found', cause: 404 });

    // Check if the user is the owner of the coupon
    if (updatedBy.toString() !== coupon.addedBy.toString()) {
        return next({ message: 'You are not the owner of this coupon', cause: 401 });
    }

    // Check if the coupon code is already exists
    if (couponCode) {
        const isCouponCodeDuplicated = await Coupon.findOne({ couponCode });
        if (isCouponCodeDuplicated) return next({ cause: 404, message: 'Coupon code already exist' });

        coupon.couponCode = couponCode;
    }

    // Update coupon details
    coupon.couponAmount = couponAmount;
    coupon.isEnabled = isEnabled;
    coupon.updatedBy = updatedBy;
    coupon.updatedAt = new Date();

    // Validate coupon type (isFixed or isPercentage)
    if (isFixed || isPercentage) {
        if (isFixed == isPercentage) {
            return next({ cause: 400, message: 'coupon can be either isFixed or isPercentage' });
        }

        if (isPercentage) {
            if (couponAmount > 100) return next({ cause: 400, message: 'Percentage should be less than 100' });
        }

        coupon.isFixed = isFixed;
        coupon.isPercentage = isPercentage;
    }

    // Update coupon validity dates
    coupon.fromDate = fromDate;
    coupon.toDate = toDate;

    // Update coupon enabled/disabled status
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

    // Save the updated coupon
    await coupon.save();

    res.status(200).json({ message: 'Coupon updated successfully', coupon });
}

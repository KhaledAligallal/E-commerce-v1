import Order from "../../../DB/models/order.model.js";
import { applyCouponValidation } from "../../Utlis/coupon.validation.js";
import { checkProductAvailability } from "../Cart/utlis/check-product-in-db.js"
import CouponUsers from "../../../DB/models/coupon-users.model.js"
import { qrCodeGeneration } from "../../Utlis/QR-code.js"



export const createOrder = async (req, res, next) => {
    //destructure the request body
    const {product,quantity,couponCode,paymentMethod,phoneNumbers,address,city, postalCode,country}= req.body

//console.log(req.body);
    const { _id: user } = req.authUser
//console.log(req.authUser);
    // coupon code check
    let coupon = null;
    if (couponCode) {
        const isCouponValid = await applyCouponValidation(couponCode, user);
        if (isCouponValid.status) return next({ message: isCouponValid.message, cause: isCouponValid.status });
        coupon = isCouponValid;

    }
    console.log(coupon);

    // product check
    const isProductAvailable = await checkProductAvailability(product, quantity);
    if (!isProductAvailable) return next({ message: 'Product is not available', cause: 400 });

    let orderItems = [{
        title: isProductAvailable.title,
        quantity,
        price: isProductAvailable.appliedPrice,
        product: isProductAvailable._id
    }]

//console.log(orderItems);
    //prices
    let shippingPrice = orderItems[0].price * quantity;
    let totalPrice = shippingPrice;

    console.log(shippingPrice, totalPrice);
    console.log(!(coupon?.couponAmount <= shippingPrice));

    if (coupon?.isFixed && !(coupon?.couponAmount <= shippingPrice)) return next({ message: 'You cannot use this coupon', cause: 400 });

    if (coupon?.isFixed) {
        totalPrice = shippingPrice - coupon.couponAmount;
    } else if (coupon?.isPercentage) {
        totalPrice = shippingPrice - (shippingPrice * coupon.couponAmount / 100);
    }



    // order status + paymentmethod
    let orderStatus;
    if (paymentMethod === 'Cash') orderStatus = 'Placed';
//console.log(order);
    // create order
    const order = new Order({
        user,
        orderItems,
        shippingAddress: { address, city, postalCode, country },
        phoneNumbers,
        shippingPrice,
        coupon: coupon?._id,
        totalPrice,
        paymentMethod,
        orderStatus
    });

    await order.save();

    isProductAvailable.stock -= quantity;
    await isProductAvailable.save();

    if (coupon) {

        await CouponUsers.updateOne({ couponId: coupon._id, userId: user }, { $inc: { usageCount: 1 } });
    }


    // generate QR code
    const orderQR = await qrCodeGeneration([{ orderId: order._id, user: order.user, totalPrice: order.totalPrice, orderStatus: order.orderStatus }]);
    res.status(201).json({ message: 'Order created successfully', orderQR });

}

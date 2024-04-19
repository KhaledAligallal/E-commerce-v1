import Order from "../../../DB/models/order.model.js";
import { applyCouponValidation } from "../../Utlis/coupon.validation.js";
import { checkProductAvailability } from "../Cart/utlis/check-product-in-db.js"
import CouponUsers from "../../../DB/models/coupon-users.model.js"
import { qrCodeGeneration } from "../../Utlis/QR-code.js"
import { getUserCart } from "../Cart/utlis/get-user-cart.js";
import Cart from "../../../DB/models/cart.model.js"
import Product from "../../../DB/models/product.model.js";
import { DateTime } from "luxon";
import { nanoid } from "nanoid";
import createInvoice from "../../Utlis/Pdfkit.js";
import sendEmailService from "../services/send-email.services.js";
import path  from "pdfkit";
import { createCheckoutSession, createPaymentIntent, createStripeCoupon, refundPaymentIntent } from "../Payment-handler/stripe.js";

export const createOrder = async (req, res, next) => {
    //destructure the request body
    const { product, quantity, couponCode, paymentMethod, phoneNumbers, address, city, postalCode, country } = req.body


    const { _id: user } = req.authUser

    // coupon code check
    let coupon = null;
    if (couponCode) {
        const isCouponValid = await applyCouponValidation(couponCode, user);
        if (isCouponValid.status) return next({ message: isCouponValid.msg, cause: isCouponValid.status });
        coupon = isCouponValid;

    }
   

    // product check
    const isProductAvailable = await checkProductAvailability(product, quantity);
    if (!isProductAvailable) return next({ message: 'Product is not available', cause: 400 });

    let orderItems = [{
        title: isProductAvailable.title,
        quantity,
        price: isProductAvailable.appliedPrice,
        product: isProductAvailable._id
    }]


    //prices
    let shippingPrice = orderItems[0].price * quantity;
    let totalPrice = shippingPrice;


    if (coupon?.isFixed && !(coupon?.couponAmount <= shippingPrice)) return next({ message: 'You cannot use this coupon', cause: 400 });

    if (coupon?.isFixed) {
        totalPrice = shippingPrice - coupon.couponAmount;
    } else if (coupon?.isPercentage) {
        totalPrice = shippingPrice - (shippingPrice * coupon.couponAmount / 100);
    }



    // order status + paymentmethod
    let orderStatus;
    if (paymentMethod === 'Cash') orderStatus = 'Placed';

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
    // invoice creation
    const orderCode = `${req.authUser.username}_${nanoid(3)}`; // Use backticks for string interpolation
    // generate invoice object
    const orderInvoice = {
        shipping: {
            name: req.authUser.userName,
            address: address,
            city: city,
            state: 'cairo', // Assuming 'cairo' is the default state
            country: country
        },
        orderCode,
        date: order.createdAt,
        items: orderItems,
        subTotal: shippingPrice, // Assuming shippingPrice represents the subtotal
        paidAmount: totalPrice // Assuming totalPrice represents the paid amount
    };


    await createInvoice(orderInvoice, `${orderCode}.pdf`); // Correctly pass the pathVar argument
await sendEmailService({

    to : req.authUser.email,
    subject : 'Your order has been placed',
    message : `<h1>Hi ${req.authUser.userName}</h1>
    <h2>Your order has been placed</h2>
    <h3>Your order code is: ${orderCode}</h3>
    <h3>Your order date is: ${order.createdAt}</h3>`,
    attachments: [
        {
            path:`./Files/${orderCode}.pdf`
        }
    ]

})

    res.status(201).json({ message: 'Order created successfully',order, orderQR });

}

export const convertFromcartToOrder = async (req, res, next) => {
    //destructure the request body
    const {
        couponCode,
        paymentMethod,
        phoneNumbers,
        address,
        city,
        postalCode,
        country
    } = req.body

    const { _id: user } = req.authUser
    // cart items
    const userCart = await getUserCart(user);
    if (!userCart) return next({ message: 'Cart not found', cause: 404 });

    // coupon code check
    let coupon = null;
    if (couponCode) {
        const isCouponValid = await applyCouponValidation(couponCode, user);
        if (isCouponValid.status) return next({ message: isCouponValid.msg, cause: isCouponValid.status });
        coupon = isCouponValid;

    }

    // product check
    let orderItems = userCart.products.map(cartItem => {
        return {
            title: cartItem.title,
            quantity: cartItem.quantity,
            price: cartItem.basePrice,
            product: cartItem.productId
        }
    });


    //prices
    let shippingPrice = userCart.subTotal;
    let totalPrice = shippingPrice;

    if (coupon?.isFixed && !(coupon?.couponAmount <= shippingPrice)) return next({ message: 'You cannot use this coupon', cause: 400 });

    if (coupon?.isFixed) {
        totalPrice = shippingPrice - coupon.couponAmount;
    } else if (coupon?.isPercentage) {
        totalPrice = shippingPrice - (shippingPrice * coupon.couponAmount / 100);
    }

    // order status + paymentmethod
    let orderStatus;
    if (paymentMethod === 'Cash') orderStatus = 'Placed';

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

    await Cart.findByIdAndDelete(userCart._id);

    for (const item of order.orderItems) {
        await Product.updateOne({ _id: item.product }, { $inc: { stock: -item.quantity } })
    }

    if (coupon) {
        await CouponUsers.updateOne({ couponId: coupon._id, userId: user }, { $inc: { usageCount: 1 } });
    }

    res.status(201).json({ message: 'Order created successfully', order });

}


export const delieverOrder = async (req, res, next) => {
    const { orderId } = req.params;

    const updateOrder = await Order.findOneAndUpdate({
        _id: orderId,
        orderStatus: { $in: ['Paid', 'Placed'] }
    }, {
        orderStatus: 'Delivered',
        deliveredAt: DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss'),
        deliveredBy: req.authUser._id,
        isDelivered: true
    }, {
        new: true
    })

    if (!updateOrder) return next({ message: 'Order not found or cannot be delivered', cause: 404 });

    res.status(200).json({ message: 'Order delivered successfully', order: updateOrder });
}


export const cancelOrder = async (req, res) => {

    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
        return res.status(404).json({ message: 'Order not found' });
    }

    // Check if the order was created within the last 24 hours
    const currentTime = new Date();
    const creationTime = new Date(order.createdAt);
    const hoursDiff = (currentTime - creationTime) / (1000 * 60 * 60);

    if (hoursDiff > 24) {
        return res.status(400).json({ message: 'Cannot cancel order after 24 hours' });
    }

    // Update order status to "canceled"
    order.orderStatus = 'Cancelled';
    await order.save();

    res.json({ message: 'Order canceled successfully', order });
} 

export const payWithStripe = async (req, res, next) => {
    const {orderId}= req.params;
    const {_id:userId} = req.authUser;

    // get order details from our database
    const order = await Order.findOne({_id:orderId , user: userId , orderStatus: 'Pending'});
    if(!order) return next({message: 'Order not found or cannot be paid', cause: 404});

    const paymentObject = {
        customer_email:req.authUser.email,
        metadata:{orderId: order._id.toString()},
        discounts:[],
        line_items:order.orderItems.map(item => {
            return {
                price_data: {
                    currency: 'EGP',
                    product_data: {
                        name: item.title,
                    },
                    unit_amount: item.price * 100, // in cents
                },
                quantity: item.quantity,
            }
        })
    }
    // coupon check 
    if(order.coupon){
        const stripeCoupon = await createStripeCoupon({couponId: order.coupon});
        if(stripeCoupon.status) return next({message: stripeCoupon.message, cause: 400});

        paymentObject.discounts.push({
            coupon: stripeCoupon.id
        });
    }
    

    const checkoutSession = await createCheckoutSession(paymentObject);
    const paymentIntent = await createPaymentIntent({amount: order.totalPrice, currency: 'EGP'})

    order.payment_intent = paymentIntent.id;
    await order.save();
    res.status(200).json({checkoutSession ,paymentIntent});
}


export const stripeWebhookLocal  =  async (req,res,next) => {
    const orderId = req.body.data.object.metadata.orderId

    const confirmedOrder  = await Order.findById(orderId )
    if(!confirmedOrder) return next({message: 'Order not found', cause: 404});
    
    await confirmPaymentIntent( {paymentIntentId: confirmedOrder.payment_intent} );

    confirmedOrder.isPaid = true;
    confirmedOrder.paidAt = DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss');
    confirmedOrder.orderStatus = 'Paid';

    await confirmedOrder.save();

    res.status(200).json({message: 'webhook received'});
}



export const refundOrder = async (req, res, next) => {
    const{orderId} = req.params; 

    const findOrder = await Order.findOne({_id: orderId, orderStatus: 'Paid'});
    if(!findOrder) return next({message: 'Order not found or cannot be refunded', cause: 404});

    // refund the payment intent
    const refund = await refundPaymentIntent({paymentIntentId: findOrder.payment_intent});

    findOrder.orderStatus = 'Refunded';
    await findOrder.save();

    res.status(200).json({message: 'Order refunded successfully', order: refund});
}
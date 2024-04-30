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
import path from "pdfkit";
import { createCheckoutSession, createPaymentIntent, createStripeCoupon, refundPaymentIntent } from "../Payment-handler/stripe.js";

export const createOrder = async (req, res, next) => {
    // Destructure the necessary data from the request body
    const { product, quantity, couponCode, paymentMethod, phoneNumbers, address, city, postalCode, country } = req.body

    // Extract the user ID from the authentication credentials
    const { _id: user } = req.authUser

    // Check if a coupon code is provided and validate it
    let coupon = null;
    if (couponCode) {
        // Validate the coupon code using applyCouponValidation function
        const isCouponValid = await applyCouponValidation(couponCode, user);
        // If the coupon is invalid, return an error message
        if (isCouponValid.status) return next({ message: isCouponValid.msg, cause: isCouponValid.status });
        // If the coupon is valid, store it for later use
        coupon = isCouponValid;
    }


    // Check the availability of the requested product
    const isProductAvailable = await checkProductAvailability(product, quantity);
    // If the product is not available, return an error message
    if (!isProductAvailable) return next({ message: 'Product is not available', cause: 400 });

    // Prepare order items array with the requested product details
    let orderItems = [{
        title: isProductAvailable.title,
        quantity,
        price: isProductAvailable.appliedPrice,
        product: isProductAvailable._id
    }]

    // Calculate shipping price and total price
    let shippingPrice = orderItems[0].price * quantity;
    let totalPrice = shippingPrice;

    // If a fixed coupon is applied and the coupon amount is greater than the total price, return an error message
    if (coupon?.isFixed && !(coupon?.couponAmount <= shippingPrice)) return next({ message: 'You cannot use this coupon', cause: 400 });

    // Adjust the total price based on the applied coupon
    if (coupon?.isFixed) {
        totalPrice = shippingPrice - coupon.couponAmount;
    } else if (coupon?.isPercentage) {
        totalPrice = shippingPrice - (shippingPrice * coupon.couponAmount / 100);
    }

    // Determine order status based on the selected payment method
    let orderStatus;
    if (paymentMethod === 'Cash') orderStatus = 'Placed';

    // Create the order object with all the necessary details
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

    // Save the order to the database
    await order.save();

    // Decrease the stock of the purchased product
    isProductAvailable.stock -= quantity;
    await isProductAvailable.save();

    // Update the usage count of the applied coupon
    if (coupon) {
        await CouponUsers.updateOne({ couponId: coupon._id, userId: user }, { $inc: { usageCount: 1 } });
    }

    // Generate a QR code for the order
    const orderQR = await qrCodeGeneration([{ orderId: order._id, user: order.user, totalPrice: order.totalPrice, orderStatus: order.orderStatus }]);

    // Create an invoice for the order
    const orderCode = `${req.authUser.username}_${nanoid(3)}`; // Use backticks for string interpolation
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

    // Generate and save the invoice as a PDF file
    await createInvoice(orderInvoice, `${orderCode}.pdf`);

    // Send an email notification to the user with the order details and attach the invoice PDF
    await sendEmailService({
        to: req.authUser.email,
        subject: 'Your order has been placed',
        message: `<h1>Hi ${req.authUser.userName}</h1>
                  <h2>Your order has been placed</h2>
                  <h3>Your order code is: ${orderCode}</h3>
                  <h3>Your order date is: ${order.createdAt}</h3>`,
        attachments: [{ path: `./Files/${orderCode}.pdf` }]
    });

    // Respond with a success message and the created order details and QR code
    res.status(201).json({ message: 'Order created successfully', order, orderQR });
}

export const convertFromcartToOrder = async (req, res, next) => {
    // Destructure the necessary data from the request body
    const {
        couponCode,
        paymentMethod,
        phoneNumbers,
        address,
        city,
        postalCode,
        country
    } = req.body

    // Extract the user ID from the authentication credentials
    const { _id: user } = req.authUser

    // Retrieve the user's cart
    const userCart = await getUserCart(user);
    // If the cart is not found, return an error message
    if (!userCart) return next({ message: 'Cart not found', cause: 404 });

    // Check if a coupon code is provided and validate it
    let coupon = null;
    if (couponCode) {
        const isCouponValid = await applyCouponValidation(couponCode, user);
        if (isCouponValid.status) return next({ message: isCouponValid.msg, cause: isCouponValid.status });
        coupon = isCouponValid;
    }

    // Prepare order items array based on the user's cart items
    let orderItems = userCart.products.map(cartItem => {
        return {
            title: cartItem.title,
            quantity: cartItem.quantity,
            price: cartItem.basePrice,
            product: cartItem.productId
        }
    });

    // Calculate shipping price and total price
    let shippingPrice = userCart.subTotal;
    let totalPrice = shippingPrice;

    // Adjust the total price based on the applied coupon
    if (coupon?.isFixed && !(coupon?.couponAmount <= shippingPrice)) return next({ message: 'You cannot use this coupon', cause: 400 });
    if (coupon?.isFixed) {
        totalPrice = shippingPrice - coupon.couponAmount;
    } else if (coupon?.isPercentage) {
        totalPrice = shippingPrice - (shippingPrice * coupon.couponAmount / 100);
    }

    // Determine order status based on the selected payment method
    let orderStatus;
    if (paymentMethod === 'Cash') orderStatus = 'Placed';

    // Create the order object with all the necessary details
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

    // Save the order to the database
    await order.save();

    // Delete the user's cart
    await Cart.findByIdAndDelete(userCart._id);

    // Update product stock based on the purchased items
    for (const item of order.orderItems) {
        await Product.updateOne({ _id: item.product }, { $inc: { stock: -item.quantity } })
    }

    // Update the usage count of the applied coupon
    if (coupon) {
        await CouponUsers.updateOne({ couponId: coupon._id, userId: user }, { $inc: { usageCount: 1 } });
    }

    // Respond with a success message and the created order details
    res.status(201).json({ message: 'Order created successfully', order });
}

export const delieverOrder = async (req, res, next) => {
    const { orderId } = req.params;

    // Find and update the order status to "Delivered"
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

    // If the order is not found or cannot be delivered, return an error message
    if (!updateOrder) return next({ message: 'Order not found or cannot be delivered', cause: 404 });

    // Respond with a success message and the updated order details
    res.status(200).json({ message: 'Order delivered successfully', order: updateOrder });
}

export const cancelOrder = async (req, res) => {
    const { orderId } = req.params;

    // Find the order by ID
    const order = await Order.findById(orderId);

    // If the order is not found, return a 404 error
    if (!order) {
        return res.status(404).json({ message: 'Order not found' });
    }

    // Check if the order was created within the last 24 hours
    const currentTime = new Date();
    const creationTime = new Date(order.createdAt);
    const hoursDiff = (currentTime - creationTime) / (1000 * 60 * 60);

    // If the order is older than 24 hours, return a 400 error
    if (hoursDiff > 24) {
        return res.status(400).json({ message: 'Cannot cancel order after 24 hours' });
    }

    // Update the order status to "Cancelled"
    order.orderStatus = 'Cancelled';
    await order.save();

    // Respond with a success message and the updated order details
    res.json({ message: 'Order canceled successfully', order });
}

export const payWithStripe = async (req, res, next) => {
    const { orderId } = req.params;
    const { _id: userId } = req.authUser;

    // Find the order details from the database
    const order = await Order.findOne({ _id: orderId, user: userId, orderStatus: 'Pending' });

    // If the order is not found or cannot be paid, return a 404 error
    if (!order) return next({ message: 'Order not found or cannot be paid', cause: 404 });

    // Prepare the payment object for Stripe checkout session
    const paymentObject = {
        customer_email: req.authUser.email,
        metadata: { orderId: order._id.toString() },
        discounts: [],
        line_items: order.orderItems.map(item => {
            return {
                price_data: {
                    currency: 'EGP',
                    product_data: {
                        name: item.title,
                    },
                    unit_amount: item.price * 100, // Convert price to cents
                },
                quantity: item.quantity,
            }
        })
    }

    // Check if there's a coupon applied to the order
    if (order.coupon) {
        const stripeCoupon = await createStripeCoupon({ couponId: order.coupon });
        // If there's an issue with the coupon, return a 400 error
        if (stripeCoupon.status) return next({ message: stripeCoupon.message, cause: 400 });

        // Add the coupon to the payment object
        paymentObject.discounts.push({
            coupon: stripeCoupon.id
        });
    }

    // Create a Stripe checkout session and payment intent
    const checkoutSession = await createCheckoutSession(paymentObject);
    const paymentIntent = await createPaymentIntent({ amount: order.totalPrice, currency: 'EGP' });

    // Update the order with the payment intent ID
    order.payment_intent = paymentIntent.id;
    await order.save();

    // Respond with the checkout session and payment intent details
    res.status(200).json({ checkoutSession, paymentIntent });
}

export const stripeWebhookLocal = async (req, res, next) => {
    const orderId = req.body.data.object.metadata.orderId;

    // Find the confirmed order by ID
    const confirmedOrder = await Order.findById(orderId)
    if (!confirmedOrder) return next({ message: 'Order not found', cause: 404 });

    // Confirm the payment intent
    await confirmPaymentIntent({ paymentIntentId: confirmedOrder.payment_intent });

    // Update the order status to "Paid"
    confirmedOrder.isPaid = true;
    confirmedOrder.paidAt = DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss');
    confirmedOrder.orderStatus = 'Paid';

    // Save the changes to the order
    await confirmedOrder.save();

    // Respond with a success message
    res.status(200).json({ message: 'webhook received' });
}

export const refundOrder = async (req, res, next) => {
    const { orderId } = req.params;

    // Find the order to be refunded
    const findOrder = await Order.findOne({ _id: orderId, orderStatus: 'Paid' });
    if (!findOrder) return next({ message: 'Order not found or cannot be refunded', cause: 404 });

    // Refund the payment intent
    const refund = await refundPaymentIntent({ paymentIntentId: findOrder.payment_intent });

    // Update the order status to "Refunded"
    findOrder.orderStatus = 'Refunded';
    await findOrder.save();

    // Respond with a success message and the refunded order details
    res.status(200).json({ message: 'Order refunded successfully', order: refund });
}

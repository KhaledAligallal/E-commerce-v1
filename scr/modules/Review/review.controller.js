import Review from "../../../DB/models/review.model.js"
import orderModel from "../../../DB/models/order.model.js"
import Product from "../../../DB/models/product.model.js"



export const addReview = async (req, res, next) => {
    // Extract user ID and product ID from the request
    const userId = req.authUser._id;
    const { productId } = req.query;

    // Check if the user has purchased the product and it's delivered
    const isProductValidToBeReview = await orderModel.findOne({
        user: userId,
        'orderItems.product': productId,
        orderStatus: 'Delivered',
    });

    if (!isProductValidToBeReview) {
        return next(new Error('You should buy the product first', { cause: 400 }));
    }

    // Extract review rate and comment from the request body
    const { reviewRate, reviewComment } = req.body;

    // Create review object
    const reviewObject = {
        userId,
        productId,
        reviewRate,
        reviewComment,
    };

    // Create review document in the database
    const reviewDB = await Review.create(reviewObject);
    if (!reviewDB) {
        return next(new Error('Failed to add review', { cause: 500 }));
    }
    res.status(201).json({ message: 'Review added successfully', data: reviewDB });
};

export const deleteReview = async (req, res, next) => {
    const { reviewId } = req.params;
    // Find and delete the review by ID
    const review = await Review.findByIdAndDelete(reviewId);
    if (!review) return next(new Error('Review not found', { cause: 404 }));
    res.status(200).json({ message: 'Review deleted successfully', review });
};

// Get reviews by a specific product
export const getReviewsBySpecificProduct = async (req, res, next) => {
    const { productId } = req.params;

    // Check if the product exists
    const checkProduct = await Product.findById(productId);
    if (!checkProduct) return next(new Error('Product not found', { cause: 404 }));

    // Find all reviews for the specific product
    const reviewsByProduct = await Review.find({ productId: productId });
    if (!reviewsByProduct || reviewsByProduct.length === 0) {
        return next(new Error('Reviews not found', { cause: 404 }));
    }

    res.status(200).json({ message: 'Reviews retrieved successfully', reviewsByProduct });
};
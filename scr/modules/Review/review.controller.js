import Review from "../../../DB/models/review.model.js"
import orderModel from "../../../DB/models/order.model.js"
import Product from "../../../DB/models/product.model.js"

export const addReview = async (req, res, next) => {


    const userId = req.authUser._id
    const { productId } = req.query
    const isProductValidToBeReview = await orderModel.findOne({
        user: userId,
        'orderItems.product': productId,
        orderStatus: 'Delivered',
    })
  
    if (!isProductValidToBeReview) {
        return next(new Error('you should buy the product first', { cause: 400 }))
    }
    const { reviewRate, reviewComment } = req.body
    const reviewOpject = {

        userId,
        productId,
        reviewRate,
        reviewComment,
    }

    const reviewDB = await Review.create(reviewOpject)
    if (!reviewDB) {
        return next(new Error('fall to add review', { cause: 500 }))
    }
    res.status(201).json({ message: 'Done', data: reviewDB })

}



export const deleteReview = async (req,res,next) => {
    const {reviewId} = req.params
    const review = await Review.findByIdAndDelete(reviewId)
    if (!review) return next (new Error('Review not found', {cause:404}))
    res.status(200).json({message: 'Review deleted successfully', review})

}

//............................ get review by specific product ...............................
export const getReviewsBySpecificProduct = async (req,res,next) => {
    const {productId} = req.params

    const checkProduct = await Product.findById(productId)
    if (!checkProduct) return next (new Error('product not found', {cause:404}))

    const reviewsByProduct = await Review.find({productId: productId})
    if (!reviewsByProduct) return next (new Error('Reviews not found', {cause:404}))

    res.status(200).json({message: 'done successfully', reviewsByProduct})
}
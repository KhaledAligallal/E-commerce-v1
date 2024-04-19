

import mongoose, { Schema } from "mongoose";

const reviewchema = new mongoose.Schema({

    userId: {

        type: Schema.Types.ObjectId,
        ref: "User",

        required: true

    },
    productId: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    reviewRate: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
        enum:[1, 2, 3, 4, 5],
    },
    reviewComment: { type :String},


},
    {
        timestamps: true,
    })

const Review = mongoose.model('review', reviewchema)

export default Review
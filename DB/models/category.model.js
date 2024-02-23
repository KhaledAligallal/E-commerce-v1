
import { Schema, model } from "mongoose"
const categorySchema = new Schema({


    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    image: {
        secure_url: { type: String, required: true },
        public_id: { type: String, required: true, unique: true }
    },
    folder_Id: { type: String, required: true, unique: true },
    addedBy: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" }


}, { timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})

categorySchema.virtual('subCategories', {
    ref: 'subCategory',
    localField: '_id',
    foreignField: 'categoryId'
});




const Category = model('Category', categorySchema)
export default Category
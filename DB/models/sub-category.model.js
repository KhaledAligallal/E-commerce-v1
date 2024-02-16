import { Schema, model } from "mongoose"
const subCategorySchema = new Schema({


    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    image: {
        secure_url: { type: String, required: true },
        public_id: { type: String, required: true, unique: true }
    },
    folder_Id: { type: String, required: true, unique: true },
    addedBy: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category" },

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})


subCategorySchema.virtual('Brands', {
    ref: 'Brand',
    localField: '_id',
    foreignField: 'subCategoryId'
})


const subCategory = model('subCategory', subCategorySchema)
export default subCategory
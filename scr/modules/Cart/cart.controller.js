import Cart from "../../../DB/models/cart.model.js"
import Product from "../../../DB/models/product.model.js";




export const addProductToCart = async (req, res, next) => {

    const { productId, quantity } = req.body
    const { _id } = req.authUser
    // check is product exists and if it's available

    const product = await Product.findById(productId)
    if (!product) return next({ message: "Product not found", cause: 404 })
    if (product.stock < quantity) return next({ message: 'product is not available', cause: 400 })

    //check if loggedin user has a cart 

    const userCart = await Cart.findOne({ userId: _id })

    if (!userCart) {
        const cartOpj = {
            userId: _id,
            products: [
                {
                    productId: productId,
                    quantity: quantity,
                    basePrice: product.appliedPrice,
                    title: product.title,
                    finalPrice: product.appliedPrice * quantity
                }
            ],
            subTotal: product.appliedPrice * quantity,
        }
        const newCart = await Cart.create(cartOpj)


        return res.status(200).json({ message: "cart added successfully", cart: newCart })
    }



    // if  he has a cart then 
    //check if the product is already existing in the cart

    let isProductExists = false
    let subTotal = 0

    for (const product of userCart.products) {

        if (product.productId.toString() === productId) {

            product.quantity = quantity
            product.finalPrice = product.basePrice * quantity
            isProductExists = true
        }
    }

    if (!isProductExists) {
        userCart.products.push({
            productId,
            quantity,
            basePrice: product.appliedPrice,
            title: product.title,
            finalPrice: product.appliedPrice * quantity



        })
    }

    for (const product of userCart.products) {
        subTotal += product.finalPrice

    }
    userCart.subTotal = subTotal
    await userCart.save()
    res.status(201).json({ message: 'product added to cart successfully', data: userCart })


}

export const removeProductFromCart = async (req, res, next) => {

    const { productId } = req.params
    const { _id } = req.authUser

    //check if cart exists or not and Does this product belong to the user or not 

    const userCart = await Cart.findOne({ userId: _id, 'products.productId': productId })
    if (!userCart) return next({ message: 'product not found in cart', cause: 404 })

    // Filtering the user's cart products to remove the specified product
    userCart.products = userCart.products.filter(product => product.productId.toString() !== productId)

    // Calculating subtotal by iterating over each product in the user's cart
    let subTotal = 0
    for (const product of userCart.products) {
        subTotal += product.finalPrice
    }
    // Assigning the calculated subtotal to the userCart object
    userCart.subTotal = subTotal

    // Saving the updated cart to the database
    const newCart = await userCart.save()

    // If the cart is empty after removing the product, delete the cart
    if (!newCart.products.length === 0) {
        await Cart.findByIdAndDelete(newCart._id)
    }

    res.status(200).json({ message: 'product removed from cart successfully', data: newCart })


}

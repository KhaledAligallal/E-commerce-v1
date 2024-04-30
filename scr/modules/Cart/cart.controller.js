import Cart from "../../../DB/models/cart.model.js"
import Product from "../../../DB/models/product.model.js";



// Controller function to add a product to the cart
export const addProductToCart = async (req, res, next) => {
    // Extracting productId and quantity from request body
    const { productId, quantity } = req.body;
    // Extracting userId from authenticated user
    const { _id } = req.authUser;

    // Checking if the product exists and is available
    const product = await Product.findById(productId);
    if (!product) return next({ message: "Product not found", cause: 404 });
    if (product.stock < quantity) return next({ message: 'product is not available', cause: 400 });

    // Checking if the logged-in user has a cart
    const userCart = await Cart.findOne({ userId: _id });

    if (!userCart) {
        // If the user does not have a cart, create a new cart
        const cartObj = {
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
        const newCart = await Cart.create(cartObj);

        // Return a success response with the newly created cart
        return res.status(200).json({ message: "cart added successfully", cart: newCart });
    }

    // If the user already has a cart, update it
    let isProductExists = false;
    let subTotal = 0;

    // Iterate over the products in the user's cart to update quantity and final price if the product already exists
    for (const product of userCart.products) {
        if (product.productId.toString() === productId) {
            product.quantity = quantity;
            product.finalPrice = product.basePrice * quantity;
            isProductExists = true;
        }
    }

    // If the product does not exist in the user's cart, add it
    if (!isProductExists) {
        userCart.products.push({
            productId,
            quantity,
            basePrice: product.appliedPrice,
            title: product.title,
            finalPrice: product.appliedPrice * quantity
        });
    }

    // Recalculate the subtotal of the cart
    for (const product of userCart.products) {
        subTotal += product.finalPrice;
    }
    userCart.subTotal = subTotal;

    // Save the updated cart to the database
    await userCart.save();

    // Return a success response with the updated cart
    res.status(201).json({ message: 'product added to cart successfully', data: userCart });
};

// Controller function to remove a product from the cart
export const removeProductFromCart = async (req, res, next) => {
    // Extracting productId from request parameters
    const { productId } = req.params;
    // Extracting userId from authenticated user
    const { _id } = req.authUser;

    // Checking if the cart exists and if the product belongs to the user
    const userCart = await Cart.findOne({ userId: _id, 'products.productId': productId });
    if (!userCart) return next({ message: 'product not found in cart', cause: 404 });

    // Filtering the products in the user's cart to remove the specified product
    userCart.products = userCart.products.filter(product => product.productId.toString() !== productId);

    // Recalculating the subtotal of the cart
    let subTotal = 0;
    for (const product of userCart.products) {
        subTotal += product.finalPrice;
    }
    // Assigning the calculated subtotal to the userCart object
    userCart.subTotal = subTotal;

    // Saving the updated cart to the database
    const newCart = await userCart.save();

    // If the cart is empty after removing the product, delete the cart
    if (newCart.products.length === 0) {
        await Cart.findByIdAndDelete(newCart._id);
    }

    // Return a success response with the updated cart
    res.status(200).json({ message: 'product removed from cart successfully', data: newCart });
};

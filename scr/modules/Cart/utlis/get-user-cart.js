
import Cart from "../../../../DB/models/cart.model.js";

// Function to retrieve the cart of a user
export async function getUserCart(userId) {
    // Finding the cart associated with the provided userId
    const userCart = await Cart.findOne({ userId });

    // Returning the user's cart
    return userCart;
}

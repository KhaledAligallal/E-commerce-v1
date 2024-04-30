
import Product from "../../../../DB/models/product.model.js";

// Function to check the availability of a product
export async function checkProductAvailability(productId, quantity) {
    // Finding the product by its ID
    const product = await Product.findById(productId);

    // If the product doesn't exist or its stock is less than the requested quantity, return null
    if (!product || product.stock < quantity) return null;

    // If the product is available, return the product object
    return product;
}

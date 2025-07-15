import Product from '../models/Product.js';
import Category from '../models/Category.js'; // Import the Category model

export const getProducts = async (req, res) => {
  try {
    const products = await Product.find().populate('category');
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error); // Added logging for debugging
    res.status(500).json({ message: error.message });
  }
};

export const createProduct = async (req, res) => {
  const { name, category, price, stock, imageUrl } = req.body;

  // Validate required fields explicitly first for clearer error messages
  if (!name || !category || !price || !stock || !imageUrl) {
    return res.status(400).json({ message: 'All product fields are required.' });
  }

  try {
    // Check if the provided category ID exists
    const existingCategory = await Category.findById(category);
    if (!existingCategory) {
      return res.status(404).json({ message: 'Category not found.' });
    }

    const product = new Product({
      name,
      category,
      price,
      stock,
      imageUrl,
    });

    const newProduct = await product.save();
    res.status(201).json(newProduct);
  } catch (error) {
    console.error("Error creating product:", error); // Added logging for debugging
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Server Error during product creation." });
  }
};

export const updateProduct = async (req, res) => {
  const { category } = req.body; // Extract category from body for validation

  try {
    // If category is provided in the update, validate its existence
    if (category) {
      const existingCategory = await Category.findById(category);
      if (!existingCategory) {
        return res.status(404).json({ message: 'Category not found.' }); // Return 404 if category doesn't exist
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedProduct) return res.status(404).json({ message: 'Product not found' });
    res.json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error); // Added logging for debugging
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid product ID or category ID format.' });
    }
    if (error.name === 'ValidationError') { // Catch Mongoose validation errors
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server Error during product update.' });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (error) {
    console.error("Error deleting product:", error); // Added logging for debugging
    res.status(500).json({ message: error.message });
  }
};
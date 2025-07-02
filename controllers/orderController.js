// import Order from '../models/Order.js';
// import Product from '../models/Product.js';

// /**
//  * @desc    Get all orders (for admin)
//  * @route   GET /api/orders
//  * @access  Private/Admin
//  */
// export const getOrders = async (req, res) => {
//   try {
//     // Fetch all orders, excluding those with 'Pending Payment' status
//     const orders = await Order.find({ status: { $ne: 'Pending Payment' } })
//       .populate('customer', 'fullName email')
//       .sort({ createdAt: -1 });

//     res.status(200).json({ success: true, orders });
//   } catch (error) {
//     console.error("Error fetching all orders:", error);
//     res.status(500).json({ success: false, message: 'Server Error' });
//   }
// };

// /**
//  * @desc    Get logged in user's orders
//  * @route   GET /api/orders/myorders
//  * @access  Private
//  */
// export const getMyOrders = async (req, res) => {
//     try {
//         // Find orders for the current user, excluding those with 'Pending Payment' status
//         const orders = await Order.find({ 
//             customer: req.user._id, 
//             status: { $ne: 'Pending Payment' } 
//         }).sort({ createdAt: -1 });

//         res.status(200).json({ success: true, orders });
//     } catch (error) {
//         console.error("Error fetching user orders:", error);
//         res.status(500).json({ success: false, message: "Server Error" });
//     }
// };

// /**
//  * @desc    Create a new order (for user)
//  * @route   POST /api/orders
//  * @access  Private
//  */
// export const createOrder = async (req, res) => {
//     const { items, address, phone } = req.body;
//     const deliveryFee = 50; 

//     if (!items || items.length === 0) {
//         return res.status(400).json({ success: false, message: "Your cart is empty." });
//     }
//     if (!address || address.trim() === '') {
//          return res.status(400).json({ success: false, message: "A delivery location is required." });
//     }
//     if (!phone || phone.trim() === '') {
//         return res.status(400).json({ success: false, message: "A contact number is required." });
//     }

//     try {
//         let itemsTotal = 0;
//         const orderItems = [];
//         const productUpdates = [];

//         for (const item of items) {
//             const product = await Product.findById(item.productId);
//             if (!product) { 
//                 return res.status(404).json({ success: false, message: `Product not found.` }); 
//             }
//             if (product.stock < item.quantity) { 
//                 return res.status(400).json({ success: false, message: `Not enough stock for ${product.name}.` }); 
//             }

//             itemsTotal += product.price * item.quantity;

//             orderItems.push({
//                 product: product._id,
//                 name: product.name,
//                 price: product.price,
//                 quantity: item.quantity,
//                 imageUrl: product.imageUrl
//             });

//             // Prepare stock updates to be run in a single transaction
//             productUpdates.push({ 
//                 updateOne: { 
//                     filter: { _id: product._id }, 
//                     update: { $inc: { stock: -item.quantity } } 
//                 } 
//             });
//         }

//         const finalAmount = itemsTotal + deliveryFee;

//         const newOrder = new Order({
//             customer: req.user._id,
//             items: orderItems,
//             amount: finalAmount,
//             address: address,
//             phone: phone,
//         });

//         await newOrder.save();
//         await Product.bulkWrite(productUpdates); // Update stock for all products

//         res.status(201).json({ success: true, message: "Order placed successfully!", order: newOrder });

//     } catch (error) {
//         console.error("Order creation failed:", error);
//         res.status(500).json({ success: false, message: "An unexpected error occurred." });
//     }
// };

// /**
//  * @desc    Get a single order by ID
//  * @route   GET /api/orders/:id
//  * @access  Private/Admin
//  */
// export const getOrderById = async (req, res) => {
//   try {
//     const order = await Order.findById(req.params.id).populate('customer', 'fullName email');

//     if (!order) {
//       return res.status(404).json({ success: false, message: 'Order not found' });
//     }

//     res.status(200).json({ success: true, order });
//   } catch (error)
//   {
//     console.error("Error fetching single order:", error);
//     res.status(500).json({ success: false, message: 'Server Error' });
//   }
// };

// /**
//  * @desc    Update order status (for admin)
//  * @route   PUT /api/orders/:id
//  * @access  Private/Admin
//  */
// export const updateOrderStatus = async (req, res) => {
//   try {
//     const { status } = req.body;
//     const updatedOrder = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });

//     if (!updatedOrder) {
//       return res.status(404).json({ success: false, message: 'Order not found' });
//     }

//     res.json({ success: true, order: updatedOrder });
//   } catch (error) {
//     console.error("Error updating order status:", error);
//     res.status(400).json({ success: false, message: 'Failed to update order status' });
//   }
// };

// /**
//  * @desc    Get logged in user's payment history (all orders including incomplete)
//  * @route   GET /api/orders/payment-history
//  * @access  Private
//  */
// export const getPaymentHistory = async (req, res) => {
//     try {
//         // Find all orders for the current user, including 'Pending Payment'
//         const paymentHistory = await Order.find({ customer: req.user._id })
//             .sort({ createdAt: -1 });

//         res.status(200).json({ success: true, history: paymentHistory });
//     } catch (error) {
//         console.error("Error fetching payment history:", error);
//         res.status(500).json({ success: false, message: "Server Error" });
//     }
// };
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

/**
 * @desc    Create a new order (for user - COD)
 * @route   POST /api/orders
 * @access  Private
 */
export const createOrder = async (req, res) => {
  const { items, address, phone, applyDiscount } = req.body;
  const deliveryFee = 50;

  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: "Your cart is empty." });
  }
  if (!address || address.trim() === '') {
    return res.status(400).json({ success: false, message: "A delivery location is required." });
  }
  if (!phone || phone.trim() === '') {
    return res.status(400).json({ success: false, message: "A contact number is required." });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    let itemsTotal = 0;
    const orderItems = [];
    const productUpdates = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product not found.` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ success: false, message: `Not enough stock for ${product.name}.` });
      }

      itemsTotal += product.price * item.quantity;

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        imageUrl: product.imageUrl
      });

      productUpdates.push({
        updateOne: {
          filter: { _id: product._id },
          update: { $inc: { stock: -item.quantity } }
        }
      });
    }

    let finalAmount = itemsTotal + deliveryFee;
    let discountAppliedFlag = false;

    if (applyDiscount && user.groceryPoints >= 150) {
      finalAmount -= (itemsTotal * 0.25);
      user.groceryPoints -= 150;
      discountAppliedFlag = true;
    }

    const newOrder = new Order({
      customer: req.user._id,
      items: orderItems,
      amount: finalAmount,
      address: address,
      phone: phone,
      paymentMethod: 'COD',
      discountApplied: discountAppliedFlag,
      pointsAwarded: 0,
    });

    await user.save();
    await newOrder.save();
    await Product.bulkWrite(productUpdates);

    let successMessage = `Order placed successfully!`;
    if (discountAppliedFlag) {
      successMessage += ' 25% discount was applied.';
    }

    res.status(201).json({
      success: true,
      message: successMessage,
      order: newOrder,
      updatedUser: user
    });

  } catch (error) {
    console.error("Order creation failed:", error);
    res.status(500).json({ success: false, message: "An unexpected error occurred." });
  }
};

/**
 * @desc    Update order status (for admin)
 * @route   PUT /api/orders/:id
 * @access  Private/Admin
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id).populate('items');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const originalStatus = order.status;
    if (originalStatus === status) {
      return res.json({ success: true, order });
    }

    const user = await User.findById(order.customer);
    if (!user) {
      console.error(`User with ID ${order.customer} not found for order ${order._id}`);
      order.status = status;
      await order.save();
      return res.json({ success: true, order });
    }

    if (status === 'Delivered' && originalStatus !== 'Delivered' && order.paymentMethod === 'COD') {
      const itemsTotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      console.log(`[COD] Order ${order._id} marked Delivered. Items subtotal: ₹${itemsTotal}.`);

      if (itemsTotal >= 2000 && order.pointsAwarded === 0) {
        const pointsToAward = Math.floor(Math.random() * (20 - 10 + 1)) + 10;
        user.groceryPoints += pointsToAward;
        order.pointsAwarded = pointsToAward;
        console.log(`[COD] Awarded ${pointsToAward} points to ${user.email}. New total: ${user.groceryPoints}`);
      }
    }

    if (status === 'Cancelled' && originalStatus !== 'Cancelled') {
      console.log(`[Cancel] Order ${order._id} cancelled.`);
      if (order.pointsAwarded > 0) {
        user.groceryPoints -= order.pointsAwarded;
        console.log(`[Cancel] Reverted ${order.pointsAwarded} points.`);
      }
      if (order.discountApplied) {
        user.groceryPoints += 150;
        console.log(`[Cancel] Refunded 150 coupon points.`);
      }
      user.groceryPoints = Math.max(0, user.groceryPoints);
      const productUpdates = order.items.map(item => ({
        updateOne: { filter: { _id: item.product }, update: { $inc: { stock: +item.quantity } } }
      }));
      await Product.bulkWrite(productUpdates);
    }

    await user.save();
    order.status = status;
    const updatedOrder = await order.save();

    res.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(400).json({ success: false, message: 'Failed to update order status' });
  }
};

/**
 * @desc    Get all orders (for admin)
 * @route   GET /api/orders
 * @access  Private/Admin
 */
export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ status: { $ne: 'Pending Payment' } })
      .populate('customer', 'fullName email')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error("Error fetching all orders:", error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

/**
 * @desc    Get logged in user's orders
 * @route   GET /api/orders/myorders
 * @access  Private
 */
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      customer: req.user._id,
      status: { $ne: 'Pending Payment' }
    }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

/**
 * @desc    Get a single order by ID
 * @route   GET /api/orders/:id
 * @access  Private/Admin
 */
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('customer', 'fullName email');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("Error fetching single order:", error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

/**
 * @desc    Get logged in user's payment history
 * @route   GET /api/orders/payment-history
 * @access  Private
 */
export const getPaymentHistory = async (req, res) => {
  try {
    const paymentHistory = await Order.find({ customer: req.user._id })
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, history: paymentHistory });
  } catch (error) {
    console.error("Error fetching payment history:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
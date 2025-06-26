
import Order from '../models/Order.js';
import User from '../models/User.js';
import Product from '../models/Product.js';

export const getDashboardStats = async (req, res) => {
  try {
    // 1. Total Revenue: Correctly calculates sum of 'amount' for ONLY delivered orders. (This was already correct)
    const totalRevenuePipeline = await Order.aggregate([
      { $match: { status: 'Delivered' } },
      { 
        $group: { 
          _id: null, 
          total: { $sum: '$amount' } 
        } 
      }
    ]);

    // 2. Total Orders: <<< THIS IS THE KEY CHANGE >>>
    // Instead of counting all orders, we now only count active orders
    // (those that are 'Pending' or 'Shipped'). This number will go down
    // when you mark an order as 'Delivered' or 'Cancelled'.
    const totalOrders = await Order.countDocuments({ 
        status: { $in: ['Pending', 'Shipped'] } 
    });

    // 3. Total Customers: Counts all users with the role 'user'.
    const totalCustomers = await User.countDocuments({ role: 'normal' });

    // 4. Sales Data for Chart: Correctly uses 'amount' from 'Delivered' orders.
    const salesData = await Order.aggregate([
        { $match: { status: 'Delivered' } },
        { 
          $group: {
            _id: { month: { $month: "$createdAt" } },
            sales: { $sum: "$amount" } 
          }
        },
        { $sort: { "_id.month": 1 } }
    ]);
    
    // 5. Top Products (based on quantity sold in all orders)
    const topProducts = await Order.aggregate([
        { $unwind: "$items" },
        { $group: {
            _id: "$items.product",
            sales: { $sum: "$items.quantity" }
        }},
        { $sort: { sales: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'productInfo' }},
        { $unwind: "$productInfo" },
        { $project: { name: '$productInfo.name', sales: '$sales' }}
    ]);

    // 6. Recent Orders (shows the last 5 created orders regardless of status)
    const recentOrders = await Order.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('customer', 'fullName email');

    // Sending the final JSON response
    res.status(200).json({
      totalRevenue: totalRevenuePipeline.length > 0 ? totalRevenuePipeline[0].total : 0,
      totalOrders, // This now sends the count of active orders
      totalCustomers,
      salesData,
      topProducts,
      recentOrders
    });

  } catch (error) {
    console.error("Error in getDashboardStats:", error);
    res.status(500).json({ message: "An internal server error occurred while fetching dashboard statistics." });
  }
};
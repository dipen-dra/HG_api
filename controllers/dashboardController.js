import Order from '../models/Order.js';
import User from '../models/User.js';
import Product from '../models/Product.js';

export const getDashboardStats = async (req, res) => {
  try {
    const totalRevenue = await Order.aggregate([
      { $match: { status: 'Delivered' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    const totalOrders = await Order.countDocuments();
    const totalCustomers = await User.countDocuments({ role: 'normal' });

    const salesData = await Order.aggregate([
        { $match: { status: 'Delivered' } },
        { $group: {
            _id: { $month: "$createdAt" },
            sales: { $sum: "$total" }
        }},
        { $sort: { _id: 1 } }
    ]);
    
    const topProducts = await Order.aggregate([
        { $unwind: "$items" },
        { $group: {
            _id: "$items.product",
            sales: { $sum: "$items.quantity" }
        }},
        { $sort: { sales: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'productInfo'
          }
        },
        { $unwind: "$productInfo" },
        {
          $project: {
            name: '$productInfo.name',
            sales: '$sales'
          }
        }
    ]);

    res.json({
      totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
      totalOrders,
      totalCustomers,
      salesData,
      topProducts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// import mongoose from 'mongoose';

// const { Schema } = mongoose;

// const orderItemSchema = new Schema({
//   product: {
//     type: Schema.Types.ObjectId,
//     ref: 'Product',
//     required: true,
//   },
//   quantity: {
//     type: Number,
//     required: true,
//   },
//   price: {
//     type: Number,
//     required: true,
//   },
// });

// const orderSchema = new Schema({
//   customer: {
//     type: Schema.Types.ObjectId,
//     ref: 'User',
//     required: true,
//   },
//   items: [orderItemSchema],
//   total: {
//     type: Number,
//     required: true,
//   },
//   status: {
//     type: String,
//     enum: ['Pending', 'Shipped', 'Delivered', 'Cancelled'],
//     default: 'Pending',
//   },
//   customerName: { // Denormalized for easier access
//     type: String,
//     required: true
//   }
// }, { timestamps: true });

// const Order = mongoose.model('Order', orderSchema);

// export default Order;



import mongoose from 'mongoose';

const { Schema } = mongoose;

const orderItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true }, // Price at the time of order
  name: { type: String, required: true },
  imageUrl: { type: String }
}, { _id: false });


const orderSchema = new Schema({
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  items: [orderItemSchema],
  amount: {
    type: Number,
    required: true,
  },
  // Address is now a simple string
  address: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending',
  }
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);

export default Order;
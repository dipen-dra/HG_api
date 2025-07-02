import mongoose from 'mongoose';

const { Schema } = mongoose;

const orderItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  name: { type: String, required: true },
  imageUrl: { type: String }
}, { _id: false });


const orderSchema = new Schema({
  customer: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  items: [orderItemSchema],
  amount: { 
    type: Number, 
    required: true 
  },
  address: { 
    type: String, 
    required: true 
  },
  phone: { 
    type: String, 
    required: true 
  },
  status: {
    type: String,
    enum: ['Pending', 'Shipped', 'Delivered', 'Cancelled', 'Pending Payment'],
    default: 'Pending',
  },
  paymentMethod: {
    type: String,
    enum: ['COD', 'eSewa'],
    required: true,
    default: 'COD'
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  // --- NEW FIELDS ---
  pointsAwarded: {
    type: Number,
    default: 0
  },
  discountApplied: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);
export default Order;
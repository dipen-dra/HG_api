import mongoose from 'mongoose';

const { Schema } = mongoose;

// Sub-schema for items within an order
const orderItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  name: { type: String, required: true },
  imageUrl: { type: String }
}, { _id: false });


// Main order schema
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
    sparse: true // Allows multiple documents to have a null value for this field
  },
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);
export default Order;
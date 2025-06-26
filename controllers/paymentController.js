import crypto from 'crypto';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import fetch from 'node-fetch';

const ESEWA_URL = 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';
const ESEWA_SCD = 'EPAYTEST'; // Test Merchant Code
const ESEWA_SECRET = '8gBm/:&EnhH.1/q'; // Test Secret Key

// This function remains mostly the same. It starts the payment.
export const initiateEsewaPayment = async (req, res) => {
    try {
        const { cartItems, phone, address } = req.body;
        const user = req.user;

        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ message: 'Cart is empty.' });
        }

        const deliveryFee = 50;
        const serviceCharge = 0;
        const taxAmount = 0;
        let itemsTotal = 0;
        const orderItems = [];
        const productIds = cartItems.map(item => item._id);
        const productsInDb = await Product.find({ '_id': { $in: productIds } });

        for (const cartItem of cartItems) {
            const product = productsInDb.find(p => p._id.toString() === cartItem._id);
            if (!product) {
                return res.status(404).json({ message: `Product with ID ${cartItem._id} not found.` });
            }
            itemsTotal += product.price * cartItem.quantity;
            orderItems.push({
                product: product._id,
                name: product.name,
                price: product.price,
                quantity: cartItem.quantity,
                imageUrl: product.imageUrl,
            });
        }
        
        const finalAmount = itemsTotal + deliveryFee + serviceCharge + taxAmount;
        const transaction_uuid = `hg-${Date.now()}`;

        const newOrder = new Order({
            customer: user._id,
            items: orderItems,
            amount: finalAmount,
            address: address,
            phone: phone,
            status: 'Pending Payment',
            paymentMethod: 'eSewa',
            transactionId: transaction_uuid,
        });
        await newOrder.save();

        const signatureBaseString = `total_amount=${finalAmount},transaction_uuid=${transaction_uuid},product_code=${ESEWA_SCD}`;
        
        const hmac = crypto.createHmac('sha256', ESEWA_SECRET);
        hmac.update(signatureBaseString);
        const signature = hmac.digest('base64');

        const esewaData = {
            amount: itemsTotal.toString(),
            tax_amount: taxAmount.toString(),
            product_service_charge: serviceCharge.toString(),
            product_delivery_charge: deliveryFee.toString(),
            total_amount: finalAmount.toString(),
            transaction_uuid: transaction_uuid,
            product_code: ESEWA_SCD,
            signature: signature,
            signed_field_names: 'total_amount,transaction_uuid,product_code',
            success_url: `${process.env.BACKEND_URL || 'http://localhost:8081'}/api/payment/esewa/verify`,
            failure_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout?payment=failure`,
        };
        
        res.json({ ...esewaData, esewaUrl: ESEWA_URL });

    } catch (error) {
        console.error('Error in initiateEsewaPayment:', error);
        res.status(500).json({ message: 'Server Error while initiating payment' });
    }
};

// 🟢 THIS FUNCTION HAS THE CRITICAL CHANGE
// It now redirects to a new frontend page `/payment/verify` on success.
export const verifyEsewaPayment = async (req, res) => {
    try {
        const { data } = req.query;
        // Define URLs for frontend redirects
        const frontendVerifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/verify`;
        const frontendCheckoutUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout`;

        if (!data) {
            const message = encodeURIComponent('No data received from eSewa.');
            return res.redirect(`${frontendCheckoutUrl}?payment=failure&message=${message}`);
        }
        
        const decodedData = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
        
        if (decodedData.status !== 'COMPLETE') {
            await Order.findOneAndDelete({ transactionId: decodedData.transaction_uuid });
            const message = encodeURIComponent(`Payment was not completed: ${decodedData.status}`);
            return res.redirect(`${frontendCheckoutUrl}?payment=failure&message=${message}`);
        }

        const verificationUrl = `https://rc-epay.esewa.com.np/api/epay/transaction/status/?product_code=${ESEWA_SCD}&total_amount=${decodedData.total_amount}&transaction_uuid=${decodedData.transaction_uuid}`;
        
        const response = await fetch(verificationUrl);
        const verificationResponse = await response.json();

        if (verificationResponse.status === 'COMPLETE') {
            const order = await Order.findOne({ transactionId: verificationResponse.transaction_uuid });

            if (!order) {
                const message = encodeURIComponent('Order not found for this transaction.');
                return res.redirect(`${frontendCheckoutUrl}?payment=failure&message=${message}`);
            }

            // This is the main success path
            if (order.status === 'Pending Payment') {
                order.status = 'Pending';
                await order.save();

                const productUpdates = order.items.map(item => ({
                    updateOne: {
                        filter: { _id: item.product },
                        update: { $inc: { stock: -item.quantity } }
                    }
                }));
                await Product.bulkWrite(productUpdates);
                
                const successMessage = encodeURIComponent('Payment successful! Your order has been placed.');
                // 🟢 THE KEY CHANGE: Redirect to the new dedicated verification page on the frontend
                return res.redirect(`${frontendVerifyUrl}?status=success&message=${successMessage}`);
            }
             
             // If the order was already processed, just send the user to their order history
             return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/orders`);
        } else {
            // If verification with eSewa's server fails
            await Order.findOneAndDelete({ transactionId: decodedData.transaction_uuid });
            const message = encodeURIComponent('Transaction verification failed.');
            return res.redirect(`${frontendCheckoutUrl}?payment=failure&message=${message}`);
        }
        
    } catch (error) {
        console.error('Error in verifyEsewaPayment:', error);
        const message = encodeURIComponent('An internal server error occurred during verification.');
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout?payment=failure&message=${message}`);
    }
};
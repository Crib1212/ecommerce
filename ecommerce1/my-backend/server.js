// server.js

require('dotenv').config();  // Load environment variables

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch((error) => console.error('MongoDB connection error:', error));

// Define a schema and model for orders
const orderSchema = new mongoose.Schema({
  customerName: String,
  orderId: String,
  items: [String],
  total: Number,
});

const Order = mongoose.model('Order', orderSchema);

// Define your routes
app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});

// Route to get all orders
app.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find(); // Fetch all orders
    res.json(orders); // Send orders as JSON response
  } catch (error) {
    res.status(500).send('Error retrieving orders');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

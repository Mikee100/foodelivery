const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const WebSocket = require('ws');
const axios = require('axios');
const stripe = require('stripe')('sk_test_51P1B7LCXIhVW50LeLXacm9VK72GEVjz5HQ7n10tCy9aHRI69LMXXgp4m2mPsQgOTQRcP1HQwTNCVBSyeDHMBOz9p00Rgu6NaPe');

// Configuration
const config = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'waweru',
  database: {
    host: 'localhost',
    user: 'root',
    password: '10028mike.',
    database: 'food_delivery',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  },
  stripe: {
    secretKey: 'sk_test_51P1B7LCXIhVW50LeLXacm9VK72GEVjz5HQ7n10tCy9aHRI69LMXXgp4m2mPsQgOTQRcP1HQwTNCVBSyeDHMBOz9p00Rgu6NaPe'
  },
  mpesa: {
    consumerKey: process.env.MPESA_CONSUMER_KEY || 'JFvBXWMm0yPfiDwTWNPbc2TodFikv8VOBcIhDQ1xbRIBr7TE',
    consumerSecret: process.env.MPESA_CONSUMER_SECRET || 'Q16rZBLRjCN1VXaBMmzInA3QpGX0MXidMYY0EUweif6PsvbsUQ8GLBLiqZHaebk9',
    shortCode: process.env.MPESA_SHORTCODE || '174379',
    passkey: process.env.MPESA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',
    callbackURL: process.env.MPESA_CALLBACK_URL || 'https://mydomain.com/path'
  }
};

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// File upload configuration
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Database connection
let db;
async function initializeDatabase() {
  try {
    db = mysql.createPool(config.database);
    await db.query('SELECT 1');
    console.log('✅ MySQL connected successfully');
  } catch (error) {
    console.error('❌ MySQL connection failed:', error);
    process.exit(1);
  }
}

// WebSocket server
const wss = new WebSocket.Server({ noServer: true });
wss.on('connection', (ws) => {
  console.log('🔌 WebSocket connection established');
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, config.jwtSecret, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Role-based authorization middleware
const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
};

// Database query helper
const executeQuery = async (sql, params = []) => {
  try {
    const [results] = await db.query(sql, params);
    return results;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// ==================== ROUTES ====================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
});

// File upload
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const imageUrl = `http://localhost:${config.port}/uploads/${req.file.filename}`;
  res.json({ imageUrl });
});

// ==================== AUTHENTICATION ROUTES ====================

// User registration
app.post('/api/signup', async (req, res) => {
  try {
    const { username, email, password, phone, county, location } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const role = 'user';

    const sql = 'INSERT INTO users (username, email, password, phone, county, location, role) VALUES (?, ?, ?, ?, ?, ?, ?)';
    await executeQuery(sql, [username, email, hashedPassword, phone, county, JSON.stringify(location), role]);
    
    res.json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Error creating user' });
  }
});

// User login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('🔐 Login attempt for:', email);

    const sql = 'SELECT * FROM users WHERE email = ?';
    const users = await executeQuery(sql, [email]);

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get additional user data based on role
    let additionalData = {};
    if (user.role === 'restaurant_owner') {
      const restaurantSql = 'SELECT * FROM restaurants WHERE user_id = ?';
      const restaurants = await executeQuery(restaurantSql, [user.id]);
      if (restaurants.length > 0) {
        additionalData.restaurantId = restaurants[0].id;
      }
    } else if (user.role === 'delivery_person') {
      const deliverySql = 'SELECT * FROM delivery_persons WHERE user_id = ?';
      const deliveryPersons = await executeQuery(deliverySql, [user.id]);
      if (deliveryPersons.length > 0) {
        additionalData.deliveryPersonId = deliveryPersons[0].id;
      }
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        ...additionalData
      }, 
      config.jwtSecret, 
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        ...additionalData
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ==================== RESTAURANT ROUTES ====================

// Get all restaurants
app.get('/api/restaurants', async (req, res) => {
  try {
    const sql = 'SELECT * FROM restaurants';
    const restaurants = await executeQuery(sql);
    res.json(restaurants);
  } catch (error) {
    console.error('Get restaurants error:', error);
    res.status(500).json({ error: 'Error fetching restaurants' });
  }
});

// Get restaurant by ID
app.get('/api/restaurants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = 'SELECT * FROM restaurants WHERE id = ?';
    const restaurants = await executeQuery(sql, [id]);
    
    if (restaurants.length === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    
    res.json(restaurants[0]);
  } catch (error) {
    console.error('Get restaurant error:', error);
    res.status(500).json({ error: 'Error fetching restaurant' });
  }
});

// Create restaurant
app.post('/api/restaurants', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { name, email, location, description, image } = req.body;
    const sql = 'INSERT INTO restaurants (name, email, location, description, image, user_id) VALUES (?, ?, ?, ?, ?, ?)';
    const result = await executeQuery(sql, [name, email, location, description, image, req.user.id]);
    
    res.json({ 
      id: result.insertId,
      message: 'Restaurant created successfully' 
    });
  } catch (error) {
    console.error('Create restaurant error:', error);
    res.status(500).json({ error: 'Error creating restaurant' });
  }
});

// Update restaurant
app.put('/api/restaurants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, location, latitude, longitude, description, image } = req.body;
    
    const sql = 'UPDATE restaurants SET name = ?, email = ?, location = ?, latitude = ?, longitude = ?, description = ?, image = ? WHERE id = ?';
    const result = await executeQuery(sql, [name, email, location, latitude, longitude, description, image, id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    
    res.json({ message: 'Restaurant updated successfully' });
  } catch (error) {
    console.error('Update restaurant error:', error);
    res.status(500).json({ error: 'Error updating restaurant' });
  }
});

// Delete restaurant
app.delete('/api/restaurants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // First, delete all related rows in the delivery_persons table
    await executeQuery('DELETE FROM delivery_persons WHERE restaurant_id = ?', [id]);
    
    // Then, delete the restaurant
    const result = await executeQuery('DELETE FROM restaurants WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    
    res.json({ message: 'Restaurant deleted successfully' });
  } catch (error) {
    console.error('Delete restaurant error:', error);
    res.status(500).json({ error: 'Error deleting restaurant' });
  }
});

// ==================== MEALS ROUTES ====================

// Get all meals
app.get('/api/meals', async (req, res) => {
  try {
    const sql = 'SELECT * FROM meals';
    const meals = await executeQuery(sql);
    res.json(meals);
  } catch (error) {
    console.error('Get meals error:', error);
    res.status(500).json({ error: 'Error fetching meals' });
  }
});

// Get meals by restaurant
app.get('/api/restaurants/:restaurantId/meals', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const sql = 'SELECT * FROM meals WHERE restaurant_id = ?';
    const meals = await executeQuery(sql, [restaurantId]);
    res.json(meals);
  } catch (error) {
    console.error('Get restaurant meals error:', error);
    res.status(500).json({ error: 'Error fetching restaurant meals' });
  }
});

// Get meal by ID
app.get('/api/meals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Enhanced input validation
    if (!id || !/^\d+$/.test(id)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid meal ID: must be a positive integer'
      });
    }

    const sql = `
      SELECT 
        m.id,
        m.name,
        m.description,
        m.price,
        m.image,
        m.restaurant_id,
        c.name AS category_name,
        r.name AS restaurant_name,
        r.location AS restaurant_location
      FROM meals m
      LEFT JOIN categories c ON m.category_id = c.id
      LEFT JOIN restaurants r ON m.restaurant_id = r.id
      WHERE m.id = ?
    `;
    
    const results = await executeQuery(sql, [id]);
    
    if (!results?.length) {
      return res.status(404).json({
        success: false,
        message: `Meal with ID ${id} not found`
      });
    }

    // Format response with explicit field mapping
    const mealData = {
      id: results[0].id.toString(),
      name: results[0].name || null,
      description: results[0].description || null,
      price: Number(results[0].price),
      image: results[0].image || null,
      restaurant_id: results[0].restaurant_id,
      categoryName: results[0].category_name || null,
      restaurantName: results[0].restaurant_name || null,
      restaurantLocation: results[0].restaurant_location || null
    };

    res.json({
      success: true,
      data: mealData
    });

  } catch (error) {
    console.error('Get meal error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && {
        error: error.message,
        stack: error.stack
      })
    });
  }
});

// Create meal
app.post('/api/meals', authenticateToken, authorizeRole(['restaurant_owner', 'admin']), async (req, res) => {
  try {
    const { name, image, description, price, restaurant_id, category_id } = req.body;
    const sql = 'INSERT INTO meals (name, image, description, price, restaurant_id, category_id) VALUES (?, ?, ?, ?, ?, ?)';
    await executeQuery(sql, [name, image, description, price, restaurant_id, category_id]);
    
    res.json({ message: 'Meal added successfully' });
  } catch (error) {
    console.error('Create meal error:', error);
    res.status(500).json({ error: 'Error creating meal' });
  }
});

// Update meal
app.put('/api/meals/:id', authenticateToken, authorizeRole(['restaurant_owner', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, image, description, price, category_id, spicy, withFries, withSoda, extraCheese, extraSauce, withSalad, withChilly, withPasta } = req.body;
    
    const sql = 'UPDATE meals SET name = ?, image = ?, description = ?, price = ?, category_id = ?, spicy = ?, with_fries = ?, with_soda = ?, extra_cheese = ?, extra_sauce = ?, with_salad = ?, with_chilly = ?, with_pasta = ? WHERE id = ?';
    await executeQuery(sql, [name, image, description, price, category_id, spicy, withFries, withSoda, extraCheese, extraSauce, withSalad, withChilly, withPasta, id]);
    
    res.json({ message: 'Meal updated successfully' });
  } catch (error) {
    console.error('Update meal error:', error);
    res.status(500).json({ error: 'Error updating meal' });
  }
});

// Delete meal
app.delete('/api/meals/:id', authenticateToken, authorizeRole(['restaurant_owner', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if meal exists
    const checkSql = 'SELECT * FROM meals WHERE id = ?';
    const meals = await executeQuery(checkSql, [id]);
    
    if (meals.length === 0) {
      return res.status(404).json({ error: 'Meal not found' });
    }
    
    // Delete the meal
    const deleteSql = 'DELETE FROM meals WHERE id = ?';
    await executeQuery(deleteSql, [id]);
    
    res.json({ message: 'Meal deleted successfully' });
  } catch (error) {
    console.error('Delete meal error:', error);
    res.status(500).json({ error: 'Error deleting meal' });
  }
});

// ==================== ORDERS ROUTES ====================

// Create order
app.post('/api/orders', async (req, res) => {
  try {
    // Verify token first
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication token required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Verify token with proper error handling
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch (jwtError) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }

    // Validate required fields
    const requiredFields = ['meal_id', 'restaurant_id', 'payment_method'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`,
        code: 'MISSING_FIELDS',
        requiredFields
      });
    }

    // Validate field types
    if (isNaN(req.body.meal_id) || isNaN(req.body.restaurant_id)) {
      return res.status(400).json({
        success: false,
        error: 'meal_id and restaurant_id must be numbers',
        code: 'INVALID_ID_TYPE'
      });
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Prepare order data with proper MySQL boolean conversion
    const orderData = {
      order_number: orderNumber,
      user_id: decoded.id,
      meal_id: Number(req.body.meal_id),
      restaurant_id: Number(req.body.restaurant_id),
      quantity: Number(req.body.quantity) || 1,
      is_spicy: req.body.is_spicy ? 1 : 0,
      add_drink: req.body.add_drink ? 1 : 0,
      selected_drink: req.body.selected_drink || null,
      address: req.body.address || null,
      delivery_fee: Number(req.body.delivery_fee) || 0,
      payment_method: req.body.payment_method,
      with_fries: req.body.with_fries ? 1 : 0,
      with_soda: req.body.with_soda ? 1 : 0,
      with_salad: req.body.with_salad ? 1 : 0,
      with_sauce: req.body.with_sauce ? 1 : 0,
      with_chilly: req.body.with_chilly ? 1 : 0,
      with_pasta: req.body.with_pasta ? 1 : 0,
      special_instructions: req.body.special_instructions || null,
      status: 'pending',
      date: new Date()
    };

    // Execute query with transaction for safety
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Insert the order
      const [result] = await connection.query('INSERT INTO orders SET ?', [orderData]);

      await connection.commit();

      res.status(201).json({
        success: true,
        orderId: result.insertId,
        orderNumber: orderNumber,
        message: 'Order created successfully'
      });

    } catch (dbError) {
      await connection.rollback();
      throw dbError;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Order creation error:', error);

    // Handle specific database errors
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({
        success: false,
        error: 'Invalid meal or restaurant reference',
        code: 'INVALID_REFERENCE'
      });
    }

    // Generic error response
    res.status(500).json({
      success: false,
      error: 'Failed to create order',
      code: 'ORDER_CREATION_FAILED',
      ...(process.env.NODE_ENV === 'development' && {
        details: error.message,
        stack: error.stack
      })
    });
  }
});

// Get orders by restaurant
app.get('/api/orders', async (req, res) => {
  try {
    const { restaurantId } = req.query;
    console.log('📦 Orders endpoint called with restaurantId:', restaurantId);

    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID is required' });
    }

    const sql = `
      SELECT orders.*, meals.name AS meal_name, meals.description AS meal_description
      FROM orders
      JOIN meals ON orders.meal_id = meals.id
      WHERE orders.restaurant_id = ?
    `;
    
    console.log('🔍 Executing orders query for restaurantId:', restaurantId);
    const orders = await executeQuery(sql, [restaurantId]);
    console.log('📊 Orders query results:', orders.length, 'orders found');
    
    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Error fetching orders' });
  }
});

// Get order by ID
app.get('/api/orders/:id', async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    if (isNaN(orderId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid order ID format' 
      });
    }

    // Get order with meal and restaurant details
    const sql = `
      SELECT o.*, m.name as meal_name, r.name as restaurant_name
      FROM orders o
      LEFT JOIN meals m ON o.meal_id = m.id
      LEFT JOIN restaurants r ON o.restaurant_id = r.id
      WHERE o.id = ?
    `;
    
    const results = await executeQuery(sql, [orderId]);
    
    console.log('🔍 Order query results:', results.length, 'orders found for ID:', orderId);

    if (!results.length) {
      return res.status(404).json({ 
        success: false, 
        error: 'Order not found' 
      });
    }

    const order = results[0];
    res.json({
      success: true,
      data: {
        id: order.id,
        order_number: order.order_number,
        meal_name: order.meal_name,
        restaurant_name: order.restaurant_name,
        quantity: order.quantity,
        total_amount: order.total_amount,
        delivery_fee: order.delivery_fee,
        payment_method: order.payment_method,
        status: order.status,
        date: order.date,
        address: order.address,
        special_instructions: order.special_instructions,
        is_spicy: order.is_spicy,
        add_drink: order.add_drink,
        selected_drink: order.selected_drink,
        with_fries: order.with_fries,
        with_soda: order.with_soda,
        with_salad: order.with_salad,
        with_sauce: order.with_sauce,
        with_chilly: order.with_chilly,
        with_pasta: order.with_pasta
      }
    });

  } catch (error) {
    console.error('Order fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order details',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get order by order number
app.get('/api/orders/number/:orderNumber', async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const sql = 'SELECT * FROM orders WHERE order_number = ?';
    const orders = await executeQuery(sql, [orderNumber]);
    
    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(orders[0]);
  } catch (error) {
    console.error('Get order by number error:', error);
    res.status(500).json({ error: 'Error fetching order' });
  }
});

// Update order status
app.put('/api/orders/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['pending', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }
    
    const sql = 'UPDATE orders SET status = ? WHERE id = ?';
    await executeQuery(sql, [status, id]);
    
    res.json({ 
      success: true,
      message: 'Order status updated successfully' 
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error updating order status' 
    });
  }
});

// Get processed orders
app.get('/api/processedorders/processed', async (req, res) => {
  try {
    const { restaurantId } = req.query;

    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID is required' });
    }

    const sql = 'SELECT * FROM orders WHERE restaurant_id = ? AND status = "Delivered"';
    const orders = await executeQuery(sql, [restaurantId]);
    
    res.json(orders);
  } catch (error) {
    console.error('Get processed orders error:', error);
    res.status(500).json({ error: 'Error fetching processed orders' });
  }
});

// ==================== CATEGORIES ROUTES ====================

// Get categories by restaurant
app.get('/api/restaurants/:restaurantId/categories', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const sql = 'SELECT * FROM categories WHERE restaurant_id = ?';
    const categories = await executeQuery(sql, [restaurantId]);
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Error fetching categories' });
  }
});

// Create category
app.post('/api/categories', authenticateToken, authorizeRole(['restaurant_owner', 'admin']), async (req, res) => {
  try {
    const { name, restaurantId } = req.body;
    const sql = 'INSERT INTO categories (name, restaurant_id) VALUES (?, ?)';
    const result = await executeQuery(sql, [name, restaurantId]);
    
    res.json({ 
      id: result.insertId,
      name,
      restaurantId,
      message: 'Category created successfully'
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Error creating category' });
  }
});

// ==================== DELIVERY PERSONS ROUTES ====================

// Get delivery persons by restaurant
app.get('/api/restaurants/:restaurantId/delivery-persons', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const sql = 'SELECT * FROM delivery_persons WHERE restaurant_id = ?';
    const deliveryPersons = await executeQuery(sql, [restaurantId]);
    res.json(deliveryPersons);
  } catch (error) {
    console.error('Get delivery persons error:', error);
    res.status(500).json({ error: 'Error fetching delivery persons' });
  }
});

// ==================== SEARCH ROUTES ====================

// Search for restaurants and meals
app.get('/api/search', async (req, res) => {
  try {
    const { query, filter } = req.query;
    let sql;
    
    if (filter === 'restaurants') {
      sql = `
        SELECT restaurants.id AS restaurant_id, restaurants.name AS restaurant_name, restaurants.image
        FROM restaurants
        WHERE restaurants.name LIKE ?
      `;
    } else {
      sql = `
        SELECT meals.id AS meal_id, meals.name AS meal_name, meals.description, meals.price, meals.image, meals.restaurant_id, restaurants.name AS restaurant_name, restaurants.image AS restaurant_image
        FROM meals
        JOIN restaurants ON meals.restaurant_id = restaurants.id
        WHERE meals.name LIKE ?
      `;
    }
    
    const results = await executeQuery(sql, [`%${query}%`]);
    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Error searching for meals and restaurants' });
  }
});

// ==================== USER ROUTES ====================

// Get user details
app.get('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const sql = 'SELECT * FROM users WHERE id = ?';
    const users = await executeQuery(sql, [userId]);
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(users[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Error fetching user' });
  }
});

// Create delivery person
app.post('/api/delivery-persons', authenticateToken, authorizeRole(['restaurant_owner', 'admin']), async (req, res) => {
  try {
    const { name, email, restaurantId } = req.body;
    const password = '1234'; // Default password
    const hashedPassword = await bcrypt.hash(password, 10);
    const role = 'delivery_person';

    // Create user account
    const userSql = 'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)';
    const userResult = await executeQuery(userSql, [name, email, hashedPassword, role]);
    const userId = userResult.insertId;

    // Create delivery person record
    const deliverySql = 'INSERT INTO delivery_persons (name, email, restaurant_id, user_id) VALUES (?, ?, ?, ?)';
    await executeQuery(deliverySql, [name, email, restaurantId, userId]);

    res.json({ message: 'Delivery person created successfully' });
  } catch (error) {
    console.error('Create delivery person error:', error);
    res.status(500).json({ error: 'Error creating delivery person' });
  }
});

// Get delivery person by ID
app.get('/api/delivery-persons/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = 'SELECT * FROM delivery_persons WHERE user_id = ?';
    const deliveryPersons = await executeQuery(sql, [id]);
    
    if (deliveryPersons.length === 0) {
      return res.status(404).json({ error: 'Delivery person not found' });
    }
    
    res.json(deliveryPersons[0]);
  } catch (error) {
    console.error('Get delivery person error:', error);
    res.status(500).json({ error: 'Error fetching delivery person' });
  }
});

// Update delivery person
app.put('/api/delivery-persons/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, picture } = req.body;
    const sql = 'UPDATE delivery_persons SET name = ?, email = ?, phone = ?, picture = ? WHERE user_id = ?';
    await executeQuery(sql, [name, email, phone, picture, id]);
    
    res.json({ message: 'Delivery person updated successfully' });
  } catch (error) {
    console.error('Update delivery person error:', error);
    res.status(500).json({ error: 'Error updating delivery person' });
  }
});

// Update delivery person password
app.put('/api/delivery-persons/:id/password', async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    // Fetch the current password hash from the database
    const userSql = 'SELECT password FROM users WHERE id = ?';
    const users = await executeQuery(userSql, [id]);
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updateSql = 'UPDATE users SET password = ? WHERE id = ?';
    await executeQuery(updateSql, [hashedPassword, id]);
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update delivery person password error:', error);
    res.status(500).json({ error: 'Error updating password' });
  }
});

// ==================== PAYMENT ROUTES ====================

// Stripe payment
app.post('/api/stripe', async (req, res) => {
  try {
    const { amount, currency, source } = req.body;
    const charge = await stripe.charges.create({
      amount,
      currency,
      source,
      description: 'Payment for food delivery',
    });
    res.json(charge);
  } catch (error) {
    console.error('Stripe payment error:', error);
    res.status(500).json({ error: 'Error processing Stripe payment' });
  }
});

// M-Pesa payment
app.post('/api/mpesa', async (req, res) => {
  try {
    let { phoneNumber, amount } = req.body;

    // Validate amount
    amount = parseFloat(amount);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount. Must be a positive number." });
    }
    if (amount < 10) {
      return res.status(400).json({ error: "Minimum amount is 10 KES" });
    }
    amount = Math.floor(amount);

    // Validate phone number
    if (!phoneNumber || !/^(07|2547|25407|\+2547)\d{8}$/.test(phoneNumber)) {
      return res.status(400).json({ error: "Invalid phone number format. Use format: 07XXXXXXXX, 2547XXXXXXXX, or +2547XXXXXXXX" });
    }

    // Convert phone number to 254 format
    phoneNumber = phoneNumber.replace(/^0/, '254').replace(/^\+/, '');

    // Generate timestamp and password
    const now = new Date();
    const timestamp = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
      String(now.getHours()).padStart(2, '0'),
      String(now.getMinutes()).padStart(2, '0'),
      String(now.getSeconds()).padStart(2, '0')
    ].join('');

    const password = Buffer.from(`${config.mpesa.shortCode}${config.mpesa.passkey}${timestamp}`).toString('base64');

    // Get OAuth token
    const tokenResponse = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        auth: {
          username: config.mpesa.consumerKey,
          password: config.mpesa.consumerSecret,
        },
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // Initiate STK Push
    const stkResponse = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        BusinessShortCode: config.mpesa.shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: phoneNumber,
        PartyB: config.mpesa.shortCode,
        PhoneNumber: phoneNumber,
        CallBackURL: config.mpesa.callbackURL,
        AccountReference: 'FoodDelivery',
        TransactionDesc: 'Payment for meal order',
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }
      }
    );

    res.json({
      success: true,
      message: 'Payment request initiated successfully',
      data: stkResponse.data
    });

  } catch (error) {
    console.error('M-Pesa API Error:', error);
    const errorMessage = error.response?.data?.errorMessage || 
                       error.response?.data?.message || 
                       'Failed to process payment';

    res.status(error.response?.status || 500).json({
      success: false,
      error: errorMessage,
      code: error.response?.data?.errorCode
    });
  }
});

// ==================== USER ROUTES ====================

// Get user orders
app.get('/api/users/:userId/orders', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const sql = 'SELECT * FROM orders WHERE user_id = ?';
    const orders = await executeQuery(sql, [userId]);
    res.json(orders);
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({ error: 'Error fetching user orders' });
  }
});

// ==================== DELIVERY ROUTES ====================

// Get delivery orders
app.get('/api/delivery/orders', async (req, res) => {
  try {
    const { deliveryPersonId, restaurantId } = req.query;

    if (!deliveryPersonId || !restaurantId) {
      return res.status(400).json({ error: 'Both deliveryPersonId and restaurantId are required' });
    }

    const query = `
      SELECT o.id,
             o.order_number, 
             m.name AS meal_name, 
             m.description AS meal_description, 
             m.image AS meal_image, 
             o.quantity, 
             o.address,
             r.name AS restaurant_name, 
             r.location AS restaurant_location,
             u.phone AS user_phone
      FROM orders o
      JOIN meals m ON o.meal_id = m.id
      JOIN restaurants r ON o.restaurant_id = r.id
      JOIN delivery_persons dp ON dp.restaurant_id = o.restaurant_id
      JOIN users u ON o.user_id = u.id
      WHERE dp.user_id = ? 
        AND o.restaurant_id = ?  
        AND o.status = 'Out for Delivery'
    `;

    const orders = await executeQuery(query, [deliveryPersonId, restaurantId]);

    if (orders.length === 0) {
      return res.status(404).json({ message: 'No orders found for the delivery person at this restaurant' });
    }

    res.json(orders);
  } catch (error) {
    console.error('Get delivery orders error:', error);
    res.status(500).json({ error: 'Error fetching delivery orders' });
  }
});

// Dispatch order
app.put('/api/orders/:id/dispatch', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const sql = 'UPDATE orders SET status = ? WHERE id = ?';
    await executeQuery(sql, ['Delivered', id]);
    
    res.json({ message: 'Order dispatched successfully' });
  } catch (error) {
    console.error('Dispatch order error:', error);
    res.status(500).json({ error: 'Error dispatching order' });
  }
});

// ==================== ERROR HANDLING ====================

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

// ==================== SERVER STARTUP ====================

async function startServer() {
  try {
    await initializeDatabase();
    
    const server = app.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port}`);
      console.log(`📊 Health check: http://localhost:${config.port}/api/health`);
    });

    // Attach WebSocket server to HTTP server
    server.on('upgrade', (request, socket, head) => {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
startServer(); 
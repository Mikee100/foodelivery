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

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });
const app = express();


app.use(bodyParser.json());


app.use(cors());
const port = 3000;
const db = mysql.createPool({
  host: 'localhost',          // Tunnel endpoint
  user: 'root',
  password: '10028mike.',
  database: 'food_delivery',  // or 'railway' — check your schema name
 
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0               // When using `railway connect`, it'll usually forward to 3306

});



// Connect to MySQL
async function testConnection() {
  try {
    const connection = await db.getConnection();
    console.log('MySQL connected...');
    connection.release(); // Release the connection back to the pool
  } catch (err) {
    console.error('MySQL connection failed:', err);
    process.exit(1); // Exit if connection fails
  }
}

testConnection();

const stripe = require('stripe')('sk_test_51P1B7LCXIhVW50LeLXacm9VK72GEVjz5HQ7n10tCy9aHRI69LMXXgp4m2mPsQgOTQRcP1HQwTNCVBSyeDHMBOz9p00Rgu6NaPe');




const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (ws) => {
  console.log('WebSocket connection established');
});


// Endpoint to upload images
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  const imageUrl = `http://roundhouse.proxy.rlwy.net:${port}/uploads/${req.file.filename}`;
  res.send({ imageUrl });
});

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



app.post('/api/mpesa', async (req, res) => {
  let { phoneNumber, amount } = req.body;

  // Validate and format amount
  amount = parseFloat(amount);
  if (isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: "Invalid amount. Must be a positive number." });
  }

  // M-Pesa requires amount to be at least 10 KES and whole numbers
  if (amount < 10) {
    return res.status(400).json({ error: "Minimum amount is 10 KES" });
  }
  amount = Math.floor(amount); // Remove decimals

  // Load credentials from environment variables
  const consumerKey = process.env.MPESA_CONSUMER_KEY || 'JFvBXWMm0yPfiDwTWNPbc2TodFikv8VOBcIhDQ1xbRIBr7TE';
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET || 'Q16rZBLRjCN1VXaBMmzInA3QpGX0MXidMYY0EUweif6PsvbsUQ8GLBLiqZHaebk9';
  const shortCode = process.env.MPESA_SHORTCODE || '174379'; // Your Paybill/Till Number
  const passkey = process.env.MPESA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
  const callbackURL = process.env.MPESA_CALLBACK_URL || 'https://mydomain.com/path'; 

  // Validate phone number (FIXED REGEX)
  if (!phoneNumber || !/^(07|2547|25407|\+2547)\d{8}$/.test(phoneNumber)) {
    return res.status(400).json({ error: "Invalid phone number format. Use format: 07XXXXXXXX, 2547XXXXXXXX, or +2547XXXXXXXX" });
  }

  // Convert phone number to 254 format
  phoneNumber = phoneNumber.replace(/^0/, '254').replace(/^\+/, '');

  // Rest of your code remains the same...
  // Generate timestamp (YYYYMMDDHHmmss)
  const now = new Date();
  const timestamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0')
  ].join('');

  // Generate password (Base64 encoded shortcode + passkey + timestamp)
  const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');

  try {
    // Get OAuth token
    const tokenResponse = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        auth: {
          username: consumerKey,
          password: consumerSecret,
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
        BusinessShortCode: shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: phoneNumber,
        PartyB: shortCode,
        PhoneNumber: phoneNumber,
        CallBackURL: callbackURL,
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

    res.status(200).json({
      success: true,
      message: 'Payment request initiated successfully',
      data: stkResponse.data
    });

  } catch (error) {
    console.error('M-Pesa API Error:', {
      request: error.config?.data,
      response: error.response?.data,
      message: error.message
    });

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
app.post('/api/stripe', async (req, res) => {
  const { amount, currency, source } = req.body;

  try {
    const charge = await stripe.charges.create({
      amount,
      currency,
      source,
      description: 'Payment for food delivery',
    });

    res.send(charge);
  } catch (error) {
    console.error('Error processing Stripe payment:', error);
    res.status(500).send('Error processing Stripe payment');
  }
});
app.post('/api/signup', async (req, res) => {
  const { username, email, password, phone, county, location } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const role = 'user'; // Set the role to 'user'
  let sql = 'INSERT INTO users (username, email, password, phone, county, location, role) VALUES (?, ?, ?, ?, ?, ?, ?)';
  db.query(sql, [username, email, hashedPassword, phone, county, JSON.stringify(location), role], (err, result) => {
    if (err) throw err;
    res.send('User created successfully');
  });
});
const SECRET = 'waweru'


app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  console.log("Login attempt for:", email);

  // Input validation
  if (!email || !password) {
    console.warn("Validation failed - missing credentials");
    return res.status(400).json({ 
      success: false,
      message: 'Email and password are required' 
    });
  }

  try {
    // Database query
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    console.log("User query results:", users.length, "users found");
    
    if (users.length === 0) {
      console.warn("No user found for email:", email);
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    const user = users[0];
    console.log("Authenticating user:", user.id, "Role:", user.role);
 

    // Account status checks
    if (user.status_disabled) {
      console.warn("Account disabled for user:", user.id);
      return res.status(403).json({ 
        success: false,
        message: 'Account disabled. Contact support.' 
      });
    }

   

    // Password verification
    console.log("Comparing passwords...");
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn("Password mismatch for user:", user.id);
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Prepare token payload
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    // Role-specific data fetching
    if (user.role === 'restaurant_owner') {
      console.log("Fetching restaurant data for owner:", user.id);
      const [restaurants] = await db.query(
        'SELECT id FROM restaurants WHERE user_id = ?', 
        [user.id]
      );
      if (restaurants.length > 0) {
        tokenPayload.restaurantId = restaurants[0].id;
        console.log("Restaurant ID found:", restaurants[0].id);
      }
    }

    if (user.role === 'delivery_person') {
      console.log("Fetching delivery person data:", user.id);
      const [deliveryPersons] = await db.query(
        'SELECT id, restaurant_id FROM delivery_persons WHERE user_id = ?',
        [user.id]
      );
      if (deliveryPersons.length > 0) {
        tokenPayload.deliveryPersonId = deliveryPersons[0].id;
        tokenPayload.restaurantId = deliveryPersons[0].restaurant_id;
        console.log("Delivery person data found:", deliveryPersons[0]);
      }
    }

    // Generate JWT token
    console.log("Generating JWT token...");
    const token = jwt.sign(tokenPayload, SECRET, { expiresIn: '24h' });

    // Session setup
    if (req.session) {
      req.session.token = token;
      req.session.userId = user.id;
      req.session.role = user.role;
      console.log("Session configured for user:", user.id);
    }

    // Successful response
    const response = {
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };

    // Add role-specific IDs to response
    if (tokenPayload.restaurantId) {
      response.restaurantId = tokenPayload.restaurantId;
    }
    if (tokenPayload.deliveryPersonId) {
      response.deliveryPersonId = tokenPayload.deliveryPersonId;
    }

    console.log("Login successful for:", user.email);
    return res.status(200).json(response);

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});


const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).send('Access denied');
  }
  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).send('Invalid token');
  }
};
app.get('/api/protected', authenticate, (req, res) => {
  res.send('This is a protected route');
});
app.get('/createRestaurantTable', (req, res) => {
  let sql = `CREATE TABLE restaurants (
    id INT AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    image VARCHAR(255),
    description TEXT,
    PRIMARY KEY (id)
  )`;

  db.query(sql, (err, result) => {
    if (err) throw err;
    res.send('Restaurants table created...');
  });
});


app.post('/api/admin/addRestaurant', async (req, res) => {
  const { name, email, location, description, image, username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const role = 'restaurant_owner';

  db.beginTransaction((err) => {
    if (err) throw err;

    const addUserSql = 'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)';
    db.query(addUserSql, [username, email, hashedPassword, role], (err, result) => {
      if (err) {
        return db.rollback(() => {
          throw err;
        });
      }

      const userId = result.insertId;
      const addRestaurantSql = 'INSERT INTO restaurants (name, email, location, description, image, user_id) VALUES (?, ?, ?, ?, ?, ?)';
      db.query(addRestaurantSql, [name, email, location, description, image, userId], (err, result) => {
        if (err) {
          return db.rollback(() => {
            throw err;
          });
        }

        db.commit((err) => {
          if (err) {
            return db.rollback(() => {
              throw err;
            });
          }
          res.send('Restaurant and user created successfully');
        });
      });
    });
  });
});
app.delete('/api/restaurants/:id', (req, res) => {
  const { id } = req.params;

  // First, delete all related rows in the delivery_persons table
  let sql = 'DELETE FROM delivery_persons WHERE restaurant_id = ?';
  db.query(sql, [id], (err, result) => {
    if (err) throw err;

    // Then, delete the restaurant
    sql = 'DELETE FROM restaurants WHERE id = ?';
    db.query(sql, [id], (err, result) => {
      if (err) throw err;
      res.send({ message: 'Restaurant deleted successfully' });
    });
  });
});

app.post('/api/restaurants', (req, res) => {
  const { name, email, location, description, image } = req.body;
  let sql = 'INSERT INTO restaurants (name, email, location, description, image) VALUES (?, ?, ?, ?, ?)';
  db.query(sql, [name, email, location, description, image], (err, result) => {
    if (err) throw err;
    res.send('Restaurant added successfully');
  });
});

app.get('/api/restaurants', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM restaurants');
    res.json(results);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

app.get('/api/restaurants/:id', async (req, res) => {
  try {
    const [results] = await db.query(
      'SELECT * FROM restaurants WHERE id = ?',
      [req.params.id]
    );
    if (results.length === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    res.json(results[0]);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});


app.get('/api/restaurants/:id/meals', async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT meals.*, categories.name AS category_name
      FROM meals
      LEFT JOIN categories ON meals.category_id = categories.id
      WHERE meals.restaurant_id = ?
    `, [req.params.id]);

    if (!results || results.length === 0) {
      return res.status(404).json({ 
        message: 'No meals found for this restaurant',
        data: []
      });
    }

    return res.json(results); // Only one response is sent
    
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ 
      error: 'Failed to fetch meals',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});
app.post('/api/restaurants/:id/meals', (req, res) => {
  const { id } = req.params;
  const { name, image, description, price } = req.body;
  let sql = 'INSERT INTO meals (name, image, description, price, restaurant_id) VALUES (?, ?, ?, ?, ?)';
  db.query(sql, [name, image, description, price, id], (err, result) => {
    if (err) throw err;
    res.send('Meal added...');
  });
  
});
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
      decoded = jwt.verify(token, SECRET);
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
      is_spicy: req.body.is_spicy ? 1 : 0, // Convert to MySQL tinyint
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
      date: new Date() // Explicitly set current timestamp
    };

    // Execute query with transaction for safety
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Insert the order
      const [result] = await connection.query('INSERT INTO orders SET ?', [orderData]);

      // 2. Optionally update restaurant/meal stats here if needed

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
// At the top of your server file (or in a config file)
const JWT_SECRET =  'waweru';
// Add this middleware to verify tokens consistently
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ 
      success: false,
      code: 'MISSING_TOKEN',
      message: 'Authorization header missing' 
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ 
      success: false,
      code: 'INVALID_TOKEN_FORMAT',
      message: 'Token format should be: Bearer <token>' 
    });
  }

  const token = parts[1];
  if (!token || token.length < 50) {
    return res.status(401).json({ 
      success: false,
      code: 'INVALID_TOKEN',
      message: 'Malformed token' 
    });
  }

  try {
    // Use JWT_SECRET instead of undefined SECRET
    req.user = jwt.verify(token, process.env.JWT_SECRET || JWT_SECRET);
    next();
  } catch (err) {
    console.error('JWT verification failed:', err.message);
    return res.status(401).json({ 
      success: false,
      code: 'TOKEN_VERIFICATION_FAILED',
      message: 'Invalid or expired token' 
    });
  }
};
app.get('/api/orders/:orderId', verifyToken, async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    if (isNaN(orderId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid order ID format' 
      });
    }

    // req.user is already set by verifyToken middleware
    const [results] = await db.query(`
      SELECT o.*, m.name as meal_name, r.name as restaurant_name
      FROM orders o
      LEFT JOIN meals m ON o.meal_id = m.id
      LEFT JOIN restaurants r ON o.restaurant_id = r.id
      WHERE o.id = ? AND o.user_id = ?
    `, [orderId, req.user.userId]); // Use req.user.userId

    if (!results.length) {
      return res.status(404).json({ 
        success: false, 
        error: 'Order not found or access denied' 
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
        special_instructions: order.special_instructions
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
app.get('/api/meals/:id', async (req, res) => {
  const { id } = req.params;
  
  // Enhanced input validation
  if (!id || !/^\d+$/.test(id)) {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid meal ID: must be a positive integer'
    });
  }

  try {
    const sql = `
      SELECT 
        m.id,
        m.name,
        m.description,
        m.price,
        m.image,
         m.restaurant_id,
        c.name AS category_name,
        r.name AS restaurant_name
      FROM meals m
      LEFT JOIN categories c ON m.category_id = c.id
      LEFT JOIN restaurants r ON m.restaurant_id = r.id
      WHERE m.id = ?
    `;
    
    const [results] = await db.query(sql, [id]);
    
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
      price: Number(results[0].price), // Keep as number (not string)
      image: results[0].image || null,
      restaurant_id: results[0].restaurant_id,
      categoryName: results[0].category_name || null,
      restaurantName: results[0].restaurant_name || null
    };

    res.json({
      success: true,
      data: mealData
    });

  } catch (error) {
    console.error('Database error:', error);
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

app.put('/api/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status) {
    return res.status(400).send('Status is required');
  }
  let sql = 'UPDATE orders SET status = ? WHERE id = ?';
  db.query(sql, [status, id], (err, result) => {
    if (err) throw err;
    res.send('Order status updated');

    // Notify all connected clients about the status update
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ orderId: id, status }));
      }
    });
  });
});
app.get('/api/orders/:orderNumber', (req, res) => {
  const { orderNumber } = req.params;
  let sql = 'SELECT * FROM orders WHERE order_number = ?';
  db.query(sql, [orderNumber], (err, result) => {
    if (err) throw err;
    res.json(result[0]);
  });
});
app.get('/api/restaurants/:restaurantId/orders', (req, res) => {
  const { restaurantId } = req.params;
  let sql = 'SELECT * FROM orders WHERE restaurant_id = ?';
  db.query(sql, [restaurantId], (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});
app.put('/api/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  let sql = 'UPDATE orders SET status = ? WHERE id = ?';
  db.query(sql, [status, id], (err, result) => {
    if (err) throw err;
    res.send('Order status updated');

    // Notify all connected clients about the status update
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ orderId: id, status }));
      }
    });
  });
});
// Fetch delivered orders for a specific restaurant
app.get('/api/processedorders/processed', (req, res) => {
  const { restaurantId } = req.query; // Get the restaurantId from the query parameter

  if (!restaurantId) {
    return res.status(400).send('Restaurant ID is required');
  }

  const sql = 'SELECT * FROM orders WHERE restaurant_id = ? AND status = "Delivered"';
  db.query(sql, [restaurantId], (err, result) => {
    if (err) {
      console.error('Error fetching delivered orders:', err);
      return res.status(500).send('Error fetching delivered orders');
    }
    res.json(result); // Ensure the response is an array
  });
});
app.post('/api/categories', (req, res) => {
  const { name, restaurantId } = req.body;
  const sql = 'INSERT INTO categories (name, restaurant_id) VALUES (?, ?)';
  db.query(sql, [name, restaurantId], (err, result) => {
    if (err) {
      console.error('Error adding category:', err);
      return res.status(500).send('Error adding category');
    }
    res.send({ id: result.insertId, name, restaurantId });
  });
});

app.get('/api/restaurants/:restaurantId/categories', (req, res) => {
  const { restaurantId } = req.params;
  const sql = 'SELECT * FROM categories WHERE restaurant_id = ?';
  db.query(sql, [restaurantId], (err, result) => {
    if (err) {
      console.error('Error fetching categories:', err);
      return res.status(500).send('Error fetching categories');
    }
    res.send(result);
  });
});



app.post('/api/meals', (req, res) => {
  const { name, image, description, price, restaurant_id, category_id } = req.body;
  let sql = 'INSERT INTO meals (name, image, description, price, restaurant_id, category_id) VALUES (?, ?, ?, ?, ?, ?)';
  db.query(sql, [name, image, description, price, restaurant_id, category_id], (err, result) => {
    if (err) throw err;
    res.send('Meal added successfully');
  });
});

// GET endpoint to fetch all meals
app.get('/api/meals', (req, res) => {
  let sql = 'SELECT * FROM meals';
  db.query(sql, (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

app.get('/api/orders', (req, res) => {
  const { restaurantId } = req.query; // Get the restaurantId from the query parameter

  if (!restaurantId) {
    return res.status(400).send('Restaurant ID is required');
  }

  let sql = `
    SELECT orders.*, meals.name AS meal_name, meals.description AS meal_description
    FROM orders
    JOIN meals ON orders.meal_id = meals.id
    WHERE orders.restaurant_id = ?
  `;
  db.query(sql, [restaurantId], (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});
app.put('/api/updatemeals/:id', (req, res) => {
  const { id } = req.params;
  const { name, image, description, price, category_id, spicy, withFries, withSoda, extraCheese, extraSauce, withSalad, withChilly, withPasta } = req.body;
  const sql = 'UPDATE meals SET name = ?, image = ?, description = ?, price = ?, category_id = ?, spicy = ?, with_fries = ?, with_soda = ?, extra_cheese = ?, extra_sauce = ?, with_salad = ?, with_chilly = ?, with_pasta = ? WHERE id = ?';
  db.query(sql, [name, image, description, price, category_id, spicy, withFries, withSoda, extraCheese, extraSauce, withSalad, withChilly, withPasta, id], (err, result) => {
    if (err) {
      console.error('Error updating meal:', err);
      return res.status(500).send('Error updating meal');
    }
    res.send({ id, name, image, description, price, category_id, spicy, withFries, withSoda, extraCheese, extraSauce, withSalad, withChilly, withPasta });
  });
});



app.post('/api/delivery-persons', async (req, res) => {
  const { name, email, restaurantId } = req.body;
  const password = '1234'; // Set a default password for the delivery person
  const hashedPassword = await bcrypt.hash(password, 10);
  const role = 'delivery_person';

  db.beginTransaction((err) => {
    if (err) throw err;

    const addUserSql = 'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)';
    db.query(addUserSql, [name, email, hashedPassword, role], (err, result) => {
      if (err) {
        return db.rollback(() => {
          throw err;
        });
      }

      const userId = result.insertId;
      const addDeliveryPersonSql = 'INSERT INTO delivery_persons (name, email, restaurant_id, user_id) VALUES (?, ?, ?, ?)';
      db.query(addDeliveryPersonSql, [name, email, restaurantId, userId], (err, result) => {
        if (err) {
          return db.rollback(() => {
            throw err;
          });
        }

        db.commit((err) => {
          if (err) {
            return db.rollback(() => {
              throw err;
            });
          }
          res.send('Delivery person created successfully');
        });
      });
    });
  });
});
app.get('/api/delivery/orders', async (req, res) => {
  const { deliveryPersonId, restaurantId } = req.query;

  // Validate if deliveryPersonId and restaurantId are provided
  if (!deliveryPersonId || !restaurantId) {
    return res.status(400).json({ message: 'Both deliveryPersonId and restaurantId are required' });
  }

  try {
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
        AND o.status = 'Out for Delivery'`;  // Or another relevant status

    // Querying the database
    const [orders] = await db.promise().query(query, [deliveryPersonId, restaurantId]);

    // Check if no orders were found
    if (orders.length === 0) {
      return res.status(404).json({ message: 'No orders found for the delivery person at this restaurant' });
    }

    // Return the fetched orders
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
});

app.put('/api/orders/:id/dispatch', (req, res) => {
  const { id } = req.params;
  const sql = 'UPDATE orders SET status = ? WHERE id = ?';
  db.query(sql, ['Delivered', id], (err, result) => {
    if (err) {
      console.error('Error updating order status:', err);
      return res.status(500).json({ message: 'Error updating order status' });
    }
    res.json({ message: 'Order dispatched successfully' });
  });
});

app.get('/api/restaurants/:restaurantId/delivery-persons', (req, res) => {
  const { restaurantId } = req.params;
  let sql = 'SELECT * FROM delivery_persons WHERE restaurant_id = ?';
  db.query(sql, [restaurantId], (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

app.get('/api/restaurants/:restaurantId/meals', (req, res) => {
  const { restaurantId } = req.params;
  let sql = 'SELECT * FROM meals WHERE restaurant_id = ?';
  db.query(sql, [restaurantId], (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

// Endpoint to fetch delivery person details
app.get('/api/delivery-persons/:id', (req, res) => {
  const { id } = req.params;
  let sql = 'SELECT * FROM delivery_persons WHERE user_id = ?';
  db.query(sql, [id], (err, result) => {
    if (err) throw err;
    res.json(result[0]);
  });
});

// Endpoint to update delivery person details
app.put('/api/delivery-persons/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, phone, picture } = req.body;
  let sql = 'UPDATE delivery_persons SET name = ?, email = ?, phone = ?, picture = ? WHERE user_id = ?';
  db.query(sql, [name, email, phone, picture, id], (err, result) => {
    if (err) throw err;
    res.send('Delivery person details updated successfully');
  });
});

app.put('/api/delivery-persons/:id/password', async (req, res) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;

  // Fetch the current password hash from the database
  let sql = 'SELECT password FROM users WHERE id = ?';
  db.query(sql, [id], async (err, result) => {
    if (err) throw err;

    const user = result[0];
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).send('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    let updateSql = 'UPDATE users SET password = ? WHERE id = ?';
    db.query(updateSql, [hashedPassword, id], (err, result) => {
      if (err) throw err;
      res.send('Password updated successfully');
    });
  });
});
app.get('/api/search', (req, res) => {
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
  db.query(sql, [`%${query}%`], (err, results) => {
    if (err) {
      console.error('Error searching for meals and restaurants:', err);
      return res.status(500).send('Error searching for meals and restaurants');
    }
    res.json(results);
  });
});


// Endpoint to fetch user details
app.get('/api/users/:userId', (req, res) => {
  const { userId } = req.params;
  let sql = 'SELECT * FROM users WHERE id = ?';
  db.query(sql, [userId], (err, result) => {
    if (err) throw err;
    res.json(result[0]);
  });
});

// Endpoint to fetch user orders
app.get('/api/users/:userId/orders', (req, res) => {
  const { userId } = req.params;
  let sql = `
    SELECT orders.*, meals.name AS meal_name
    FROM orders
    JOIN meals ON orders.meal_id = meals.id
    WHERE orders.user_id = ?
  `;
  db.query(sql, [userId], (err, result) => {
    if (err) throw err;
    res.json(result);
  });
});
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});






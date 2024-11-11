const express = require('express');
const mysql = require('mysql2');
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
const port = 3000;

app.use(bodyParser.json());


app.use(cors());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '10028mike.',
  database: 'food_delivery'
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log('MySQL connected...');
});

const stripe = require('stripe')('sk_test_51P1B7LCXIhVW50LeLXacm9VK72GEVjz5HQ7n10tCy9aHRI69LMXXgp4m2mPsQgOTQRcP1HQwTNCVBSyeDHMBOz9p00Rgu6NaPe');


const dbPromise = db.promise();
// Create WebSocket server
const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (ws) => {
  console.log('WebSocket connection established');
});


// Endpoint to upload images
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  const imageUrl = `http://localhost:${port}/uploads/${req.file.filename}`;
  res.send({ imageUrl });
});

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



app.post('/api/mpesa', async (req, res) => {
  const { phoneNumber, amount } = req.body;

  const consumerKey = 'kEcjDPFRW1xcEJflAtezvjDsUjuSpyTKeTHY6WnyvH4hcsO5';
  const consumerSecret = '0mfWBCGsN3JZCNm3QF6kb3KxxGDyIAZZP1BkLaQoAhH6uogq0cAiRZWr0yqbzFDc';
  const shortCode = 'N/A';
  const passkey = 'YOUR_PASSKEY';
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
  const password = Buffer.from(shortCode + passkey + timestamp).toString('base64');

  try {
    // Get access token
    const tokenResponse = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      auth: {
        username: consumerKey,
        password: consumerSecret,
      },
    });
    const accessToken = tokenResponse.data.access_token;

    // Make payment request
    const paymentResponse = await axios.post(
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
        CallBackURL: 'https://your-callback-url.com/callback',
        AccountReference: 'FoodDelivery',
        TransactionDesc: 'Payment for food delivery',
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    res.send(paymentResponse.data);
  } catch (error) {
    console.error('Error processing Mpesa payment:', error);
    res.status(500).send('Error processing Mpesa payment');
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
  
  // Query to find the user by email
  let sql = 'SELECT * FROM users WHERE email = ?';
  
  // Use promise-based approach to handle the query for better async handling
  try {
    const result = await new Promise((resolve, reject) => {
      db.query(sql, [email], (err, result) => {
        if (err) reject(err);
        resolve(result);
      });
    });

    if (result.length === 0) {
      return res.status(401).send('Invalid credentials');
    }

    const user = result[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).send('Invalid credentials');
    }

    // Initialize variables to hold additional role-based data
    let restaurantId = null;
    let deliveryPersonId = null;

    // Fetch the restaurant_id if the user is a restaurant owner
    if (user.role === 'restaurant_owner') {
      let restaurantSql = 'SELECT id FROM restaurants WHERE user_id = ?';
      const restaurantResult = await new Promise((resolve, reject) => {
        db.query(restaurantSql, [user.id], (err, result) => {
          if (err) reject(err);
          resolve(result);
        });
      });
      if (restaurantResult.length > 0) {
        restaurantId = restaurantResult[0].id;
      }
    }

    // Fetch the deliveryPersonId if the user is a delivery person
    if (user.role === 'delivery_person') {
      let deliverySql = 'SELECT id, restaurant_id FROM delivery_persons WHERE user_id = ?';
      const deliveryResult = await new Promise((resolve, reject) => {
        db.query(deliverySql, [user.id], (err, result) => {
          if (err) reject(err);
          resolve(result);
        });
      });
      if (deliveryResult.length > 0) {
        deliveryPersonId = deliveryResult[0].id;
        // Set restaurantId for delivery person if it's associated
        restaurantId = deliveryResult[0].restaurant_id || null;
      }
    }

    // Create a JWT token that includes role-specific information
    const token = jwt.sign(
      { id: user.id, role: user.role, restaurant_id: restaurantId, delivery_person_id: deliveryPersonId },
      SECRET,
      { expiresIn: '1h' }
    );

    // Log the generated token to the console for debugging
    console.log('Generated Token:', token);

    // Respond with token and additional data
    res.send({ token, role: user.role, user, restaurantId, deliveryPersonId });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).send('Internal server error');
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

app.post('/api/restaurants', (req, res) => {
  const { name, email, location, description, image } = req.body;
  let sql = 'INSERT INTO restaurants (name, email, location, description, image) VALUES (?, ?, ?, ?, ?)';
  db.query(sql, [name, email, location, description, image], (err, result) => {
    if (err) throw err;
    res.send('Restaurant added successfully');
  });
});

app.get('/api/restaurants', (req, res) => {
  let sql = 'SELECT * FROM restaurants';
  db.query(sql, (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

app.get('/api/restaurants/:id', (req, res) => {
  const { id } = req.params;
  let sql = 'SELECT * FROM restaurants WHERE id = ?';
  db.query(sql, [id], (err, result) => {
    if (err) throw err;
    res.json(result[0]);
  });
});


app.get('/api/restaurants/:id/meals', (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT meals.*, categories.name AS category_name
    FROM meals
    LEFT JOIN categories ON meals.category_id = categories.id
    WHERE meals.restaurant_id = ?
  `;
  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error('Error fetching meals:', err);
      return res.status(500).send('Error fetching meals');
    }
    res.json(results);
  });
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
app.post('/api/orders', (req, res) => {
  const {
    userId,
    mealId,
    restaurantId,
    quantity,
    isSpicy,
    addDrink,
    selectedDrink,
    address,
    deliveryFee,
    location,
    paymentMethod,
    withFries,
    withSoda,
    withSalad,
    withSauce,
    withChilly,
    withPasta,
  } = req.body;

  const generateOrderNumber = () => {
    return 'ORD' + Math.floor(Math.random() * 1000000000) + Date.now();
  };

  const orderNumber = generateOrderNumber();

  let sql = `
    INSERT INTO orders (
      order_number,
      user_id,
      meal_id,
      restaurant_id,
      quantity,
      is_spicy,
      add_drink,
      selected_drink,
      address,
      delivery_fee,
      location,
      payment_method,
      with_fries,
      with_soda,
      with_salad,
      with_sauce,
      with_chilly,
      with_pasta,
      status,
      date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
  `;

  db.query(sql, [
    orderNumber,
    userId,
    mealId,
    restaurantId,
    quantity,
    isSpicy,
    addDrink,
    selectedDrink,
    address,
    deliveryFee,
    JSON.stringify(location),
    paymentMethod,
    withFries,
    withSoda,
    withSalad,
    withSauce,
    withChilly,
    withPasta,
    0 // Assuming 0 is the default status for a new order
  ], (err, result) => {
    if (err) throw err;
    res.send({ message: 'Order placed successfully', orderId: result.insertId, orderNumber });
  });
});
app.get('/api/meals/:id', (req, res) => {
  const { id } = req.params;
  let sql = 'SELECT * FROM meals WHERE id = ?';
  db.query(sql, [id], (err, result) => {
    if (err) throw err;
    res.json(result[0]);
  });
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


// Endpoint to create a delivery person and link them to the restaurant
app.post('/api/delivery-persons', async (req, res) => {
  const { name, email, restaurantId } = req.body;
  const password = 'defaultpassword'; // Set a default password for the delivery person
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
             m.name AS meal_name, 
             m.description AS meal_description, 
             m.image AS meal_image, 
             o.quantity, 
             o.address,
             r.name AS restaurant_name, 
             r.location AS restaurant_location
      FROM orders o
      JOIN meals m ON o.meal_id = m.id
      JOIN restaurants r ON o.restaurant_id = r.id
      JOIN delivery_persons dp ON dp.restaurant_id = o.restaurant_id
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






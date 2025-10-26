const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const app = express();

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// serve uploads if you use multer for images
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// MOUNT ROUTES
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));  
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));

app.get('/_health', (_req, res) => res.json({ ok: true }));

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
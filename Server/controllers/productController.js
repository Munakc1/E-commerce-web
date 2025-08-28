const pool = require('../../config/database');

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute('SELECT * FROM products ORDER BY created_at DESC');
    connection.release();
    
    // Parse images from JSON string to array
    const products = rows.map(product => ({
      ...product,
      images: product.images ? JSON.parse(product.images) : []
    }));
    
    res.json(products);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single product
exports.getProduct = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute('SELECT * FROM products WHERE id = ?', [req.params.id]);
    connection.release();
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const product = {
      ...rows[0],
      images: rows[0].images ? JSON.parse(rows[0].images) : []
    };
    
    res.json(product);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create new product
exports.createProduct = async (req, res) => {
  try {
    const { title, price, originalPrice, brand, size, condition, seller, location } = req.body;
    
    // Handle image uploads
    const imageUrls = req.files ? req.files.map(file => file.path) : [];
    
    const connection = await pool.getConnection();
    const [result] = await connection.execute(
      `INSERT INTO products (title, price, original_price, brand, size, condition, images, seller, location) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, price, originalPrice, brand, size, condition, JSON.stringify(imageUrls), seller, location]
    );
    connection.release();
    
    res.status(201).json({ 
      message: 'Product created successfully', 
      productId: result.insertId 
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const { title, price, originalPrice, brand, size, condition, seller, location } = req.body;
    
    // Get current product to handle image updates
    const connection = await pool.getConnection();
    const [currentRows] = await connection.execute('SELECT images FROM products WHERE id = ?', [req.params.id]);
    
    if (currentRows.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Product not found' });
    }
    
    let imageUrls = currentRows[0].images ? JSON.parse(currentRows[0].images) : [];
    
    // Add new images if any
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => file.path);
      imageUrls = [...imageUrls, ...newImages];
    }
    
    // Update the product
    await connection.execute(
      `UPDATE products 
       SET title = ?, price = ?, original_price = ?, brand = ?, size = ?, condition = ?, images = ?, seller = ?, location = ? 
       WHERE id = ?`,
      [title, price, originalPrice, brand, size, condition, JSON.stringify(imageUrls), seller, location, req.params.id]
    );
    connection.release();
    
    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    // First check if product exists
    const [rows] = await connection.execute('SELECT id FROM products WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Delete the product
    await connection.execute('DELETE FROM products WHERE id = ?', [req.params.id]);
    connection.release();
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
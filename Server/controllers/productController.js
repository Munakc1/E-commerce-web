const pool = require("../db");

// 📌 Create Product
exports.createProduct = async (req, res) => {
  console.log("BODY:", req.body);
  console.log("FILES:", req.files);

  const { title, price, originalPrice, brand, size, productCondition, seller, location } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    let mainImage = null;
    let imageUrls = [];

    // Use locally stored files (multer disk storage) and expose via /uploads
    if (Array.isArray(req.files) && req.files.length > 0) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      imageUrls = req.files.map((f, i) => {
        const filename = f.filename || (f.path ? require('path').basename(f.path) : null);
        const url = filename ? `${baseUrl}/uploads/${filename}` : null;
        if (i === 0 && url) mainImage = url;
        return url;
      }).filter(Boolean);
    }

    // Insert into products
    const [result] = await conn.query(
      `INSERT INTO products (title, price, originalPrice, brand, size, productCondition, seller, location, image)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, price, originalPrice, brand, size, productCondition, seller, location, mainImage]
    );

    const productId = result.insertId;

    // Insert all images
    if (Array.isArray(imageUrls) && imageUrls.length > 0) {
      for (const url of imageUrls) {
        await conn.query(
          `INSERT INTO product_images (product_id, image_url) VALUES (?, ?)`,
          [productId, url]
        );
      }
    }

    await conn.commit();

    res.json({
      id: productId,
      title,
      price,
      originalPrice,
      brand,
      size,
      productCondition,
      seller,
      location,
      image: mainImage,
      images: imageUrls
    });

  } catch (err) {
    await conn.rollback();
    console.error("❌ Error creating product:", err);
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
};

// 📌 Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const [products] = await pool.query("SELECT * FROM products");
    const [images] = await pool.query("SELECT * FROM product_images");

    const productList = products.map(p => ({
      ...p,
      images: images.filter(img => img.product_id === p.id).map(img => img.image_url),
    }));

    res.json({
      initialProducts: productList.slice(0, 8),
      moreProducts: productList.slice(8),
    });

  } catch (err) {
    console.error("❌ Error fetching products:", err);
    res.status(500).json({ error: err.message });
  }
};

// 📌 Get single product
exports.getProductById = async (req, res) => {
  try {
    const [products] = await pool.query("SELECT * FROM products WHERE id = ?", [req.params.id]);
    if (!products.length) return res.status(404).json({ msg: "Product not found" });

    const [images] = await pool.query("SELECT image_url FROM product_images WHERE product_id = ?", [req.params.id]);
    res.json({ ...products[0], images: images.map(img => img.image_url) });

  } catch (err) {
    console.error("❌ Error fetching product:", err);
    res.status(500).json({ error: err.message });
  }
};

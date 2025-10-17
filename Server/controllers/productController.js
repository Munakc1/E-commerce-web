const pool = require("../db");
const cloudinary = require("../config/cloudinary");

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

    // Upload images to Cloudinary
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const uploadResult = await cloudinary.uploader.upload(file.path, { folder: "products" });

        if (i === 0) mainImage = uploadResult.secure_url;
        imageUrls.push(uploadResult.secure_url);
      }
    }

    // Insert into products
    const [result] = await conn.query(
      `INSERT INTO products (title, price, originalPrice, brand, size, productCondition, seller, location, image)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, price, originalPrice, brand, size, productCondition, seller, location, mainImage]
    );

    const productId = result.insertId;

    // Insert all images
    for (const url of imageUrls) {
      await conn.query(
        `INSERT INTO product_images (product_id, image_url) VALUES (?, ?)`,
        [productId, url]
      );
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

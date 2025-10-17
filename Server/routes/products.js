const express = require("express");
const upload = require("../middleware/upload");
const { createProduct, getAllProducts, getProductById } = require("../controllers/productController");

const router = express.Router();

router.post("/", upload.array("images", 5), createProduct);
router.get("/", getAllProducts);
router.get("/:id", getProductById);

module.exports = router;

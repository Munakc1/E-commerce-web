"use client";

import { useState, useEffect } from "react";
import { Button } from "@mui/material";
import ArrowRightAltIcon from "@mui/icons-material/ArrowRightAlt";
import { ProductCard } from "@/components/product/ProductCard";

type Product = {
  id: string;
  title: string;
  price: number;
  originalPrice: number;
  brand: string;
  size: string;
  condition: "Excellent" | "Good";
  images: string[];
  seller: string;
  location: string;
};

export const FeaturedProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [moreProducts, setMoreProducts] = useState<Product[]>([]);
  const [showAll, setShowAll] = useState(false);

  // Fetch data from backend, fallback to mock
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Try backend API (replace with your real endpoint later)
        const res = await fetch("/api/products");
        if (!res.ok) throw new Error("Backend not available");
        const data = await res.json();
        setProducts(data.initialProducts || []);
        setMoreProducts(data.moreProducts || []);
      } catch (err) {
        console.warn("Using mock data instead:", err);
        const res = await fetch("/mock/data.json");
        const data = await res.json();
        setProducts(data.initialProducts || []);
        setMoreProducts(data.moreProducts || []);
      }
    };

    fetchData();
  }, []);

  const handleViewAll = () => {
    if (!showAll) {
      setProducts([...products, ...moreProducts]);
      setShowAll(true);
    }
  };

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Featured Pre-Loved Items
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover carefully curated, high-quality second-hand fashion items
            from our trusted sellers
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {products.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>

        {/* View All Button */}
        {!showAll && products.length > 0 && (
          <div className="text-center">
            <Button
              variant="outlined"
              size="large"
              onClick={handleViewAll}
              className="!border-thrift-green !text-thrift-green hover:!bg-thrift-green hover:!text-white"
              endIcon={<ArrowRightAltIcon className="w-5 h-5" />}
            >
              View All Products
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

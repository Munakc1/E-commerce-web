import { Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { ShoppingBag, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  brand: string;
  size: string;
  condition: "Excellent" | "Good" | "Fair";
  images: string[];
  isLiked?: boolean;
  seller: string;
  location: string;
  className?: string;
}

export const ProductCard = ({
  id,
  title,
  price,
  originalPrice,
  brand,
  size,
  condition,
  images,
  isLiked = false,
  seller,
  location,
  className,
}: ProductCardProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [liked, setLiked] = useState(isLiked);
  const [cartItems, setCartItems] = useState<number>(0);
  const [isHovered, setIsHovered] = useState(false);

  // Load cart and wishlist from localStorage on mount
  useEffect(() => {
    // load unified cart (array of item objects)
    const storedCart = JSON.parse(localStorage.getItem("cart") || "[]");
    setCartItems(Array.isArray(storedCart) ? storedCart.length : 0);
    const storedWishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
    setLiked(storedWishlist.includes(id));
  }, [id]);

  const discountPercentage = originalPrice
    ? Math.round((1 - price / originalPrice) * 100)
    : 0;

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "Excellent":
        return "bg-success text-success-foreground";
      case "Good":
        return "bg-thrift-green text-white";
      case "Fair":
        return "bg-warning text-warning-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const handleAddToCart = () => {
    const storedCart: Array<any> = JSON.parse(localStorage.getItem("cart") || "[]");
    const idx = storedCart.findIndex((c) => String(c.id) === String(id));
    if (idx >= 0) {
      storedCart[idx].quantity = (storedCart[idx].quantity || 1) + 1;
    } else {
      storedCart.push({
        id,
        title,
        price,
        image: images && images[0] ? images[0] : "",
        quantity: 1,
      });
    }
    localStorage.setItem("cart", JSON.stringify(storedCart));
    setCartItems(storedCart.length);
  };

  const handleToggleWishlist = () => {
    const storedWishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
    if (storedWishlist.includes(id)) {
      const updatedWishlist = storedWishlist.filter((itemId: string) => itemId !== id);
      localStorage.setItem("wishlist", JSON.stringify(updatedWishlist));
      setLiked(false);
    } else {
      storedWishlist.push(id);
      localStorage.setItem("wishlist", JSON.stringify(storedWishlist));
      setLiked(true);
    }
  };

  return (
    <Card
      className={cn(
        "group overflow-hidden border-none shadow-sm hover:shadow-lg transition-all duration-300 bg-card",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden bg-thrift-cream">
        {/* Product Image */}
        <div className="aspect-[3/4] overflow-hidden">
          <img
            src={images[currentImageIndex]}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>

        {/* Image Indicators */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-1">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  index === currentImageIndex
                    ? "bg-white scale-110"
                    : "bg-white/60 hover:bg-white/80"
                )}
              />
            ))}
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <Badge className={getConditionColor(condition)} variant="secondary">
            {condition}
          </Badge>
          {discountPercentage > 0 && (
            <Badge className="bg-thrift-warm text-white">
              -{discountPercentage}%
            </Badge>
          )}
        </div>

        {/* Action Buttons */}
        <div
          className={cn(
            "absolute top-3 right-3 flex flex-col gap-2 transition-all duration-300",
            isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"
          )}
        >
          <Button
            variant="secondary"
            size="sm"
            className={cn(
              "w-9 h-9 p-0 bg-white/90 hover:bg-white transition-colors",
              liked && "text-red-500 hover:text-red-600"
            )}
            onClick={handleToggleWishlist}
          >
            <Heart className={cn("w-4 h-4", liked && "fill-current")} />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="w-9 h-9 p-0 bg-white/90 hover:bg-white"
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Brand & Seller */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-thrift-earth">{brand}</span>
          <span className="text-xs text-muted-foreground">{location}</span>
        </div>

        {/* Title */}
        <h3 className="font-medium text-foreground leading-tight mb-2 line-clamp-2">
          {title}
        </h3>

        {/* Size & Seller */}
        <div className="flex items-center justify-between mb-3">
          <Badge variant="outline" className="text-xs">
            Size {size}
          </Badge>
          <span className="text-xs text-muted-foreground">by {seller}</span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-thrift-green">
              NPR {price.toLocaleString()}
            </span>
            {originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                NPR {originalPrice.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Add to Cart Button */}
        <Link to="/cart">
          <Button
            className="w-full bg-thrift-green hover:bg-thrift-green/90 text-white"
            size="sm"
            onClick={handleAddToCart}
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            Add to Cart
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Link } from "react-router-dom";
import { Heart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface Product {
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
}

interface WishlistContextType {
  wishlist: Product[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (id: string) => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const [wishlist, setWishlist] = useState<Product[]>([]);

  // Load wishlist from localStorage on mount
  useEffect(() => {
    const storedWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    setWishlist(storedWishlist);
  }, []);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const addToWishlist = (product: Product) => {
    setWishlist((prev) => {
      if (prev.find((item) => item.id === product.id)) {
        return prev; // Prevent duplicates
      }
      return [...prev, product];
    });
  };

  const removeFromWishlist = (id: string) => {
    setWishlist((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};

type WishlistItem = { id: string; };

export default function Wishlist() {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("wishlistItems") || "[]");
    const normalized = stored.map((id: string) => ({ id }));
    setWishlist(normalized);
  }, []);

  useEffect(() => {
    localStorage.setItem("wishlistItems", JSON.stringify(wishlist.map(w => w.id)));
  }, [wishlist]);

  const removeItem = (id: string) => setWishlist(prev => prev.filter(w => w.id !== id));
  const clearAll = () => setWishlist([]);

  if (wishlist.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="bg-card border-none shadow-sm">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <Heart className="w-12 h-12 text-thrift-green mb-4" />
            <h2 className="text-xl font-medium mb-2">Your wishlist is empty</h2>
            <p className="text-muted-foreground mb-6">Tap the heart on any product to add it here.</p>
            <Link to="/shop">
              <Button className="bg-thrift-green hover:bg-thrift-green/90">Browse Shop</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Minimal rendering; replace with real product fetch if available
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Wishlist</h1>
        <Button variant="ghost" onClick={clearAll} className="text-thrift-warm">Clear All</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {wishlist.map(item => (
          <Card key={item.id} className="border-none shadow-sm bg-card">
            <CardHeader className="py-4">
              <CardTitle className="text-base">Product #{item.id}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <Link to={`/shop/${item.id}`} className="text-thrift-green hover:underline">
                View details
              </Link>
              <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
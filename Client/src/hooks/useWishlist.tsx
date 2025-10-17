// src/hooks/useWishlist.tsx
import React, { createContext, useContext, useEffect, useState } from "react";

export interface Product {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  brand?: string;
  size?: string;
  condition?: "Excellent" | "Good" | "Fair";
  images?: string[];
  seller?: string;
  location?: string;
  description?: string;
}

type WishlistContextType = {
  items: Product[];
  add: (p: Product) => void;
  remove: (id: string) => void;
  toggle: (p: Product) => void;
  clear: () => void;
  isInWishlist: (id: string) => boolean;
};

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const STORAGE_KEY = "wishlist_items";

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const add = (p: Product) => {
    setItems((prev) => (prev.find((x) => x.id === p.id) ? prev : [...prev, p]));
  };

  const remove = (id: string) => setItems((prev) => prev.filter((x) => x.id !== id));

  const toggle = (p: Product) => {
    setItems((prev) =>
      prev.find((x) => x.id === p.id) ? prev.filter((x) => x.id !== p.id) : [...prev, p]
    );
  };

  const clear = () => setItems([]);

  const isInWishlist = (id: string) => items.some((x) => x.id === id);

  return (
    <WishlistContext.Provider value={{ items, add, remove, toggle, clear, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
};

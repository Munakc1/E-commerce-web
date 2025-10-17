import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

interface Listing {
  id: string;
  title: string;
  description: string;
  category: string;
  brand: string;
  condition: string;
  size: string;
  price: number;
  originalPrice: number | null;
  location: string;
  images: string[];
  createdAt: string;
}

const Shop = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("default");
  const [isVisible, setIsVisible] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Fetch listings from localStorage
  useEffect(() => {
    const storedListings = JSON.parse(localStorage.getItem("listings") || "[]");
    setListings(storedListings);
    setFilteredListings(storedListings);
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let updatedListings = [...listings];

    // Filter by category
    if (categoryFilter !== "all") {
      updatedListings = updatedListings.filter((listing) => listing.category === categoryFilter);
    }

    // Filter by price range
    if (priceFilter !== "all") {
      updatedListings = updatedListings.filter((listing) => {
        if (priceFilter === "0-1000") return listing.price <= 1000;
        if (priceFilter === "1000-5000") return listing.price > 1000 && listing.price <= 5000;
        if (priceFilter === "5000+") return listing.price > 5000;
        return true;
      });
    }

    // Sort by price
    if (sortOrder !== "default") {
      updatedListings.sort((a, b) =>
        sortOrder === "low-to-high" ? a.price - b.price : b.price - a.price
      );
    }

    setFilteredListings(updatedListings);
  }, [categoryFilter, priceFilter, sortOrder, listings]);

  // Intersection observer for animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (gridRef.current) {
      observer.observe(gridRef.current);
    }

    return () => {
      if (gridRef.current) {
        observer.unobserve(gridRef.current);
      }
    };
  }, []);

  // Add to cart and redirect to cart page
  const addToCart = (listing: Listing) => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const cartItem = {
      id: listing.id,
      title: listing.title,
      price: listing.price,
      image: listing.images[0] || "",
      quantity: 1,
    };
    localStorage.setItem("cart", JSON.stringify([...cart, cartItem]));
    navigate("/cart");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div
          className={cn(
            "mb-8 opacity-0 animate-in fade-in slide-in-from-bottom-4 duration-500",
            isVisible && "opacity-100"
          )}
        >
          <h1 className="text-3xl font-bold mb-2">Shop Pre-Loved Fashion</h1>
          <p className="text-muted-foreground">
            Discover unique, sustainable fashion items listed by our community
          </p>
        </div>

        {/* Filters and Sorting */}
        <div
          className={cn(
            "flex flex-col sm:flex-row gap-4 mb-8 opacity-0 animate-in fade-in slide-in-from-bottom-4 duration-500",
            isVisible && "opacity-100"
          )}
        >
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Category</label>
            <Select
              value={categoryFilter}
              onValueChange={setCategoryFilter}
              aria-label="Filter by category"
            >
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="women">Women's Clothing</SelectItem>
                <SelectItem value="men">Men's Clothing</SelectItem>
                <SelectItem value="kids">Kids' Clothing</SelectItem>
                <SelectItem value="accessories">Accessories</SelectItem>
                <SelectItem value="shoes">Shoes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Price Range</label>
            <Select
              value={priceFilter}
              onValueChange={setPriceFilter}
              aria-label="Filter by price range"
            >
              <SelectTrigger>
                <SelectValue placeholder="All Prices" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="0-1000">NPR 0 - 1,000</SelectItem>
                <SelectItem value="1000-5000">NPR 1,000 - 5,000</SelectItem>
                <SelectItem value="5000+">NPR 5,000+</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Sort By</label>
            <Select
              value={sortOrder}
              onValueChange={setSortOrder}
              aria-label="Sort by price"
            >
              <SelectTrigger>
                <SelectValue placeholder="Default" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="low-to-high">Price: Low to High</SelectItem>
                <SelectItem value="high-to-low">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Listings Grid */}
        <div ref={gridRef}>
          {filteredListings.length === 0 ? (
            <div
              className={cn(
                "text-center py-12 text-muted-foreground opacity-0 animate-in fade-in duration-500",
                isVisible && "opacity-100"
              )}
            >
              <p>No items available. Be the first to list something!</p>
              <Button
                asChild
                className="mt-4 bg-thrift-green hover:bg-thrift-green/90"
              >
                <a href="/sell">List an Item</a>
              </Button>
            </div>
          ) : (
            <div
              className={cn(
                "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 opacity-0 animate-in fade-in slide-in-from-bottom-4 duration-500",
                isVisible && "opacity-100"
              )}
            >
              {filteredListings.map((listing, index) => (
                <Card
                  key={listing.id}
                  className="border-none shadow-sm hover:shadow-lg transition-shadow"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardContent className="p-4">
                    <img
                      src={listing.images[0] || "https://via.placeholder.com/150"}
                      alt={listing.title}
                      className="h-48 w-full object-cover rounded-lg mb-4"
                    />
                    <h3 className="text-lg font-semibold mb-2 truncate">
                      {listing.title}
                    </h3>
                    <p className="text-thrift-green font-bold mb-2">
                      NPR {listing.price.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground mb-1">
                      Condition: {listing.condition}
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Category: {listing.category}
                    </p>
                    <Button
                      className="w-full bg-thrift-green hover:bg-thrift-green/90"
                      onClick={() => addToCart(listing)}
                      aria-label={`Add ${listing.title} to cart`}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Add to Cart
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Shop;
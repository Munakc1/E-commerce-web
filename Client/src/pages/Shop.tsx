import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Heart } from "lucide-react";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = (searchParams.get('q') || '').trim();
  const initialCat = (searchParams.get('category') || 'all').toLowerCase();
  const [searchQuery, setSearchQuery] = useState(initialQ);
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(() => {
    try {
      const raw = JSON.parse(localStorage.getItem("wishlist") || "[]");
      return new Set(Array.isArray(raw) ? raw.map(String) : []);
    } catch {
      return new Set<string>();
    }
  });

  // Fetch listings from backend products; fallback to localStorage
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${apiBase}/api/products`);
        if (!res.ok) throw new Error("backend not available");
        const data = await res.json();
        const items: Listing[] = (Array.isArray(data) ? data : []).map((p: any) => ({
          id: String(p.id),
          title: p.title,
          description: p.description || "",
          category: (p.category || p.Category || '').toLowerCase() || "",
          brand: p.brand || "",
          condition: p.productCondition || p.condition || "Good",
          size: p.size || "",
          price: Number(p.price ?? 0),
          originalPrice: p.originalPrice != null ? Number(p.originalPrice) : null,
          location: p.location || "",
          images: Array.isArray(p.images)
            ? p.images
            : (typeof p.images === 'string' && p.images.startsWith('[')
                ? JSON.parse(p.images)
                : (p.image ? [p.image] : [])),
          createdAt: p.created_at || p.createdAt || new Date().toISOString(),
        }));
        setListings(items);
        setFilteredListings(items);
      } catch (e) {
        // fallback to localStorage if server not reachable
        const storedListings = JSON.parse(localStorage.getItem("listings") || "[]");
        setListings(storedListings);
        setFilteredListings(storedListings);
      }
    };
    fetchProducts();
  }, [apiBase]);

  // Keep category and search in sync with URL (on navigation/back/links)
  useEffect(() => {
    const qParam = (searchParams.get('q') || '').trim();
    const catParam = (searchParams.get('category') || 'all').toLowerCase();
    if (qParam !== searchQuery) setSearchQuery(qParam);
    if (catParam !== categoryFilter) setCategoryFilter(catParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Apply filters and sorting
  useEffect(() => {
    let updatedListings = [...listings];

    // Apply search query (title, description, brand, category, location)
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      updatedListings = updatedListings.filter((l) => {
        const hay = `${l.title} ${l.description} ${l.brand} ${l.category} ${l.location}`.toLowerCase();
        return hay.includes(q);
      });
    }

    // Filter by category
    if (categoryFilter !== "all") {
      updatedListings = updatedListings.filter((listing) => String(listing.category).toLowerCase() === categoryFilter);
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
  }, [categoryFilter, priceFilter, sortOrder, listings, searchQuery]);

  // Reflect category/search in URL for shareability (only when changed)
  useEffect(() => {
    const curQ = (searchParams.get('q') || '').trim();
    const curC = (searchParams.get('category') || 'all').toLowerCase();
    const next = new URLSearchParams(searchParams);
    let changed = false;

    if (categoryFilter && categoryFilter !== 'all') {
      if (curC !== categoryFilter) {
        next.set('category', categoryFilter);
        changed = true;
      }
    } else if (searchParams.has('category')) {
      next.delete('category');
      changed = true;
    }

    const trimmed = searchQuery.trim();
    if (trimmed) {
      if (curQ !== trimmed) {
        next.set('q', trimmed);
        changed = true;
      }
    } else if (searchParams.has('q')) {
      next.delete('q');
      changed = true;
    }

    if (changed) setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter, searchQuery, searchParams]);

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
    const cart: Array<{ id: string; title: string; price: number; image: string; quantity: number }> =
      JSON.parse(localStorage.getItem("cart") || "[]");

    const idx = cart.findIndex((c) => c.id === listing.id);
    if (idx >= 0) {
      cart[idx] = { ...cart[idx], quantity: cart[idx].quantity + 1 };
    } else {
      cart.push({
        id: listing.id,
        title: listing.title,
        price: listing.price,
        image: listing.images[0] || "",
        quantity: 1,
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    try {
      window.dispatchEvent(new CustomEvent("cartUpdated", { detail: { count: cart.length } }));
    } catch {}
  };

  const toggleWishlist = (id: string) => {
    setWishlistIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem("wishlist", JSON.stringify(Array.from(next)));
        window.dispatchEvent(new CustomEvent("wishlistUpdated", { detail: { count: next.size } }));
      } catch {}
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background">
    
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
            <label className="text-sm font-medium mb-2 block">Search</label>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items, brands, locations..."
              aria-label="Search listings"
            />
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Category</label>
            <Select
              value={categoryFilter}
              onValueChange={(v) => setCategoryFilter(v)}
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
              <p>No items found. Try adjusting your filters or search.</p>
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
                  className="group cursor-pointer border rounded-lg shadow-sm hover:shadow-lg transition duration-200 hover:-translate-y-1 focus-visible:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-thrift-green"
                  style={{ animationDelay: `${index * 100}ms` }}
                  tabIndex={0}
                  role="link"
                  onClick={() => navigate(`/product/${listing.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/product/${listing.id}`);
                    }
                  }}
                >
                  <CardContent className="p-4">
                    <div className="relative">
                      <img
                        src={listing.images[0] || "https://via.placeholder.com/150"}
                        alt={listing.title}
                        className="h-48 w-full object-cover rounded-lg mb-4"
                      />
                      <button
                        className={`absolute top-2 right-2 w-9 h-9 rounded-md grid place-items-center bg-white/90 hover:bg-white transition ${wishlistIds.has(String(listing.id)) ? 'text-red-500' : ''}`}
                        onClick={(e) => { e.stopPropagation(); toggleWishlist(String(listing.id)); }}
                        aria-label={wishlistIds.has(String(listing.id)) ? 'Remove from wishlist' : 'Add to wishlist'}
                      >
                        <Heart className={`w-4 h-4 ${wishlistIds.has(String(listing.id)) ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                    <h3 className="text-lg font-semibold mb-2 truncate group-hover:text-thrift-green">
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
                      onClick={(e) => { e.stopPropagation(); addToCart(listing); }}
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
      
    </div>
  );
};

export default Shop;
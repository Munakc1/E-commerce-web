import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Product {
  id: string;
  title: string;
  price: number;
  originalPrice: number;
  images: string[];
  brand: string;
  size: string;
  condition: "Excellent" | "Good";
  seller: string;
  location: string;
}

interface CartItem {
  id: string;
  quantity: number;
}

const mockProducts: Product[] = [
  {
    id: "1",
    title: "Vintage Denim Jacket with Embroidered Details",
    price: 2500,
    originalPrice: 4000,
    brand: "Vintage Collection",
    size: "M",
    condition: "Excellent",
    images: [
      "https://i.pinimg.com/1200x/c5/e4/0f/c5e40f10ee42695a6754e251119",
      "https://i.pinimg.com/1200x/c5/e4/0f/c5e40",
    ],
    seller: "Sarah K.",
    location: "Kathmandu",
  },
  {
    id: "2",
    title: "Handwoven Cotton Kurta Set",
    price: 1800,
    originalPrice: 3200,
    brand: "Local Artisan",
    size: "L",
    condition: "Good",
    images: [
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    ],
    seller: "Rani T.",
    location: "Pokhara",
  },
  {
    id: "3",
    title: "Designer Wool Coat - Winter Collection",
    price: 4500,
    originalPrice: 8000,
    brand: "Winter Essentials",
    size: "S",
    condition: "Excellent",
    images: [
      "https://i.pinimg.com/736x/89/59/2d/89592db9afe519ba2a7325f248d34445.jpg",
    ],
    seller: "Maya S.",
    location: "Lalitpur",
  },
  {
    id: "4",
    title: "Casual Summer Dress with Floral Print",
    price: 1200,
    originalPrice: 2000,
    brand: "Summer Vibes",
    size: "M",
    condition: "Good",
    images: [
      "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    ],
    seller: "Priya L.",
    location: "Bhaktapur",
  },
  {
    id: "5",
    title: "Handmade Woolen Shawl",
    price: 1500,
    originalPrice: 2500,
    brand: "Himalayan Weaves",
    size: "Free",
    condition: "Excellent",
    images: [
      "https://images.unsplash.com/photo-1586351012965-861624544334?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    ],
    seller: "Kiran D.",
    location: "Patan",
  },
  {
    id: "6",
    title: "Trendy Crop Top",
    price: 800,
    originalPrice: 1500,
    brand: "Street Wear",
    size: "S",
    condition: "Good",
    images: [
      "https://i.pinimg.com/736x/57/01",
    ],
    seller: "Anita G.",
    location: "Kathmandu",
  },
];

export const Cart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem("cartItems") || "[]");
    const initializedCart = storedCart.map((id: string) => ({
      id,
      quantity: 1,
    }));
    setCartItems(initializedCart);
  }, []);

  useEffect(() => {
    const itemIds = cartItems.map((item) => item.id);
    localStorage.setItem("cartItems", JSON.stringify(itemIds));
  }, [cartItems]);

  const getProductById = (id: string) => mockProducts.find((product) => product.id === id);

  const updateQuantity = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? { ...item, quantity: Math.max(1, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.setItem("cartItems", JSON.stringify([]));
  };

  const subtotal = cartItems.reduce((sum, item) => {
    const product = getProductById(item.id);
    return product ? sum + product.price * item.quantity : sum;
  }, 0);

  const taxes = subtotal * 0.13;
  const shipping = 200;
  const total = subtotal + taxes + shipping;

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="bg-card border-none shadow-sm">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <ShoppingBag className="w-12 h-12 text-thrift-green mb-4" />
            <h2 className="text-xl font-medium text-foreground mb-2">
              Your cart is empty 🛒
            </h2>
            <p className="text-muted-foreground mb-6">
              Looks like you haven't added any items yet.
            </p>
            <Link to="/shop">
              <Button
                className="bg-thrift-green hover:bg-thrift-green/90 text-white"
                size="lg"
              >
                Shop Now
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-6">Your Cart</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {cartItems.map((item) => {
            const product = getProductById(item.id);
            if (!product) return null;
            return (
              <Card
                key={item.id}
                className="mb-4 border-none shadow-sm bg-card hover:shadow-lg transition-all duration-300"
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    className="w-24 h-32 object-cover rounded-md"
                    onError={(e) => {
                      e.currentTarget.src = "https://images.unsplash.com/photo-1509281373149-e957c6296406";
                    }}
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">{product.title}</h3>
                    <p className="text-sm text-thrift-earth">{product.brand}</p>
                    <p className="text-sm text-muted-foreground">Size {product.size}</p>
                    <p className="text-lg font-bold text-thrift-green">
                      NPR {(product.price * item.quantity).toLocaleString()}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-8 h-8"
                      >
                        –
                      </Button>
                      <span className="text-sm">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-8 h-8"
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(item.id)}
                    className="text-thrift-warm hover:text-thrift-warm/80"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="bg-thrift-cream border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground">
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium text-foreground">
                  NPR {subtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxes (13%)</span>
                <span className="font-medium text-foreground">
                  NPR {taxes.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-medium text-foreground">
                  NPR {shipping.toLocaleString()}
                </span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between">
                  <span className="font-bold text-foreground">Total</span>
                  <span className="font-bold text-thrift-green">
                    NPR {total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              <Link to="/checkout">
                <Button
                  className="w-full bg-thrift-green hover:bg-thrift-green/90 text-white"
                  size="lg"
                >
                  Proceed to Checkout
                </Button>
              </Link>
              <Link to="/shop">
                <Button
                  variant="outline"
                  className="w-full border-thrift-green text-thrift-green hover:bg-thrift-green/10"
                  size="lg"
                >
                  Continue Shopping
                </Button>
              </Link>
              <Button
                variant="ghost"
                className="w-full text-thrift-warm hover:text-thrift-warm/80"
                size="lg"
                onClick={clearCart}
              >
                Clear Cart
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
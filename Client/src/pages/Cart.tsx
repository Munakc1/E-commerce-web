import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@mui/material";
import { ShoppingBag, Trash2 } from "lucide-react";
import { CardTitle } from "@/components/ui/card";

export default function Cart() {
  const [cart, setCart] = useState<any[]>([]);
  const navigate = useNavigate();
  useEffect(() => {
    const c = JSON.parse(localStorage.getItem("cart") || "[]");
    setCart(Array.isArray(c) ? c : []);
  }, []);

  const clearCart = () => {
    localStorage.setItem("cart", JSON.stringify([]));
    setCart([]);
    try { window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { count: 0 } })); } catch {}
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const TAX_RATE = Number(import.meta.env.VITE_TAX_RATE ?? 0);
  const taxes = subtotal * TAX_RATE;
  const shipping = cart.length > 0 ? 200 : 0;
  const total = subtotal + taxes + shipping;

  if (cart.length === 0) {
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
              <Button className="bg-thrift-green hover:bg-thrift-green/90 text-white" size="lg">
                Shop Now
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  function updateQuantity(id: any, delta: number): void {
    setCart((prev) => {
      const idStr = String(id);
      const next = prev.map((it) => ({ ...it }));
      const idx = next.findIndex((it) => String(it.id) === idStr);
      if (idx === -1) return prev;
      const newQty = Number(next[idx].quantity || 0) + Number(delta || 0);
      if (newQty <= 0) {
        const filtered = next.filter((it) => String(it.id) !== idStr);
        localStorage.setItem("cart", JSON.stringify(filtered));
        try {
          const totalQty = filtered.reduce((sum, it) => sum + (Number(it.quantity ?? 1) || 1), 0);
          window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { count: totalQty } }));
        } catch {}
        return filtered;
      }
      next[idx].quantity = newQty;
      localStorage.setItem("cart", JSON.stringify(next));
      try {
        const totalQty = next.reduce((sum, it) => sum + (Number(it.quantity ?? 1) || 1), 0);
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { count: totalQty } }));
      } catch {}
      return next;
    });
  }

  function removeItem(id: any): void {
    setCart((prev) => {
      const idStr = String(id);
      const filtered = prev.filter((it) => String(it.id) !== idStr);
      localStorage.setItem("cart", JSON.stringify(filtered));
      try {
        const totalQty = filtered.reduce((sum, it) => sum + (Number(it.quantity ?? 1) || 1), 0);
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { count: totalQty } }));
      } catch {}
      return filtered;
    });
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Your Cart</h1>
        <Button
          variant="destructive"
          size="sm"
          onClick={clearCart}
          className="hidden sm:inline-flex"
          aria-label="Clear cart"
          title="Clear cart"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Clear Cart
        </Button>
      </div>
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          {cart.map((item) => (
            <Card key={item.id} className="mb-4 border-none shadow-sm bg-card hover:shadow-lg transition-all duration-300">
              <CardContent className="p-4 flex items-center gap-4">
                <img
                  src={item.image || "https://images.unsplash.com/photo-1509281373149-e957c6296406"}
                  alt={item.title}
                  className="w-24 h-32 object-cover rounded-md"
                />
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">{item.title}</h3>
                  <p className="text-lg font-bold text-thrift-green">
                    NPR {(item.price * item.quantity).toLocaleString()}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Button variant="outline" size="sm" onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8">–</Button>
                    <span className="text-sm">{item.quantity}</span>
                    <Button variant="outline" size="sm" onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8">+</Button>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)} className="text-destructive hover:text-destructive/90 hover:bg-destructive/10">
                  <Trash2 className="w-5 h-5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

  <Card className="bg-thrift-cream border-none shadow-sm h-fit lg:sticky lg:top-6">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground">Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium text-foreground">NPR {subtotal.toLocaleString()}</span>
              </div>
              {taxes > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxes ({Math.round(TAX_RATE * 100)}%)</span>
                  <span className="font-medium text-foreground">NPR {taxes.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-medium text-foreground">NPR {shipping.toLocaleString()}</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between">
                  <span className="font-bold text-foreground">Total</span>
                  <span className="font-bold text-thrift-green">NPR {total.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link to="/checkout">
                  <Button className="w-full bg-thrift-green hover:bg-thrift-green/90 text-white" size="lg">
                    Proceed to Checkout
                  </Button>
                </Link>
                <Link to="/shop">
                  <Button variant="outline" className="w-full border-thrift-green text-thrift-green hover:bg-thrift-green/10" size="lg">
                    Continue Shopping
                  </Button>
                </Link>
              </div>
              <Button variant="destructive" className="w-full sm:hidden" size="lg" onClick={clearCart}>
                Clear Cart
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

type Product = {
  id: string | number;
  title: string;
  price: number;
  originalPrice?: number | null;
  condition?: string;
  size?: string;
  brand?: string;
  description?: string;
  seller?: string;
  phone?: string | null;
  images?: string[];
  image?: string;
  location?: string;
  status?: string;
};

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const { user, token } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  // Add to cart helper
  const addToCart = () => {
    if (!product) return;
    const st = String(product.status || '').toLowerCase();
    if (st && st !== 'unsold') {
      toast.error('Item cannot be added to cart', { description: `This listing is ${st.replace('_',' ')}` });
      return;
    }
    const cart: Array<{ id: string; title: string; price: number; image: string; quantity?: number }> =
      JSON.parse(localStorage.getItem("cart") || "[]");

    const idStr = String(product.id);
    const image = Array.isArray(product.images) && product.images.length > 0
      ? product.images[0]
      : (product.image || "");
    const title = product.title || "Item";
    const price = Number(product.price || 0);

    const idx = cart.findIndex((c) => String(c.id) === idStr);
    if (idx >= 0) {
      try { window.dispatchEvent(new CustomEvent("cartUpdated", { detail: { count: cart.length } })); } catch {}
      toast.info("Item already in cart", { description: title });
      return;
    }
    cart.push({ id: idStr, title, price, image, quantity: 1 });
    localStorage.setItem("cart", JSON.stringify(cart));
    try { window.dispatchEvent(new CustomEvent("cartUpdated", { detail: { count: cart.length } })); } catch {}
    toast.success("Added to cart", { description: title });
  };

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${apiBase}/api/products/${id}`);
        if (!res.ok) throw new Error(`Failed to load product ${id}`);
        const data = await res.json();
        setProduct(data);
        setSelectedIdx(0);
      } catch (e: any) {
        setError(e?.message || "Failed to load product");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, apiBase]);

  // Prefill contact info
  useEffect(() => {
    setContactName(user?.name || "");
  }, [user]);

  const mainImage = useMemo(() => {
    if (!product) return "/placeholder-product.jpg";
    if (Array.isArray(product.images) && product.images.length > 0) {
      const idx = Math.min(Math.max(selectedIdx, 0), product.images.length - 1);
      return product.images[idx];
    }
    if (product.image) return product.image;
    return "/placeholder-product.jpg";
  }, [product, selectedIdx]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Button variant="ghost" onClick={() => navigate('/shop')} className="mb-6">← Back to Shop</Button>
        <p>Loading...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">← Back</Button>
        <p className="text-destructive">{error || "Product not found"}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <Button variant="ghost" onClick={() => navigate('/shop')} className="mb-6">
        ← Back to Shop
      </Button>

      <div className="grid md:grid-cols-2 gap-12">
        {/* Product Image */}
        <div>
          <img
            src={mainImage}
            alt={product.title}
            className="w-full rounded-lg border"
          />
          {Array.isArray(product.images) && product.images.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-2">
              {product.images.slice(0, 8).map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`thumb-${idx}`}
                  onClick={() => setSelectedIdx(idx)}
                  className={
                    "h-20 w-full object-cover rounded border cursor-pointer " +
                    (idx === selectedIdx ? "ring-2 ring-thrift-green" : "hover:opacity-90")
                  }
                />
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">{product.title}</h1>
            {product.brand && <p className="text-gray-600">{product.brand}</p>}
          </div>

          <div className="flex items-center gap-4">
            <span className="text-3xl font-bold text-thrift-green">
              NPR {Number(product.price || 0).toLocaleString()}
            </span>
            {!!product.originalPrice && (
              <span className="text-xl text-gray-400 line-through">
                NPR {Number(product.originalPrice).toLocaleString()}
              </span>
            )}
          </div>

          <div className="space-y-2">
            {product.condition && (
              <p><span className="font-semibold">Condition:</span> {product.condition}</p>
            )}
            {product.size && (
              <p><span className="font-semibold">Size:</span> {product.size}</p>
            )}
            {product.location && (
              <p><span className="font-semibold">Location:</span> {product.location}</p>
            )}
            {product.seller && (
              <p className="select-none">
                <span className="font-semibold">Seller:</span> {product.seller}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              For privacy, phone numbers and emails aren’t shown. Use the message button to contact the seller.
            </p>
          </div>

          {product.description && (
            <p className="text-gray-700">{product.description}</p>
          )}

          <div className="flex gap-4">
            {
              (() => {
                const st = String(product.status || '').toLowerCase();
                const disabled = !!st && st !== 'unsold';
                const label = disabled ? (st === 'sold' ? 'Sold' : 'Not available') : 'Add to Cart';
                return (
                  <Button className={`flex-1 py-2 px-4 text-sm rounded-full shadow-sm transition transform hover:-translate-y-[1px] ${disabled ? 'cursor-not-allowed bg-gray-200 text-gray-700' : 'bg-thrift-green hover:bg-thrift-green/90 text-white'}`} onClick={addToCart} disabled={disabled}>
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    {label}
                  </Button>
                );
              })()
            }
            <Button variant="outline" onClick={() => setContactOpen(true)}>
              Message Seller
            </Button>
          </div>
        </div>
      </div>

      {banner && (
        <div className="mt-6 text-sm text-thrift-green bg-thrift-green/10 border border-thrift-green/20 rounded p-3">
          {banner}
        </div>
      )}

      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact Seller</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Your name" value={contactName} onChange={(e) => setContactName(e.target.value)} />
            <Textarea rows={4} placeholder="Write your message..." value={contactMessage} onChange={(e) => setContactMessage(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContactOpen(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                if (!contactMessage.trim()) return;
                setSending(true);
                try {
                  const resp = await fetch(`${apiBase}/api/products/${id}/message`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify({ name: contactName || undefined, message: contactMessage.trim() }),
                  });
                  if (!resp.ok) {
                    const t = await resp.text();
                    throw new Error(t || 'Failed to send');
                  }
                  setContactOpen(false);
                  setBanner("Message sent to the seller. You'll get a reply soon.");
                  setTimeout(() => setBanner(null), 3000);
                  setContactMessage("");
                } catch (e: any) {
                  setBanner(e?.message || 'Failed to send message');
                  setTimeout(() => setBanner(null), 3000);
                } finally {
                  setSending(false);
                }
              }}
              disabled={sending || !contactMessage.trim()}
            >
              {sending ? "Sending..." : "Send Message"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
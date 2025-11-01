import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        // Fetch my orders and find the requested one (buyer-only detail)
        const res = await fetch(`${apiBase}/api/orders/mine`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (!res.ok) throw new Error('Failed to fetch orders');
        const data = await res.json();
        const arr = Array.isArray(data) ? data : [];
        const found = arr.find((o: any) => String(o.id) === String(id) || String(o.order_id) === String(id));
        if (!found) {
          setError('Order not found or you do not have access');
          setOrder(null);
        } else {
          // ensure shipping_address is parsed
          try {
            if (found && typeof found.shipping_address === 'string') {
              found.shipping_address = JSON.parse(found.shipping_address || '{}');
            }
          } catch (e) { found.shipping_address = found.shipping_address || {}; }
          setOrder(found);
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load order');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, apiBase, token]);

  const handleCancel = async () => {
    if (!order) return;
    const ok = window.confirm('Cancel this order? This will attempt to release the items back to unsold state.');
    if (!ok) return;
    try {
      const res = await fetch(`${apiBase}/api/orders/${order.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Failed to cancel order');
      }
      const updated = await res.json();
      try { if (typeof updated.shipping_address === 'string') updated.shipping_address = JSON.parse(updated.shipping_address || '{}'); } catch(e){ updated.shipping_address = updated.shipping_address || {}; }
      setOrder(updated);
  // Notify other UI (Profile list) to refresh
  try { window.dispatchEvent(new CustomEvent('orderUpdated', { detail: { id: updated.id, status: updated.status || 'cancelled' } })); } catch (e) {}
      toast({ title: 'Order cancelled', description: `Order #${order.id} marked cancelled.` });
    } catch (e: any) {
      toast({ title: 'Unable to cancel', description: e?.message || 'Cancel failed' });
    }
  };

  if (loading) return (<div className="container mx-auto px-4 py-16">Loading...</div>);
  if (error) return (
    <div className="container mx-auto px-4 py-16">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">← Back</Button>
      <Card className="border-none shadow-sm"><CardContent className="p-6 text-destructive">{error}</CardContent></Card>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-10 flex justify-center">
  <Button variant="ghost" onClick={() => navigate('/profile?tab=orders')} className="mb-6">← Back to Orders</Button>
      <Card className="border-none shadow-sm bg-card w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-center">Order Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="text-sm text-muted-foreground">Order ID: <span className="font-semibold">{order.id || order.order_id}</span></div>
            <div className="text-sm">Placed on: <span className="font-medium">{new Date(order.created_at || order.createdAt).toLocaleString()}</span></div>
            {order.shipping_address && (
              <div className="text-sm">Shipping Address: <span className="font-medium">{order.shipping_address.address || order.shipping_address.address_line || order.shipping_address.city || '-'}</span></div>
            )}
            <div className="mt-2">Status: <span className={`font-semibold ${String(order.status || order.order_status || '').toLowerCase() === 'cancelled' ? 'text-red-600' : String(order.status || order.order_status || '').toLowerCase() === 'sold' ? 'text-gray-600' : 'text-thrift-green'}`}>{order.status || order.order_status || 'pending'}</span></div>
          </div>
          <div className="mb-4 border rounded overflow-hidden">
            <div className="grid grid-cols-3 bg-[hsl(var(--thrift-green))] text-white text-sm">
              <div className="p-2 font-medium">Payment Method</div>
              <div className="p-2 font-medium">Payment Status</div>
              <div className="p-2 font-medium">Total Amount</div>
            </div>
            <div className="grid grid-cols-3 text-sm">
              <div className="p-2">{order.payment_method || order.paymentMethod || '-'}</div>
              <div className="p-2">{order.payment_status || order.paymentStatus || 'pending'}</div>
              <div className="p-2">NPR {Number(order.total || 0).toLocaleString()}</div>
            </div>
          </div>

          <div className="mb-4">
            <div className="font-medium">Customer Details:</div>
            <div className="text-sm">{order.user_name || order.buyer_name || order.shipping_address?.name || order.email || '-'}</div>
          </div>

          <div>
            <div className="font-medium mb-2">Product Details:</div>
            <div className="text-sm text-muted-foreground">{(order.items || []).length} item(s)</div>
            {(order.items || []).map((it: any, i: number) => (
              <div key={i} className="mt-2 border rounded p-3">
                <div className="font-medium">Name: {it.title}</div>
                <div className="text-sm">Description: {it.description || it.title || ''}</div>
                <div className="text-sm">Unit: {it.unit || 'unit'}</div>
                <div className="text-sm">Quantity: {it.quantity || 1}</div>
                <div className="text-sm font-semibold">Price: NPR {Number(it.price || 0).toLocaleString()}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-end">
            {/* Only show cancel when not already cancelled or completed */}
            {String((order.status || order.order_status || '')).toLowerCase() !== 'cancelled' && String((order.status || order.order_status || '')).toLowerCase() !== 'sold' && (
              <Button variant="destructive" onClick={handleCancel}>Cancel Order</Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Mail, User as UserIcon, Phone, Key, Save, Edit3, Trash2, RefreshCw, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Profile() {
  const { user, token, login } = useAuth();
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') || 'account') as 'account' | 'security' | 'orders';
  const [activeTab, setActiveTab] = useState<'account' | 'security' | 'orders'>(initialTab);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const initial = useMemo(
    () => ({
      name: user?.name ?? "",
      email: user?.email ?? "",
      phone: (user as any)?.phone ?? "",
    }),
    [user]
  );

  const [form, setForm] = useState(initial);

  useEffect(() => setForm(initial), [initial]);

  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000";

  async function onSaveProfile() {
    if (!user?.id) return;
    setSaving(true);
    try {
      setMessage(null);
      const res = await fetch(`${apiBase}/api/users/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ id: user.id, name: form.name, phone: form.phone }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error("Server error:", res.status, data);
        setMessage((data && (data.message || data.error)) || "Failed to update profile.");
        return;
      }
      const updated = data.user || { ...user, name: form.name, phone: form.phone };
      if (token) {
        login(token, updated as any);
      } else {
        localStorage.setItem("user", JSON.stringify(updated));
      }
      setEditing(false);
      setMessage("Profile updated.");
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  }

  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });

  const onChangePassword = async () => {
    setMessage(null);
    if (!pwd.next || pwd.next.length < 6) {
      setMessage("New password must be at least 6 characters.");
      return;
    }
    if (pwd.next !== pwd.confirm) {
      setMessage("Passwords do not match.");
      return;
    }
    setPwdSaving(true);
    try {
      // Call backend if available
      await fetch(`${import.meta.env.VITE_API_URL || ""}/api/users/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ currentPassword: pwd.current, newPassword: pwd.next }),
      }).catch(() => {});
      setPwd({ current: "", next: "", confirm: "" });
      setMessage("Password updated.");
    } finally {
      setPwdSaving(false);
    }
  };

  const onDeleteAccount = async () => {
    // Optional: implement delete flow
    setMessage("Account deletion is not enabled in this demo.");
  };

  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [loadingMy, setLoadingMy] = useState(false);
  const [expandedMy, setExpandedMy] = useState<Set<number | string>>(new Set());
  const [hasLoadedMy, setHasLoadedMy] = useState(false);

  const toggleExpandedMy = (id: number | string) => {
    setExpandedMy(prev => {
      const next = new Set(prev);
      const key = String(id);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const headers = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : undefined as any), [token]);
  const apiBaseMemo = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const parseMaybeJson = (val: any) => {
    try {
      if (!val) return null;
      return typeof val === 'string' ? JSON.parse(val) : val;
    } catch {
      return null;
    }
  };

  const loadMy = useCallback(async () => {
    if (!token) return;
    setLoadingMy(true);
    const ac = new AbortController();
    try {
      const res = await fetch(`${apiBaseMemo}/api/orders/mine`, { headers, signal: ac.signal });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      const normalized = (Array.isArray(data) ? data : []).map((o: any) => ({
        ...o,
        items: parseMaybeJson(o.items) || [],
        shipping_address: parseMaybeJson(o.shipping_address) || o.shipping_address || o.shippingAddress || null,
      }));
      setMyOrders(normalized);
    } catch (e: any) {
      if (e?.name !== 'AbortError') setMyOrders([]);
    } finally { setLoadingMy(false); setHasLoadedMy(true); }
    return () => ac.abort();
  }, [apiBaseMemo, token, headers]);


  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => { if (!cancelled) await loadMy(); })();
    return () => { cancelled = true; };
  }, [token, loadMy]);

  // React to order placements happening elsewhere in the app
  useEffect(() => {
    const onOrderPlaced = () => { loadMy(); };
    const onOrderUpdated = (e: any) => { loadMy(); };
    window.addEventListener('orderPlaced', onOrderPlaced as EventListener);
    window.addEventListener('orderUpdated', onOrderUpdated as EventListener);
    return () => {
      window.removeEventListener('orderPlaced', onOrderPlaced as EventListener);
      window.removeEventListener('orderUpdated', onOrderUpdated as EventListener);
    };
  }, [loadMy]);

  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="text-muted-foreground mt-2">No user session found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl text-[hsl(var(--thrift-green))]  font-bold mb-6">My Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
        {/* Left navigation */}
        <aside className="border rounded bg-card h-fit">
          <nav className="flex md:flex-col">
            <button
              className={`text-left px-4 py-3 w-full border-b md:border-b-0 md:border-r-0 hover:bg-[hsl(var(--thrift-green))]/10 ${activeTab==='account' ? 'bg-[hsl(var(--thrift-green))]/10 text-[hsl(var(--thrift-green))] font-medium' : ''}`}
              onClick={() => setActiveTab('account')}
            >
              Profile Information
            </button>
            <button
              className={`text-left px-4 py-3 w-full border-b md:border-b-0 hover:bg-[hsl(var(--thrift-green))]/10 ${activeTab==='security' ? 'bg-[hsl(var(--thrift-green))]/10 text-[hsl(var(--thrift-green))] font-medium' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              Password & Security
            </button>
            <button
              className={`text-left px-4 py-3 w-full hover:bg-[hsl(var(--thrift-green))]/10 ${activeTab==='orders' ? 'bg-[hsl(var(--thrift-green))]/10 text-[hsl(var(--thrift-green))] font-medium' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              My Orders
            </button>
          </nav>
        </aside>

  {/* Right content (narrower width, centered) */}
  <div className="space-y-6 max-w-2xl w-full mx-auto">
          {message && (
            <div className="text-sm text-thrift-green bg-thrift-green/10 border border-thrift-green/20 rounded p-3">
              {message}
            </div>
          )}

          {activeTab === 'account' && (
          <Card className="border-none shadow-sm bg-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Account Information</CardTitle>
              <div className="flex gap-2">
                {!editing ? (
                  <Button variant="outline" onClick={() => setEditing(true)}>
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <Button onClick={onSaveProfile} disabled={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? "Saving..." : "Save"}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                  <UserIcon className="w-4 h-4" /> Name
                </label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  disabled={!editing}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                  <Mail className="w-4 h-4" /> Email
                </label>
                <Input
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  disabled // usually immutable
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                  <Phone className="w-4 h-4" /> Phone
                </label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  disabled={!editing}
                  placeholder="+977 98XXXXXXXX"
                />
              </div>
            </div>
            </CardContent>
          </Card>
          )}

          {activeTab === 'security' && (
          <Card className="border-none shadow-sm bg-card">
            <CardHeader>
              <CardTitle className="text-lg">Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
            <label className="text-sm text-muted-foreground flex items-center gap-2">
              <Key className="w-4 h-4" /> Change Password
            </label>
            <Input
              type="password"
              placeholder="Current password"
              value={pwd.current}
              onChange={(e) => setPwd((p) => ({ ...p, current: e.target.value }))}
            />
            <Input
              type="password"
              placeholder="New password"
              value={pwd.next}
              onChange={(e) => setPwd((p) => ({ ...p, next: e.target.value }))}
            />
            <Input
              type="password"
              placeholder="Confirm new password"
              value={pwd.confirm}
              onChange={(e) => setPwd((p) => ({ ...p, confirm: e.target.value }))}
            />
            <Button onClick={onChangePassword} disabled={pwdSaving}>
              {pwdSaving ? "Updating..." : "Update Password"}
            </Button>
            <Separator className="my-2" />
            <Button variant="destructive" onClick={onDeleteAccount}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
            </CardContent>
          </Card>
          )}

      {activeTab === 'orders' && (
      <Card className="border-none shadow-sm bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              My Orders
              {myOrders.length > 0 && (<Badge variant="outline">{myOrders.length}</Badge>)}
              {loadingMy && hasLoadedMy && (<RefreshCw className="w-4 h-4 animate-spin text-thrift-green" />)}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => { loadMy(); }} title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!hasLoadedMy && loadingMy ? (
            <p>Loading orders...</p>
          ) : myOrders.length === 0 ? (
            <div className="text-muted-foreground">No orders yet. <a href="/shop" className="text-thrift-green hover:underline">Shop now</a></div>
          ) : (
            <div className="space-y-4">
              {myOrders.map((o) => (
                <div key={String(o.id || o.ID || o.order_id)} className="border rounded">
                  <button
                    className="w-full text-left p-3 flex items-center justify-between hover:bg-[hsl(var(--thrift-green))]/10 transition"
                    onClick={() => navigate(`/order/${o.id || o.ID || o.order_id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium">Order #{o.id || o.ID || o.order_id}</span>
                      <span className="text-xs text-muted-foreground">{new Date(o.created_at || o.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className={(o.payment_status || o.paymentStatus) === 'paid' ? 'bg-[hsl(var(--thrift-green))] text-white' : ''}>
                        {o.payment_status || o.paymentStatus || 'pending'}
                      </Badge>
                      <span className="font-semibold text-thrift-green">NPR {Number(o.total).toLocaleString()}</span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${expandedMy.has(String(o.id || o.ID || o.order_id)) ? 'rotate-180' : ''}`}
                        onClick={(e) => { e.stopPropagation(); toggleExpandedMy(o.id || o.ID || o.order_id); }}
                      />
                    </div>
                  </button>
                  {expandedMy.has(String(o.id || o.ID || o.order_id)) && (
                    <div className="px-3 pb-3 text-sm space-y-2">
                      {o.shipping_address && (
                        <div className="text-muted-foreground">
                          Ship to: {o.shipping_address.name || '-'} — {o.shipping_address.address || '-'}, {o.shipping_address.city || '-'} • {o.shipping_address.phone || '-'}
                        </div>
                      )}
                      <div className="space-y-1">
                        {(o.items && Array.isArray(o.items) ? o.items : []).map((it: any, i: number) => (
                          <div key={i} className="flex justify-between">
                            <div>{it.title}</div>
                            <div>NPR {Number(it.price).toLocaleString()}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
          )}
            </div>
          </div>
        </div>
      );
    }
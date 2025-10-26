import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Mail, User as UserIcon, Phone, Key, Save, Edit3, Trash2 } from "lucide-react";

export default function Profile() {
  const { user, token, login } = useAuth();
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, name: form.name, phone: form.phone }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error("Server error:", res.status, data);
        setMessage((data && (data.message || data.error)) || "Failed to update profile.");
        return;
      }
      const updated = data.user || { ...user, name: form.name, phone: form.phone };
      token ? login(token, updated as any) : localStorage.setItem("user", JSON.stringify(updated));
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

  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoadingOrders(true);
      try {
        const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000";
      
        const res = await fetch(`${apiBase}/api/orders`);
        if (!res.ok) throw new Error("Failed to load orders");
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch orders", err);
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchOrders();
  }, []);

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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">My Profile</h1>
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
      </div>

      {message && (
        <div className="mb-6 text-sm text-thrift-green bg-thrift-green/10 border border-thrift-green/20 rounded p-3">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Account Info */}
        <Card className="lg:col-span-2 border-none shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="text-lg">Account Information</CardTitle>
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

        {/* Security */}
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
      </div>

      {/* Orders */}
      <Card className="mt-6 border-none shadow-sm bg-card">
        <CardHeader>
          <CardTitle className="text-lg">My Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingOrders ? (
            <p>Loading orders...</p>
          ) : orders.length === 0 ? (
            <p className="text-muted-foreground">No orders yet.</p>
          ) : (
            <div className="space-y-4">
              {orders.map((o) => (
                <div key={o.id || o.ID || o.order_id} className="border rounded p-3">
                  <div className="flex justify-between">
                    <div>
                      <div className="font-medium">Order #{o.id || o.ID || o.order_id}</div>
                      <div className="text-sm text-muted-foreground">{new Date(o.created_at || o.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-thrift-green">NPR {Number(o.total).toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">{o.payment_status || o.paymentStatus}</div>
                    </div>
                  </div>
                  <div className="mt-2 text-sm">
                    {o.items && Array.isArray(o.items) ? (
                      o.items.map((it: any, i: number) => (
                        <div key={i} className="flex justify-between">
                          <div>{it.title} × {it.quantity}</div>
                          <div>NPR {Number(it.price * it.quantity).toLocaleString()}</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground">No items stored</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
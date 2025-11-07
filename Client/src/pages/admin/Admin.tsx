import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
// Recharts moved to lazy-loaded chart component for code-splitting
// import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import React, { Suspense } from 'react';
const AdminSalesChart = React.lazy(() => import('./AdminSalesChart'));


type Summary = { users: number; products: number; orders: number; sales: number };
type SalesPoint = { date: string; sales: number };
type Analytics = {
  totalSales: number;
  salesToday: number;
  totalOrders: number;
  paidOrders: number;
  pendingPayments: number;
  salesLast30Days: SalesPoint[];
  topProducts: { product_id: number; title: string; revenue: number; qty: number }[];
};

export default function AdminPage() {
  const { token } = useAuth();
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const [tab, setTab] = useState<'dashboard'|'orders'|'products'|'users'|'payments'>('dashboard');
  const [ledger, setLedger] = useState<any[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const headers = token ? { Authorization: `Bearer ${token}` } : undefined as any;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`${apiBase}/api/admin/summary`, { headers });
        if (!res.ok) return;
        const data = await res.json();
        if (mounted) setSummary(data);
      } catch {}
    })();
    return () => { mounted = false; };
  }, [apiBase, token]);

  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      // Simple sessionStorage cache (2 min TTL)
      const key = 'admin_sales_cache_v1';
      const cachedRaw = sessionStorage.getItem(key);
      if (cachedRaw) {
        try {
          const cached = JSON.parse(cachedRaw);
          if (cached && cached.ts && Date.now() - cached.ts < 2 * 60 * 1000) {
            setAnalytics(cached.data);
            setAnalyticsLoading(false);
            return;
          }
        } catch {}
      }
      const res = await fetch(`${apiBase}/api/admin/analytics/sales`, { headers });
      if (!res.ok) return;
      const data: Analytics = await res.json();
      setAnalytics(data);
      try { sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data })); } catch {}
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/admin/orders`, { headers });
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } finally { setLoading(false); }
  };
  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/admin/products`, { headers });
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } finally { setLoading(false); }
  };
  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/admin/users`, { headers });
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } finally { setLoading(false); }
  };

  const loadLedger = async () => {
    setLedgerLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/payments/ledger`, { headers });
      if (!res.ok) return;
      const data = await res.json();
      setLedger(Array.isArray(data) ? data : []);
    } finally { setLedgerLoading(false); }
  };

  useEffect(() => {
    if (tab === 'orders') loadOrders();
    if (tab === 'products') loadProducts();
    if (tab === 'users') loadUsers();
    if (tab === 'dashboard') loadAnalytics();
    if (tab === 'payments') loadLedger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const chartConfig = useMemo(() => ({
    sales: {
      label: 'Sales',
      color: 'hsl(var(--thrift-green))',
    },
  }), []);

  const updateOrder = async (id: number, patch: any) => {
    await fetch(`${apiBase}/api/admin/orders/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...(headers||{}) }, body: JSON.stringify(patch) });
    await loadOrders();
  };
  const updateProduct = async (id: number, patch: any) => {
    await fetch(`${apiBase}/api/admin/products/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...(headers||{}) }, body: JSON.stringify(patch) });
    await loadProducts();
  };
  const deleteProduct = async (id: number) => {
    await fetch(`${apiBase}/api/admin/products/${id}`, { method: 'DELETE', headers });
    await loadProducts();
  };
  const updateUser = async (id: number, patch: any) => {
    await fetch(`${apiBase}/api/admin/users/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...(headers||{}) }, body: JSON.stringify(patch) });
    await loadUsers();
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Admin</h1>
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
        <aside className="border rounded bg-card h-fit">
          <nav className="flex md:flex-col">
            <button className={`text-left px-4 py-3 w-full border-b md:border-b-0 hover:bg-[hsl(var(--thrift-green))]/10 ${tab==='dashboard' ? 'bg-[hsl(var(--thrift-green))]/10 text-[hsl(var(--thrift-green))] font-medium' : ''}`} onClick={() => setTab('dashboard')}>Dashboard</button>
            <button className={`text-left px-4 py-3 w-full border-b md:border-b-0 hover:bg-[hsl(var(--thrift-green))]/10 ${tab==='orders' ? 'bg-[hsl(var(--thrift-green))]/10 text-[hsl(var(--thrift-green))] font-medium' : ''}`} onClick={() => setTab('orders')}>Orders</button>
            <button className={`text-left px-4 py-3 w-full border-b md:border-b-0 hover:bg-[hsl(var(--thrift-green))]/10 ${tab==='products' ? 'bg-[hsl(var(--thrift-green))]/10 text-[hsl(var(--thrift-green))] font-medium' : ''}`} onClick={() => setTab('products')}>Products</button>
            <button className={`text-left px-4 py-3 w-full hover:bg-[hsl(var(--thrift-green))]/10 ${tab==='users' ? 'bg-[hsl(var(--thrift-green))]/10 text-[hsl(var(--thrift-green))] font-medium' : ''}`} onClick={() => setTab('users')}>Users</button>
            <button className={`text-left px-4 py-3 w-full hover:bg-[hsl(var(--thrift-green))]/10 ${tab==='payments' ? 'bg-[hsl(var(--thrift-green))]/10 text-[hsl(var(--thrift-green))] font-medium' : ''}`} onClick={() => setTab('payments')}>Payments</button>
          {tab === 'payments' && (
            <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Payment Ledger</CardTitle><Button variant="ghost" onClick={loadLedger}>{ledgerLoading ? 'Loading...' : 'Refresh'}</Button></CardHeader>
              <CardContent className="space-y-3 max-h-[480px] overflow-auto">
                {ledger.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No ledger entries yet.</div>
                ) : (
                  ledger.map(entry => (
                    <div key={entry.id} className="border rounded p-3 text-sm flex flex-col gap-1">
                      <div className="flex justify-between">
                        <span className="font-medium">#{entry.id} • {entry.method}</span>
                        <span className={entry.status === 'verified' ? 'text-green-600' : 'text-yellow-600'}>{entry.status}</span>
                      </div>
                      <div className="text-muted-foreground">Order: {entry.order_id || '—'} • Txn: {entry.gateway_txn_id || '—'}</div>
                      <div className="text-muted-foreground">Amt: {entry.amount != null ? Number(entry.amount).toLocaleString() : '—'} {entry.currency}</div>
                      <div className="text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleString()}</div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}
          </nav>
        </aside>
        <div className="space-y-6">
          {tab === 'dashboard' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm"><CardHeader><CardTitle>Users</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{summary?.users ?? '—'}</CardContent></Card>
                <Card className="border-none shadow-sm"><CardHeader><CardTitle>Products</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{summary?.products ?? '—'}</CardContent></Card>
                <Card className="border-none shadow-sm"><CardHeader><CardTitle>Orders</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{summary?.orders ?? '—'}</CardContent></Card>
                <Card className="border-none shadow-sm"><CardHeader><CardTitle>Sales (NPR)</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{summary?.sales != null ? Number(summary.sales).toLocaleString() : '—'}</CardContent></Card>
              </div>

              <Card className="border-none shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Sales (Last 30 days)</CardTitle>
                  <Button variant="ghost" onClick={loadAnalytics}>{analyticsLoading ? 'Loading...' : 'Refresh'}</Button>
                </CardHeader>
                <CardContent>
                  {analytics?.salesLast30Days && analytics.salesLast30Days.length > 0 ? (
                    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading chart…</div>}>
                      <AdminSalesChart data={analytics.salesLast30Days} />
                    </Suspense>
                  ) : (
                    <div className="text-sm text-muted-foreground">No sales data yet.</div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {tab === 'orders' && (
            <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Orders</CardTitle><Button variant="ghost" onClick={loadOrders}>{loading ? 'Loading...' : 'Refresh'}</Button></CardHeader>
              <CardContent className="space-y-3">
                {orders.map(o => (
                  <div key={o.id} className="border rounded p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Order #{o.id}</div>
                        <div className="text-sm text-muted-foreground">{new Date(o.created_at).toLocaleString()} • NPR {Number(o.total||0).toLocaleString()}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select className="border rounded px-2 py-1 text-sm" value={String(o.status||'pending')} onChange={(e) => updateOrder(o.id, { status: e.target.value })}>
                          <option value="pending">pending</option>
                          <option value="cancelled">cancelled</option>
                          <option value="sold">sold</option>
                        </select>
                        <select className="border rounded px-2 py-1 text-sm" value={String(o.payment_status||'pending')} onChange={(e) => updateOrder(o.id, { payment_status: e.target.value })}>
                          <option value="pending">pending</option>
                          <option value="paid">paid</option>
                          <option value="refunded">refunded</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">{(o.items||[]).length} item(s)</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {tab === 'products' && (
            <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Products</CardTitle><Button variant="ghost" onClick={loadProducts}>{loading ? 'Loading...' : 'Refresh'}</Button></CardHeader>
              <CardContent className="space-y-3">
                {products.map(p => (
                  <div key={p.id} className="border rounded p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={(p.images && p.images[0]) || p.image} alt={p.title} className="w-12 h-12 object-cover rounded" />
                      <div>
                        <div className="font-medium">{p.title}</div>
                        <div className="text-sm text-muted-foreground">NPR {Number(p.price||0).toLocaleString()} • {p.brand || '-'} • {p.category || '-'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select className="border rounded px-2 py-1 text-sm" value={String(p.status||'unsold')} onChange={(e) => updateProduct(p.id, { status: e.target.value })}>
                        <option value="unsold">unsold</option>
                        <option value="order_received">order_received</option>
                        <option value="sold">sold</option>
                      </select>
                      <Button variant="destructive" size="sm" onClick={() => deleteProduct(p.id)}>Delete</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {tab === 'users' && (
            <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Users</CardTitle><Button variant="ghost" onClick={loadUsers}>{loading ? 'Loading...' : 'Refresh'}</Button></CardHeader>
              <CardContent className="space-y-3">
                {users.map(u => (
                  <div key={u.id} className="border rounded p-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{u.name} <span className="text-xs text-muted-foreground">({u.email})</span></div>
                      <div className="text-sm text-muted-foreground">{u.phone || '—'} • joined {new Date(u.created_at).toLocaleDateString()}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select className="border rounded px-2 py-1 text-sm" value={String(u.role||'buyer')} onChange={(e) => updateUser(u.id, { role: e.target.value })}>
                        <option value="buyer">buyer</option>
                        <option value="admin">admin</option>
                      </select>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

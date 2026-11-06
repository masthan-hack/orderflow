
import React, { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard, ShoppingCart, Users, Package,
  Search, Bell, Menu, LogOut, Plus, Download,
  TrendingUp, Clock, CheckCircle, IndianRupee,
  ChevronDown, RefreshCw
} from "lucide-react";
import { supabase } from "./supabaseClient";
import "./App.css";

export default function App() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [activePage, setActivePage] = useState("Dashboard");
  const [search, setSearch] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => setSession(newSession)
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) loadAll();
  }, [session]);

  async function loadAll() {
    setLoading(true);
    setError("");

    try {
      const [o, c, p] = await Promise.all([
        supabase.from("orders").select("*").order("created_at", { ascending: false }),
        supabase.from("customers").select("*").order("created_at", { ascending: false }),
        supabase.from("products").select("*").order("created_at", { ascending: false })
      ]);

      if (o.error) throw o.error;
      if (c.error) throw c.error;
      if (p.error) throw p.error;

      setOrders(o.data || []);
      setCustomers(c.data || []);
      setProducts(p.data || []);
    } catch (err) {
      setError(err.message || "Unable to load data");
    } finally {
      setLoading(false);
    }
  }

  async function handleAuth(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const result = isSignup
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

      if (result.error) throw result.error;

      if (isSignup && !result.data.session) {
        setMessage("Signup successful. Check your email to confirm your account.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) setError(error.message);
  }

  const totalRevenue = useMemo(
    () => orders.reduce((sum, order) => sum + Number(order.amount || 0), 0),
    [orders]
  );

  const pendingOrders = orders.filter(
    (order) => String(order.status || "").toLowerCase() === "pending"
  ).length;

  const completedOrders = orders.filter(
    (order) => String(order.status || "").toLowerCase() === "completed"
  ).length;

  const filteredOrders = orders.filter((order) =>
    [
      order.customer_name,
      order.customer,
      order.product,
      order.product_name,
      order.status
    ].some((value) =>
      String(value || "").toLowerCase().includes(search.toLowerCase())
    )
  );

  function exportCSV() {
    const headers = ["Customer", "Product", "Quantity", "Amount", "Status"];
    const rows = orders.map((o) => [
      o.customer_name || o.customer || "",
      o.product || o.product_name || "",
      o.quantity || "",
      o.amount || "",
      o.status || ""
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "orderflow-orders.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!session) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <div className="brand-mark">O</div>
          <p className="eyebrow">ORDERFLOW ERP</p>
          <h1>{isSignup ? "Create Account" : "Welcome Back"}</h1>
          <p className="muted">Manage your business with confidence.</p>

          <form onSubmit={handleAuth}>
            <label>Email address</label>
            <input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label>Password</label>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />

            {error && <p className="error-message">{error}</p>}
            {message && <p className="success-message">{message}</p>}

            <button className="gold-button full-button" disabled={loading}>
              {loading ? "Please wait..." : isSignup ? "Create Account" : "Sign In"}
            </button>
          </form>

          <p className="switch-auth">
            {isSignup ? "Already registered?" : "New to OrderFlow?"}
            <button onClick={() => {
              setIsSignup(!isSignup);
              setError("");
              setMessage("");
            }}>
              {isSignup ? "Sign In" : "Create Account"}
            </button>
          </p>
        </div>
      </div>
    );
  }

  const navigation = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Orders", icon: ShoppingCart },
    { name: "Customers", icon: Users },
    { name: "Products", icon: Package }
  ];

  return (
    <div className="erp-layout">
      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark small-mark">O</div>
          <div>
            <h2>ORDERFLOW</h2>
            <span>BUSINESS ERP</span>
          </div>
        </div>

        <p className="nav-label">WORKSPACE</p>

        <nav>
          {navigation.map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={`nav-item ${activePage === name ? "active" : ""}`}
              onClick={() => {
                setActivePage(name);
                setMobileMenu(false);
              }}
            >
              <Icon size={19} />
              <span>{name}</span>
              {activePage === name && <span className="active-dot" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="plan-card">
            <span className="plan-star">✦</span>
            <strong>OrderFlow ERP</strong>
            <p>Your business, organized.</p>
          </div>
          <button className="logout-button" onClick={logout}>
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="mobile-menu-button" onClick={() => setMobileMenu(!mobileMenu)}>
            <Menu />
          </button>
          <div className="breadcrumb">
            <span>Workspace</span><span>/</span><strong>{activePage}</strong>
          </div>
          <div className="top-actions">
            <span className="live-indicator">● LIVE</span>
            <button className="icon-button" onClick={loadAll} title="Refresh">
              <RefreshCw size={18} />
            </button>
            <button className="icon-button" title="Notifications">
              <Bell size={18} />
            </button>
            <div className="profile">
              <div className="avatar">{session.user.email?.[0]?.toUpperCase()}</div>
              <div className="profile-info">
                <strong>Account</strong>
                <span>{session.user.email}</span>
              </div>
              <ChevronDown size={16} />
            </div>
          </div>
        </header>

        <section className="content">
          {error && <div className="error-banner">{error}</div>}

          <div className="page-heading">
            <div>
              <p className="eyebrow">BUSINESS OVERVIEW</p>
              <h1>{activePage}</h1>
              <p className="muted">Welcome to your OrderFlow workspace.</p>
            </div>
            <button className="gold-button" onClick={loadAll}>
              <RefreshCw size={16} /> Refresh Data
            </button>
          </div>

          {activePage === "Dashboard" && (
            <>
              <div className="stats-grid">
                <StatCard icon={ShoppingCart} label="Total Orders" value={orders.length} note="All recorded orders" />
                <StatCard icon={IndianRupee} label="Order Value" value={`₹${totalRevenue.toLocaleString("en-IN")}`} note="Based on order amounts" />
                <StatCard icon={Clock} label="Pending Orders" value={pendingOrders} note="Awaiting completion" />
                <StatCard icon={CheckCircle} label="Completed Orders" value={completedOrders} note="Marked completed" />
              </div>

              <div className="dashboard-grid">
                <div className="panel">
                  <div className="panel-heading">
                    <div><p className="eyebrow">ACTIVITY</p><h3>Recent Orders</h3></div>
                    <button className="text-button" onClick={() => setActivePage("Orders")}>View all →</button>
                  </div>
                  <OrdersTable data={orders.slice(0, 6)} />
                </div>

                <div className="panel">
                  <div className="panel-heading">
                    <div><p className="eyebrow">BUSINESS SNAPSHOT</p><h3>Overview</h3></div>
                    <TrendingUp className="gold-icon" />
                  </div>
                  <div className="overview-row"><span>Customers</span><strong>{customers.length}</strong></div>
                  <div className="overview-row"><span>Products</span><strong>{products.length}</strong></div>
                  <div className="overview-row"><span>Pending orders</span><strong>{pendingOrders}</strong></div>
                  <div className="overview-row"><span>Completed orders</span><strong>{completedOrders}</strong></div>
                  <div className="overview-note">Figures reflect records currently accessible to this account.</div>
                </div>
              </div>
            </>
          )}

          {activePage === "Orders" && (
            <div className="panel">
              <div className="panel-heading">
                <div><p className="eyebrow">ORDER MANAGEMENT</p><h3>All Orders</h3></div>
                <button className="gold-button" onClick={exportCSV}><Download size={16} /> Export CSV</button>
              </div>
              <SearchBox value={search} onChange={setSearch} />
              <OrdersTable data={filteredOrders} />
            </div>
          )}

          {activePage === "Customers" && (
            <div className="panel">
              <div className="panel-heading">
                <div><p className="eyebrow">CUSTOMER DIRECTORY</p><h3>All Customers</h3></div>
              </div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Customer</th><th>Email</th><th>Phone</th></tr></thead>
                  <tbody>
                    {customers.map((c) => (
                      <tr key={c.id}>
                        <td><strong>{c.name || c.customer_name || "—"}</strong></td>
                        <td>{c.email || "—"}</td>
                        <td>{c.phone || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {customers.length === 0 && <EmptyState />}
              </div>
            </div>
          )}

          {activePage === "Products" && (
            <div className="panel">
              <div className="panel-heading">
                <div><p className="eyebrow">PRODUCT CATALOGUE</p><h3>All Products</h3></div>
              </div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Product</th><th>SKU</th><th>Unit</th><th>Price</th><th>Stock</th></tr></thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id}>
                        <td><strong>{p.name || "—"}</strong></td>
                        <td>{p.sku || "—"}</td>
                        <td>{p.unit || "—"}</td>
                        <td>₹{Number(p.price || 0).toLocaleString("en-IN")}</td>
                        <td>{p.stock_quantity ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {products.length === 0 && <EmptyState />}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, note }) {
  return (
    <div className="stat-card">
      <div className="stat-top"><span>{label}</span><div className="stat-icon"><Icon size={19} /></div></div>
      <h2>{value}</h2>
      <p>{note}</p>
    </div>
  );
}

function SearchBox({ value, onChange }) {
  return (
    <div className="search-box">
      <Search size={18} />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Search orders..." />
    </div>
  );
}

function OrdersTable({ data }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr><th>Customer</th><th>Product</th><th>Quantity</th><th>Amount</th><th>Status</th></tr>
        </thead>
        <tbody>
          {data.map((order) => (
            <tr key={order.id}>
              <td><strong>{order.customer_name || order.customer || "—"}</strong></td>
              <td>{order.product || order.product_name || "—"}</td>
              <td>{order.quantity ?? "—"}</td>
              <td>₹{Number(order.amount || 0).toLocaleString("en-IN")}</td>
              <td><span className={`status-badge ${String(order.status || "pending").toLowerCase()}`}>{order.status || "Pending"}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && <EmptyState />}
    </div>
  );
}

function EmptyState() {
  return <div className="empty-state">No records found.</div>;
}


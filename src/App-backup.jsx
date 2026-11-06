
import React, { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard, ShoppingCart, Users, Package,
  Search, Bell, Menu, LogOut, Download,
  TrendingUp, Clock, CheckCircle, IndianRupee,
  ChevronDown, RefreshCw, Eye, EyeOff,
  ArrowRight, ShieldCheck, LockKeyhole, Mail,
  Sparkles
} from "lucide-react";

import { supabase } from "./supabaseClient";
import "./App.css";
import "./LoginPremium.css";

export default function App() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
        setMessage("Account created. Please check your email to confirm your account.");
      } else if (isSignup) {
        setMessage("Your account has been created successfully.");
      }
    } catch (err) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Please enter your email address first.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: window.location.origin
        }
      );

      if (error) throw error;

      setMessage("Password reset instructions have been sent to your email.");
    } catch (err) {
      setError(err.message || "Unable to send password reset email");
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
      .map((row) =>
        row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv" })
    );

    const a = document.createElement("a");
    a.href = url;
    a.download = "orderflow-orders.csv";
    a.click();

    URL.revokeObjectURL(url);
  }

  // PREMIUM LOGIN / SIGNUP SCREEN
  if (!session) {
    return (
      <div className="premium-login-screen">

        <div className="login-background-glow glow-one"></div>
        <div className="login-background-glow glow-two"></div>

        <div className="premium-login-container">

          {/* LEFT BRAND PANEL */}
          <section className="login-brand-panel">

            <div className="login-brand-logo">
              <div className="login-logo-symbol">O</div>

              <div>
                <h2>ORDERFLOW</h2>
                <span>BUSINESS ERP</span>
              </div>
            </div>

            <div className="brand-main-content">
              <div className="brand-tag">
                <Sparkles size={14} />
                SMART BUSINESS MANAGEMENT
              </div>

              <h1>
                Manage your
                <span> business.</span>
                <br />
                Move forward.
              </h1>

              <p>
                One powerful workspace to manage your orders,
                customers and products with confidence.
              </p>

              <div className="brand-feature-list">
                <div className="brand-feature">
                  <div className="feature-icon">
                    <ShoppingCart size={19} />
                  </div>
                  <div>
                    <strong>Order Management</strong>
                    <span>Keep every order organized.</span>
                  </div>
                </div>

                <div className="brand-feature">
                  <div className="feature-icon">
                    <Users size={19} />
                  </div>
                  <div>
                    <strong>Customer Workspace</strong>
                    <span>Manage your customer records.</span>
                  </div>
                </div>

                <div className="brand-feature">
                  <div className="feature-icon">
                    <TrendingUp size={19} />
                  </div>
                  <div>
                    <strong>Business Overview</strong>
                    <span>See your business information clearly.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="brand-footer">
              <span>© {new Date().getFullYear()} ORDERFLOW ERP</span>
              <span>BUILT FOR BUSINESS</span>
            </div>

          </section>

          {/* RIGHT AUTH PANEL */}
          <section className="login-form-panel">

            <div className="login-mobile-brand">
              <div className="login-logo-symbol">O</div>
              <div>
                <h2>ORDERFLOW</h2>
                <span>BUSINESS ERP</span>
              </div>
            </div>

            <div className="login-form-content">

              <div className="login-welcome-icon">
                <LockKeyhole size={23} />
              </div>

              <p className="login-eyebrow">
                {isSignup ? "GET STARTED" : "WELCOME TO ORDERFLOW"}
              </p>

              <h2>
                {isSignup ? "Create your account" : "Welcome back"}
              </h2>

              <p className="login-description">
                {isSignup
                  ? "Create your workspace and organize your business."
                  : "Sign in to continue to your business workspace."}
              </p>

              <form onSubmit={handleAuth} className="premium-auth-form">

                <label htmlFor="login-email">Email address</label>

                <div className="premium-input-wrap">
                  <Mail size={18} />
                  <input
                    id="login-email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="password-label-row">
                  <label htmlFor="login-password">Password</label>

                  {!isSignup && (
                    <button
                      type="button"
                      className="forgot-password"
                      onClick={handleForgotPassword}
                      disabled={loading}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>

                <div className="premium-input-wrap">
                  <LockKeyhole size={18} />

                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={isSignup ? "new-password" : "current-password"}
                    required
                    minLength={6}
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {error && (
                  <div className="premium-message error-message">
                    {error}
                  </div>
                )}

                {message && (
                  <div className="premium-message success-message">
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  className="premium-submit-button"
                  disabled={loading}
                >
                  {loading
                    ? "Please wait..."
                    : isSignup
                      ? "Create Account"
                      : "Sign In"}

                  {!loading && <ArrowRight size={18} />}
                </button>

              </form>

              <div className="auth-divider">
                <span>SECURE ACCOUNT ACCESS</span>
              </div>

              <div className="auth-switch">
                {isSignup
                  ? "Already have an account?"
                  : "New to OrderFlow?"}

                <button
                  type="button"
                  onClick={() => {
                    setIsSignup(!isSignup);
                    setError("");
                    setMessage("");
                    setShowPassword(false);
                  }}
                >
                  {isSignup ? "Sign In" : "Create Account"}
                </button>
              </div>

              <div className="login-security-note">
                <ShieldCheck size={16} />
                <span>Your account is protected by secure authentication.</span>
              </div>

            </div>

          </section>
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
          <button
            className="mobile-menu-button"
            onClick={() => setMobileMenu(!mobileMenu)}
          >
            <Menu />
          </button>

          <div className="breadcrumb">
            <span>Workspace</span>
            <span>/</span>
            <strong>{activePage}</strong>
          </div>

          <div className="top-actions">
            <span className="live-indicator">● LIVE</span>

            <button
              className="icon-button"
              onClick={loadAll}
              title="Refresh"
            >
              <RefreshCw size={18} />
            </button>

            <button className="icon-button" title="Notifications">
              <Bell size={18} />
            </button>

            <div className="profile">
              <div className="avatar">
                {session.user.email?.[0]?.toUpperCase()}
              </div>

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
              <p className="muted">
                Welcome to your OrderFlow workspace.
              </p>
            </div>

            <button className="gold-button" onClick={loadAll}>
              <RefreshCw size={16} /> Refresh Data
            </button>
          </div>

          {activePage === "Dashboard" && (
            <>
              <div className="stats-grid">
                <StatCard
                  icon={ShoppingCart}
                  label="Total Orders"
                  value={orders.length}
                  note="All recorded orders"
                />

                <StatCard
                  icon={IndianRupee}
                  label="Order Value"
                  value={`₹${totalRevenue.toLocaleString("en-IN")}`}
                  note="Based on order amounts"
                />

                <StatCard
                  icon={Clock}
                  label="Pending Orders"
                  value={pendingOrders}
                  note="Awaiting completion"
                />

                <StatCard
                  icon={CheckCircle}
                  label="Completed Orders"
                  value={completedOrders}
                  note="Marked completed"
                />
              </div>

              <div className="dashboard-grid">
                <div className="panel">
                  <div className="panel-heading">
                    <div>
                      <p className="eyebrow">ACTIVITY</p>
                      <h3>Recent Orders</h3>
                    </div>

                    <button
                      className="text-button"
                      onClick={() => setActivePage("Orders")}
                    >
                      View all →
                    </button>
                  </div>

                  <OrdersTable data={orders.slice(0, 6)} />
                </div>

                <div className="panel">
                  <div className="panel-heading">
                    <div>
                      <p className="eyebrow">BUSINESS SNAPSHOT</p>
                      <h3>Overview</h3>
                    </div>

                    <TrendingUp className="gold-icon" />
                  </div>

                  <div className="overview-row">
                    <span>Customers</span>
                    <strong>{customers.length}</strong>
                  </div>

                  <div className="overview-row">
                    <span>Products</span>
                    <strong>{products.length}</strong>
                  </div>

                  <div className="overview-row">
                    <span>Pending orders</span>
                    <strong>{pendingOrders}</strong>
                  </div>

                  <div className="overview-row">
                    <span>Completed orders</span>
                    <strong>{completedOrders}</strong>
                  </div>

                  <div className="overview-note">
                    Figures reflect records currently accessible to this account.
                  </div>
                </div>
              </div>
            </>
          )}

          {activePage === "Orders" && (
            <div className="panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">ORDER MANAGEMENT</p>
                  <h3>All Orders</h3>
                </div>

                <button className="gold-button" onClick={exportCSV}>
                  <Download size={16} /> Export CSV
                </button>
              </div>

              <SearchBox value={search} onChange={setSearch} />
              <OrdersTable data={filteredOrders} />
            </div>
          )}

          {activePage === "Customers" && (
            <div className="panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">CUSTOMER DIRECTORY</p>
                  <h3>All Customers</h3>
                </div>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Email</th>
                      <th>Phone</th>
                    </tr>
                  </thead>

                  <tbody>
                    {customers.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <strong>{c.name || c.customer_name || "—"}</strong>
                        </td>
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
                <div>
                  <p className="eyebrow">PRODUCT CATALOGUE</p>
                  <h3>All Products</h3>
                </div>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Unit</th>
                      <th>Price</th>
                      <th>Stock</th>
                    </tr>
                  </thead>

                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id}>
                        <td><strong>{p.name || "—"}</strong></td>
                        <td>{p.sku || "—"}</td>
                        <td>{p.unit || "—"}</td>
                        <td>
                          ₹{Number(p.price || 0).toLocaleString("en-IN")}
                        </td>
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
      <div className="stat-top">
        <span>{label}</span>
        <div className="stat-icon">
          <Icon size={19} />
        </div>
      </div>

      <h2>{value}</h2>
      <p>{note}</p>
    </div>
  );
}

function SearchBox({ value, onChange }) {
  return (
    <div className="search-box">
      <Search size={18} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search orders..."
      />
    </div>
  );
}

function OrdersTable({ data }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Customer</th>
            <th>Product</th>
            <th>Quantity</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {data.map((order) => (
            <tr key={order.id}>
              <td>
                <strong>
                  {order.customer_name || order.customer || "—"}
                </strong>
              </td>

              <td>{order.product || order.product_name || "—"}</td>
              <td>{order.quantity ?? "—"}</td>
              <td>
                ₹{Number(order.amount || 0).toLocaleString("en-IN")}
              </td>

              <td>
                <span
                  className={`status-badge ${String(
                    order.status || "pending"
                  ).toLowerCase()}`}
                >
                  {order.status || "Pending"}
                </span>
              </td>
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


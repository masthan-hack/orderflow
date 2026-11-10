
import React, { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  Search,
  Bell,
  Menu,
  LogOut,
  Plus,
  Sparkles,
  Download,
  TrendingUp,
  Clock,
  CheckCircle,
  IndianRupee,
  ChevronDown,
  LockKeyhole,
  Mail,
  Eye,
  ArrowRight,
  ShieldCheck,
  RefreshCw
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
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [orderSaving, setOrderSaving] = useState(false);

  const [orderForm, setOrderForm] = useState({
  customer_name: "",
  product_name: "",
  quantity: "1",
  amount: "0",
  status: "Pending",
  order_date: new Date().toISOString().slice(0, 10)
  });
  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [customerSaving, setCustomerSaving] = useState(false);

  const [customerForm, setCustomerForm] = useState({
     name: "",
     email: "",
    phone: ""
   });
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState("");
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productSaving, setProductSaving] = useState(false);

  const [productForm, setProductForm] = useState({
    name: "",
    sku: "",
    unit: "pcs",
    price: "0",
    stock_quantity: "0"
  });
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
  console.log("REFRESH STARTED");

  setLoading(true);
  setError("");

  try {
    const [o, c, p] = await Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("customers").select("*").order("created_at", { ascending: false }),
      supabase.from("products").select("*").order("created_at", { ascending: false })
    ]);

    console.log("Orders:", o);
    console.log("Customers:", c);
    console.log("Products:", p);

    if (o.error) throw o.error;
    if (c.error) throw c.error;
    if (p.error) throw p.error;

    setOrders(o.data || []);
    setCustomers(c.data || []);
    setProducts(p.data || []);

    console.log("REFRESH SUCCESS");
  } catch (err) {
    console.error("REFRESH FAILED:", err);
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
  function openAddProduct() {
  setEditingProduct(null);

  setProductForm({
    name: "",
    sku: "",
    unit: "pcs",
    price: "0",
    stock_quantity: "0"
  });

  setShowProductModal(true);
}

function openEditProduct(product) {
  setEditingProduct(product);

  setProductForm({
    name: product.name || "",
    sku: product.sku || "",
    unit: product.unit || "pcs",
    price: String(product.price ?? 0),
    stock_quantity: String(product.stock_quantity ?? 0)
  });

  setShowProductModal(true);
}

async function saveProduct(e) {
  e.preventDefault();

  if (!productForm.name.trim()) {
    setError("Product name is required.");
    return;
  }

  const price = Number(productForm.price);
  const stock = Number(productForm.stock_quantity);

  if (!Number.isFinite(price) || price < 0 ||
      !Number.isFinite(stock) || stock < 0) {
    setError("Price and stock must be valid non-negative numbers.");
    return;
  }

  setProductSaving(true);
  setError("");

  const productData = {
    name: productForm.name.trim(),
    sku: productForm.sku.trim() || null,
    unit: productForm.unit.trim() || "pcs",
    price,
    stock_quantity: stock,
    updated_at: new Date().toISOString()
  };

  try {
    let result;

    if (editingProduct) {
      result = await supabase
        .from("products")
        .update(productData)
        .eq("id", editingProduct.id)
        .eq("business_id", session.user.id);
    } else {
      result = await supabase
        .from("products")
        .insert({
          ...productData,
          business_id: session.user.id
        });
    }

    if (result.error) throw result.error;

    setShowProductModal(false);
    setEditingProduct(null);

    await loadAll();
  } catch (err) {
    setError(err.message || "Unable to save product.");
  } finally {
    setProductSaving(false);
  }
}

async function deleteProduct(product) {
  const confirmed = window.confirm(
    `Delete product "${product.name}"?`
  );

  if (!confirmed) return;

  setError("");

  try {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", product.id)
      .eq("business_id", session.user.id);

    if (error) throw error;

    await loadAll();
  } catch (err) {
    setError(err.message || "Unable to delete product.");
  }
}
function openAddOrder() {
  setEditingOrder(null);

  setOrderForm({
    customer_name: "",
    product_name: "",
    quantity: "1",
    amount: "0",
    status: "Pending",
    order_date: new Date().toISOString().slice(0, 10)
  });

  setShowOrderModal(true);
}


async function saveOrder(e) {
  e.preventDefault();

  if (!orderForm.customer_name.trim() || !orderForm.product_name.trim()) {
    setError("Customer name and product name are required.");
    return;
  }

  if (Number(orderForm.quantity) <= 0 || Number(orderForm.amount) < 0) {
    setError("Enter valid quantity and amount.");
    return;
  }

  setOrderSaving(true);
  setError("");

  const orderData = {
    customer_name: orderForm.customer_name.trim(),
    product_name: orderForm.product_name.trim(),
    quantity: Number(orderForm.quantity),
    amount: Number(orderForm.amount),
    status: orderForm.status,
    order_date: orderForm.order_date
  };

  try {
    let result;

    if (editingOrder) {
      // Update existing order
      result = await supabase
        .from("orders")
        .update(orderData)
        .eq("id", editingOrder.id)
        .eq("business_id", session.user.id);
    } else {
      // Insert new order
      result = await supabase
        .from("orders")
        .insert({
          ...orderData,
          business_id: session.user.id
        });
    }

    if (result.error) throw result.error;

    setShowOrderModal(false);
    setEditingOrder(null);
    await loadAll();

  } catch (err) {
    setError(err.message || "Unable to save order.");
  } finally {
    setOrderSaving(false);
  }
}


async function deleteOrder(order) {
  const confirmed = window.confirm(
    `Delete order for ${order.customer_name}?`
  );

  if (!confirmed) return;

  setError("");

  try {
    const { error } = await supabase
      .from("orders")
      .delete()
      .eq("id", order.id)
      .eq("business_id", session.user.id);

    if (error) throw error;

    await loadAll();
  } catch (err) {
    setError(err.message || "Unable to delete order.");
  }
}
function openEditOrder(order) {
  console.log("Dashboard Edit clicked:", order);

  setError("");
  setEditingOrder(order);

  setOrderForm({
    customer_name: order.customer_name || "",
    product_name: order.product_name || "",
    quantity: String(order.quantity ?? 1),
    amount: String(order.amount ?? 0),
    status: order.status || "Pending",
    order_date:
      order.order_date ||
      new Date().toISOString().slice(0, 10)
  });

  setShowOrderModal(true);
}
function openAddCustomer() {
  setEditingCustomer(null);
  setCustomerForm({
    name: "",
    email: "",
    phone: ""
  });
  setShowCustomerModal(true);
}

function openEditCustomer(customer) {
  setEditingCustomer(customer);
  setCustomerForm({
    name: customer.name || customer.customer_name || "",
    email: customer.email || "",
    phone: customer.phone || ""
  });
  setShowCustomerModal(true);
}

async function saveCustomer(e) {
  e.preventDefault();

  if (!customerForm.name.trim()) {
    setError("Customer name is required.");
    return;
  }

  setCustomerSaving(true);
  setError("");

  const customerData = {
    name: customerForm.name.trim(),
    email: customerForm.email.trim() || null,
    phone: customerForm.phone.trim() || null
  };

  try {
    let result;

    if (editingCustomer) {
      result = await supabase
        .from("customers")
        .update(customerData)
        .eq("id", editingCustomer.id)
        .eq("business_id", session.user.id);
    } else {
      result = await supabase
        .from("customers")
        .insert({
          ...customerData,
          business_id: session.user.id
        });
    }

    if (result.error) throw result.error;

    setShowCustomerModal(false);
    setEditingCustomer(null);
    await loadAll();
  } catch (err) {
    setError(err.message || "Unable to save customer.");
  } finally {
    setCustomerSaving(false);
  }
}
async function deleteCustomer(customer) {
  const confirmed = window.confirm(
    `Are you sure you want to delete ${
      customer.name || customer.customer_name
    }?`
  );

  if (!confirmed) return;

  setError("");

  try {
    const { error } = await supabase
      .from("customers")
      .delete()
      .eq("id", customer.id)
      .eq("business_id", session.user.id);

    if (error) throw error;

    await loadAll();
  } catch (err) {
    setError(err.message || "Unable to delete customer.");
  }
}
const filteredCustomers = customers.filter((customer) =>
  [
    customer.name,
    customer.customer_name,
    customer.email,
    customer.phone
  ].some((value) =>
    String(value || "")
      .toLowerCase()
      .includes(customerSearch.toLowerCase())
  )
);

const filteredProducts = products.filter((product) =>
  [product.name, product.sku, product.unit]
    .some((value) =>
      String(value || "")
        .toLowerCase()
        .includes(productSearch.toLowerCase())
    )
);

  const totalRevenue = useMemo(
    () => orders.reduce((sum, order) => sum + Number(order.amount || 0), 0),
    [orders]
  );

  const getStatusCount = (status) =>
  orders.filter(
    (order) =>
      String(order.status || "").toLowerCase() === status.toLowerCase()
  ).length;

  const pendingOrders = getStatusCount("Pending");
  const confirmedOrders = getStatusCount("Confirmed");
  const dispatchedOrders = getStatusCount("Dispatched");
  const deliveredOrders = getStatusCount("Delivered");
  const completedOrders = deliveredOrders;
  const statusChartData = [
  { label: "Pending", value: pendingOrders },
  { label: "Confirmed", value: confirmedOrders },
  { label: "Dispatched", value: dispatchedOrders },
  { label: "Delivered", value: deliveredOrders }
  ];
  
const monthlyRevenueData = useMemo(() => {
  const today = new Date();

  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(
      today.getFullYear(),
      today.getMonth() - (5 - index),
      1
    );

    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: date.toLocaleDateString("en-IN", {
        month: "short",
        year: "2-digit"
      }),
      revenue: 0
    };
  });

  orders.forEach((order) => {
    const dateValue = order.order_date || order.created_at;

    if (!dateValue) return;

    const orderDate = new Date(
      `${String(dateValue).slice(0, 10)}T00:00:00`
    );

    if (Number.isNaN(orderDate.getTime())) return;

    const key = `${orderDate.getFullYear()}-${orderDate.getMonth()}`;
    const month = months.find((item) => item.key === key);

    if (month) {
      month.revenue += Number(order.amount || 0);
    }
  });

  return months;
}, [orders]);

const maxMonthlyRevenue = Math.max(
  ...monthlyRevenueData.map((item) => item.revenue),
  1
);


  const maxStatusCount = Math.max(
  ...statusChartData.map((item) => item.value),
     1
   );
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
  const headers = [
    "Order Date",
    "Customer",
    "Product",
    "Quantity",
    "Amount",
    "Status"
  ];

  const formatDate = (value) => {
    if (!value) return "";

    const date = new Date(
      `${String(value).slice(0, 10)}T00:00:00`
    );

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const rows = orders.map((o) => [
    formatDate(o.order_date || o.created_at),
    o.customer_name || o.customer || "",
    o.product_name || o.product || "",
    o.quantity ?? "",
    o.amount ?? "",
    o.status || ""
  ]);

  const csv = [headers, ...rows]
    .map((row) =>
      row.map((value) =>
        `"${String(value).replace(/"/g, '""')}"`
      ).join(",")
    )
    .join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = "orderflow-orders.csv";

  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

function exportProductsCSV() {
  console.log("Products data:", products);
  console.log("Filtered products:", filteredProducts);

  const headers = [
    "Product Name",
    "SKU",
    "Unit",
    "Price",
    "Stock Quantity"
  ];

  const rows = products.map((p) => [
    p.name ?? "",
    p.sku ?? "",
    p.unit ?? "",
    p.price ?? "",
    p.stock_quantity ?? ""
  ]);

  if (rows.length === 0) {
    alert("No products available to export.");
    return;
  }

  const csv = [headers, ...rows]
    .map((row) =>
      row.map((v) =>
        `"${String(v).replace(/"/g, '""')}"`
      ).join(",")
    )
    .join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = "orderflow-products.csv";

  document.body.appendChild(a);
  a.click();
  a.remove();

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
  { name: "Business Snapshot", icon: TrendingUp },
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

<button
  className="gold-button"
  onClick={loadAll}
  disabled={loading}
>
  <RefreshCw
    size={16}
    className={loading ? "refresh-spinning" : ""}
  />
  {loading ? "Refreshing..." : "Refresh Data"}
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
    note="Awaiting confirmation"
  />

  <StatCard
    icon={CheckCircle}
    label="Confirmed Orders"
    value={confirmedOrders}
    note="Orders confirmed"
  />

  <StatCard
    icon={Package}
    label="Dispatched Orders"
    value={dispatchedOrders}
    note="Orders dispatched"
  />

  <StatCard
    icon={CheckCircle}
    label="Delivered Orders"
    value={deliveredOrders}
    note="Successfully delivered"
  />
</div>

         
<div className="dashboard-grid">

  {/* Recent Orders - Full Width */}
  <div className="panel recent-orders-full-width">
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

    <OrdersTable
    data={orders.slice(0, 6)}
    onEdit={openEditOrder}
    onDelete={deleteOrder}
    />
  </div>

  {/* Monthly Revenue Graph - Full Width */}
  <div className="panel recent-orders-full-width">
    <div className="panel-heading">
      <div>
        <p className="eyebrow">REVENUE ANALYTICS</p>
        <h3>Monthly Revenue Trend</h3>
      </div>

      <TrendingUp className="gold-icon" />
    </div>

    <div className="revenue-chart">
      {monthlyRevenueData.map((item) => (
        <div className="revenue-column" key={item.key}>
          <strong>
            ₹{item.revenue.toLocaleString("en-IN")}
          </strong>

          <div className="revenue-bar-area">
            <div
              className="revenue-bar"
              style={{
                height: `${(item.revenue / maxMonthlyRevenue) * 100}%`
              }}
            />
          </div>

          <span>{item.label}</span>
        </div>
      ))}
    </div>
  </div>

</div>
</>
)}

{activePage === "Business Snapshot" && (
  <div className="business-snapshot-page">

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
        note="Total order amount"
      />

      <StatCard
        icon={Users}
        label="Customers"
        value={customers.length}
        note="Registered customers"
      />

      <StatCard
        icon={Package}
        label="Products"
        value={products.length}
        note="Available products"
      />
    </div>

    <div className="panel" style={{ marginTop: 24 }}>
      <div className="panel-heading">
        <div>
          <p className="eyebrow">ORDER PERFORMANCE</p>
          <h3>Order Status Overview</h3>
        </div>
        <TrendingUp className="gold-icon" />
      </div>

     <div className="snapshot-chart">
  {statusChartData.map((item) => (
    <div className="chart-row" key={item.label}>
      <div className="chart-label">
        <span>{item.label}</span>
        <strong>{item.value}</strong>
      </div>

      <div className="chart-track">
        <div
          className="chart-bar"
          style={{
            width: `${(item.value / maxStatusCount) * 100}%`
          }}
        />
      </div>
    </div>
  ))}
</div>
    </div>

    <div className="panel" style={{ marginTop: 24 }}>
      <div className="panel-heading">
        <div>
          <p className="eyebrow">BUSINESS ACTIVITY</p>
          <h3>Recent Orders</h3>
        </div>

        <button
          className="text-button"
          onClick={() => setActivePage("Orders")}
        >
          View all →
        </button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Order Date</th>
              <th>Customer</th>
              <th>Product</th>
              <th>Quantity</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {orders.slice(0, 8).map((order) => (
              <tr key={order.id}>
                <td>
                  {order.order_date
                    ? new Date(
                        order.order_date + "T00:00:00"
                      ).toLocaleDateString("en-IN")
                    : "—"}
                </td>

                <td>
                  {order.customer_name || "—"}
                </td>

                <td>
                  {order.product_name || "—"}
                </td>

                <td>{order.quantity ?? "—"}</td>

                <td>
                  ₹{Number(order.amount || 0).toLocaleString("en-IN")}
                </td>

                <td>
                  <span className={`status-badge ${String(
                    order.status || "pending"
                  ).toLowerCase()}`}>
                    {order.status || "Pending"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {orders.length === 0 && <EmptyState />}
      </div>
    </div>

  </div>
)}

          {activePage === "Orders" && (
            <div className="panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">ORDER MANAGEMENT</p>
                  <h3>All Orders</h3>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
              <button
               className="gold-button"
               onClick={openAddOrder}
               >
               <Plus size={16} /> Add Order
             </button>

             <button
               className="gold-button"
               onClick={exportCSV}
              >
               <Download size={16} /> Export CSV
             </button>
            </div>
              </div>

              <SearchBox value={search} onChange={setSearch} />
              <OrdersTable
              data={filteredOrders}
              onEdit={openEditOrder}
              onDelete={deleteOrder}
              />
            </div>
          )}

          
{activePage === "Customers" && (
  <div className="panel">
    <div className="panel-heading">
      <div>
        <p className="eyebrow">CUSTOMER DIRECTORY</p>
        <h3>All Customers ({customers.length})</h3>
      </div>

      <button
        className="gold-button"
        onClick={openAddCustomer}
      >
        <Plus size={16} /> Add Customer
      </button>
    </div>

    <div className="search-box" style={{ marginBottom: 20 }}>
      <Search size={18} />
      <input
        value={customerSearch}
        onChange={(e) => setCustomerSearch(e.target.value)}
        placeholder="Search customers by name, email or phone..."
      />
    </div>

    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Customer</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {filteredCustomers.map((c) => (
            <tr key={c.id}>
              <td>
                <strong>{c.name || c.customer_name || "—"}</strong>
              </td>
              <td>{c.email || "—"}</td>
              <td>{c.phone || "—"}</td>
              <td>
                <div style={{ display: "flex", gap: "8px" }}>
                 <button
                    className="outline-button"
                      onClick={() => openEditCustomer(c)}
                     >
                        Edit
                 </button>

                 <button
                   className="outline-button"
                    onClick={() => deleteCustomer(c)}
                   >
                      Delete
                 </button>
               </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filteredCustomers.length === 0 && <EmptyState />}
    </div>
  </div>
)}

        {activePage === "Products" && (
  <div className="panel">
    <div className="panel-heading">
      <div>
        <p className="eyebrow">PRODUCT CATALOGUE</p>
        <h3>All Products ({products.length})</h3>
      </div>

      <button className="gold-button" onClick={openAddProduct}>
        <Plus size={16} /> Add Product
      </button>

      <button className="primary-btn" onClick={exportProductsCSV}>
        <Download size={16} />
          Export CSV
      </button>
    </div>

    <div className="search-box" style={{ marginBottom: 20 }}>
      <Search size={18} />
      <input
        value={productSearch}
        onChange={(e) => setProductSearch(e.target.value)}
        placeholder="Search products by name or SKU..."
      />
    </div>

    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>PRODUCT</th>
            <th>SKU</th>
            <th>UNIT</th>
            <th>PRICE</th>
            <th>STOCK</th>
            <th>ACTIONS</th>
          </tr>
        </thead>

        <tbody>
          {filteredProducts.map((p) => (
            <tr key={p.id}>
              <td><strong>{p.name}</strong></td>
              <td>{p.sku || "—"}</td>
              <td>{p.unit || "pcs"}</td>
              <td>₹{Number(p.price || 0).toLocaleString("en-IN")}</td>
              <td>{p.stock_quantity ?? 0}</td>
              <td>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className="outline-button"
                    onClick={() => openEditProduct(p)}
                  >
                    Edit
                  </button>

                  <button
                    className="delete-btn"
                    onClick={() => deleteProduct(p)}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filteredProducts.length === 0 && (
        <EmptyState />
      )}
    </div>
  </div>
)}     
        </section>
{showOrderModal && (
  <div className="modal-overlay">
    <div className="order-modal">
      <div className="modal-heading">
        <div>
          <h2>Add New Order</h2>
          <p>Enter order details below.</p>
        </div>
        <button
          className="close-btn"
          type="button"
          onClick={() => setShowOrderModal(false)}
        >
          ×
        </button>
      </div>

      <form onSubmit={saveOrder}>
        <label>Customer Name *</label>
        <input
          value={orderForm.customer_name}
          onChange={(e) => setOrderForm({
            ...orderForm,
            customer_name: e.target.value
          })}
          placeholder="Enter customer name"
          required
        />

        <label>Product Name *</label>
        <input
          value={orderForm.product_name}
          onChange={(e) => setOrderForm({
            ...orderForm,
            product_name: e.target.value
          })}
          placeholder="Enter product name"
          required
        />

        <label>Quantity *</label>
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={orderForm.quantity}
          onChange={(e) => setOrderForm({
            ...orderForm,
            quantity: e.target.value
          })}
          required
        />

        <label>Amount (₹) *</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={orderForm.amount}
          onChange={(e) => setOrderForm({
            ...orderForm,
            amount: e.target.value
          })}
          required
        />

        <label>Order Date</label>
        <input
          type="date"
          value={orderForm.order_date}
          onChange={(e) => setOrderForm({
            ...orderForm,
            order_date: e.target.value
          })}
        />

        <label>Status</label>
        <select
          value={orderForm.status}
          onChange={(e) => setOrderForm({
            ...orderForm,
            status: e.target.value
          })}
        >
          <option>Pending</option>
          <option>Confirmed</option>
          <option>Dispatched</option>
          <option>Delivered</option>
        </select>

        <button
          className="gold-button full-button submit-btn"
          type="submit"
          disabled={orderSaving}
        >
          {orderSaving ? "Saving..." : "Save Order"}
        </button>
      </form>
    </div>
  </div>
)}
{showCustomerModal && (
  <div className="modal-overlay">
    <div className="order-modal">
      <div className="modal-heading">
        <div>
          <h2>
            {editingCustomer ? "Edit Customer" : "Add New Customer"}
          </h2>
          <p>Enter customer details below.</p>
        </div>

        <button
          className="close-btn"
          type="button"
          onClick={() => setShowCustomerModal(false)}
        >
          ×
        </button>
      </div>

      <form onSubmit={saveCustomer}>
        <label>Customer Name *</label>
        <input
          type="text"
          value={customerForm.name}
          onChange={(e) =>
            setCustomerForm({
              ...customerForm,
              name: e.target.value
            })
          }
          placeholder="Enter customer name"
          required
        />

        <label>Email Address</label>
        <input
          type="email"
          value={customerForm.email}
          onChange={(e) =>
            setCustomerForm({
              ...customerForm,
              email: e.target.value
            })
          }
          placeholder="customer@example.com"
        />

        <label>Phone Number</label>
        <input
          type="tel"
          value={customerForm.phone}
          onChange={(e) =>
            setCustomerForm({
              ...customerForm,
              phone: e.target.value
            })
          }
          placeholder="Enter phone number"
        />

        <button
          className="gold-button full-button submit-btn"
          type="submit"
          disabled={customerSaving}
        >
          {customerSaving
            ? "Saving..."
            : editingCustomer
              ? "Update Customer"
              : "Save Customer"}
        </button>
      </form>
    </div>
  </div>
)}

        {showProductModal && (
  <div className="modal-overlay">
    <div className="order-modal">
      <div className="modal-heading">
        <div>
          <h2>{editingProduct ? "Edit Product" : "Add New Product"}</h2>
          <p>Enter your product details below.</p>
        </div>

        <button
          className="close-btn"
          onClick={() => setShowProductModal(false)}
          type="button"
        >
          ×
        </button>
      </div>

      <form onSubmit={saveProduct}>
        <label>Product Name *</label>
        <input
          type="text"
          value={productForm.name}
          onChange={(e) =>
            setProductForm({ ...productForm, name: e.target.value })
          }
          placeholder="Example: Corrugated Boxes"
          required
        />

        <label>SKU</label>
        <input
          type="text"
          value={productForm.sku}
          onChange={(e) =>
            setProductForm({ ...productForm, sku: e.target.value })
          }
          placeholder="Example: BOX-001"
        />

        <div className="form-row">
          <div>
            <label>Unit</label>
            <input
              type="text"
              value={productForm.unit}
              onChange={(e) =>
                setProductForm({ ...productForm, unit: e.target.value })
              }
              placeholder="pcs"
            />
          </div>

          <div>
            <label>Price (₹) *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={productForm.price}
              onChange={(e) =>
                setProductForm({ ...productForm, price: e.target.value })
              }
              required
            />
          </div>
        </div>

        <label>Stock Quantity *</label>
        <input
          type="number"
          min="0"
          step="1"
          value={productForm.stock_quantity}
          onChange={(e) =>
            setProductForm({
              ...productForm,
              stock_quantity: e.target.value
            })
          }
          required
        />

        <button
          className="gold-button full-button submit-btn"
          type="submit"
          disabled={productSaving}
        >
          {productSaving
            ? "Saving..."
            : editingProduct
              ? "Update Product"
              : "Save Product"}
        </button>
      </form>
    </div>
  </div>
)}
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


function OrdersTable({ data, onEdit, onDelete }) {
  const formatOrderDate = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "—";

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Order Date</th>
            <th>Customer</th>
            <th>Product</th>
            <th>Quantity</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {data.map((order) => (
            <tr key={order.id}>
              <td>
                {formatOrderDate(
                  order.order_date || order.created_at
                )}
              </td>

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
                <span className={`status-badge ${String(
                  order.status || "pending"
                ).toLowerCase()}`}>
                  {order.status || "Pending"}
                </span>
              </td>

              <td>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    className="outline-button"
                    onClick={() => onEdit(order)}
                  >
                    Edit
                  </button>

                  <button
                    className="outline-button"
                    onClick={() => onDelete(order)}
                  >
                    Delete
                  </button>
                </div>
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


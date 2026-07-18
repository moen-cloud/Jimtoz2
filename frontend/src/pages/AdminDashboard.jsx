import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { LogOut } from "lucide-react";
import Reveal from "../components/Reveal.jsx";
import Button from "../components/Button.jsx";
import ImagePlaceholder from "../components/ImagePlaceholder.jsx";
import Logo from "../components/Logo.jsx";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";

const tabs = ["Orders", "Products", "Reviews"];
const orderStatuses = ["received", "confirmed", "baking", "ready", "completed", "cancelled"];
const categories = ["bread", "pastries", "cakes", "cookies", "custom"];
const ACTIVE_STATUSES = ["received", "confirmed", "baking", "ready"];
const HISTORY_STATUSES = ["completed", "cancelled"];

const emptyProduct = {
  name: "",
  description: "",
  category: "bread",
  price: "",
  image: "",
  inStock: true,
  isFeatured: false,
  isNew: false,
  isBestSeller: false,
};

const AdminDashboard = () => {
  const { logout } = useAuth();
  const [tab, setTab] = useState("Orders");
  const [orderView, setOrderView] = useState("active"); // "active" | "history"
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [newProduct, setNewProduct] = useState(emptyProduct);
  const [priceEdits, setPriceEdits] = useState({}); // { [orderId]: string }
  const [editingId, setEditingId] = useState(null); // product currently being edited
  const [editForm, setEditForm] = useState(emptyProduct);

  const loadOrders = () => api.get("/orders").then((res) => setOrders(res.data)).catch(() => {});
  const loadProducts = () => api.get("/products").then((res) => setProducts(res.data)).catch(() => {});
  const loadReviews = () => api.get("/reviews/all").then((res) => setReviews(res.data)).catch(() => {});

  useEffect(() => {
    loadOrders();
    loadProducts();
    loadReviews();
  }, []);

  const handleStatusChange = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      toast.success("Order status updated");
      loadOrders();
    } catch {
      toast.error("Couldn't update order");
    }
  };

  const handleSavePrice = async (orderId) => {
    const value = priceEdits[orderId];
    if (value === undefined || value === "") return;
    try {
      await api.put(`/orders/${orderId}/status`, { totalPrice: Number(value) });
      toast.success("Price updated");
      loadOrders();
    } catch {
      toast.error("Couldn't update price");
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      await api.post("/products", { ...newProduct, price: Number(newProduct.price) });
      toast.success("Product added");
      setNewProduct(emptyProduct);
      loadProducts();
    } catch {
      toast.error("Couldn't add product");
    }
  };

  // Shared by both the "Add Product" form and the "Edit Product" form —
  // reads a chosen file from the user's computer and hands back a data URL.
  const readImageFile = (file, onDone) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Image is too large — please choose one under 4MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onDone(reader.result);
    reader.onerror = () => toast.error("Couldn't read that image, please try another");
    reader.readAsDataURL(file);
  };

  const handleImageSelect = (file) =>
    readImageFile(file, (dataUrl) => setNewProduct((prev) => ({ ...prev, image: dataUrl })));

  const handleDeleteProduct = async (id) => {
    try {
      await api.delete(`/products/${id}`);
      toast.success("Product removed");
      loadProducts();
    } catch {
      toast.error("Couldn't remove product");
    }
  };

  const handleToggleFlag = async (product, field) => {
    try {
      await api.put(`/products/${product._id}`, { [field]: !product[field] });
      loadProducts();
    } catch {
      toast.error("Couldn't update product");
    }
  };

  // --- Edit existing product ---
  const startEdit = (product) => {
    setEditingId(product._id);
    setEditForm({
      name: product.name || "",
      description: product.description || "",
      category: product.category || "bread",
      price: String(product.price ?? ""),
      image: product.image || "",
      inStock: product.inStock ?? true,
      isFeatured: product.isFeatured ?? false,
      isNew: product.isNew ?? false,
      isBestSeller: product.isBestSeller ?? false,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(emptyProduct);
  };

  const handleEditImageSelect = (file) =>
    readImageFile(file, (dataUrl) => setEditForm((prev) => ({ ...prev, image: dataUrl })));

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/products/${editingId}`, { ...editForm, price: Number(editForm.price) });
      toast.success("Product updated");
      cancelEdit();
      loadProducts();
    } catch {
      toast.error("Couldn't update product");
    }
  };

  const handleApproveReview = async (id) => {
    try {
      await api.put(`/reviews/${id}/approve`);
      toast.success("Review approved");
      loadReviews();
    } catch {
      toast.error("Couldn't approve review");
    }
  };

  const inputClass =
    "w-full rounded-2xl border border-mustard-200 bg-white px-4 py-2.5 text-sm text-cocoa-700 focus:outline-none focus:ring-2 focus:ring-mustard-400";

  return (
    <div className="bg-cream min-h-screen">
      {/* Minimal admin-only header — deliberately has none of the site's shopping nav */}
      <header className="bg-cocoa-700 text-cream">
        <div className="container-page flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Logo dark />
            <span className="text-xs uppercase tracking-[0.2em] text-mustard-400 border-l border-cream/20 pl-3">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-5">
            <Link to="/" className="text-sm text-cream/70 hover:text-cream">
              View site
            </Link>
            <button onClick={logout} className="flex items-center gap-1.5 text-sm text-cream/80 hover:text-mustard-400">
              <LogOut size={16} /> Log Out
            </button>
          </div>
        </div>
      </header>

      <div className="container-page py-10">
        <Reveal>
          <h1 className="text-3xl mb-8">Dashboard</h1>
        </Reveal>

        <Reveal delay={0.05} className="flex gap-2 mb-8">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-colors ${
                tab === t ? "bg-cocoa-700 text-cream" : "bg-white text-cocoa-600 shadow-card"
              }`}
            >
              {t}
            </button>
          ))}
        </Reveal>

        {tab === "Orders" && (
          <>
            <Reveal className="flex gap-2 mb-6">
              <button
                onClick={() => setOrderView("active")}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  orderView === "active" ? "bg-mustard-500 text-cocoa-800" : "bg-white text-cocoa-600 shadow-card"
                }`}
              >
                Active ({orders.filter((o) => ACTIVE_STATUSES.includes(o.status)).length})
              </button>
              <button
                onClick={() => setOrderView("history")}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  orderView === "history" ? "bg-mustard-500 text-cocoa-800" : "bg-white text-cocoa-600 shadow-card"
                }`}
              >
                History ({orders.filter((o) => HISTORY_STATUSES.includes(o.status)).length})
              </button>
            </Reveal>

            <Reveal className="space-y-4">
              {(() => {
                const visibleOrders = orders.filter((o) =>
                  orderView === "active"
                    ? ACTIVE_STATUSES.includes(o.status)
                    : HISTORY_STATUSES.includes(o.status)
                );
                if (visibleOrders.length === 0) {
                  return (
                    <p className="text-cocoa-500">
                      {orderView === "active"
                        ? "No active orders right now."
                        : "No completed or cancelled orders yet."}
                    </p>
                  );
                }
                return visibleOrders.map((order) => (
              <div key={order._id} className="bg-white rounded-3xl shadow-card p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-display text-cocoa-800">
                      #{order._id.slice(-6).toUpperCase()} — {order.guestName || "Registered user"}
                    </p>
                    <p className="text-sm text-cocoa-500">
                      {new Date(order.createdAt).toLocaleString()} · {order.paymentMethod} ·{" "}
                      {order.fulfillment?.type || "pickup"}
                      {order.customCake?.isCustom && " · Custom cake"}
                    </p>
                  </div>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order._id, e.target.value)}
                    className={inputClass + " w-auto"}
                  >
                    {orderStatuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ordered items */}
                {order.items?.length > 0 && (
                  <div className="border-t border-mustard-100 pt-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-cocoa-400 mb-2">Items</p>
                    <ul className="text-sm text-cocoa-600 space-y-1">
                      {order.items.map((item, i) => (
                        <li key={i}>
                          {item.quantity}× {item.name} — KES {(item.price * item.quantity).toLocaleString()}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Custom cake details */}
                {order.customCake?.isCustom && (
                  <div className="border-t border-mustard-100 pt-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-cocoa-400 mb-2">
                      Custom Cake Request
                    </p>
                    <ul className="text-sm text-cocoa-600 space-y-1">
                      <li>Flavor: {order.customCake.flavor}</li>
                      <li>Size: {order.customCake.size}</li>
                      <li>Tiers: {order.customCake.tiers}</li>
                      <li>Occasion: {order.customCake.occasion}</li>
                      {order.customCake.message && <li>Message: "{order.customCake.message}"</li>}
                      {order.customCake.neededBy && (
                        <li>Needed by: {new Date(order.customCake.neededBy).toLocaleDateString()}</li>
                      )}
                      <li>Contact: {order.guestEmail} · {order.guestPhone}</li>
                    </ul>
                  </div>
                )}

                {/* Editable price */}
                <div className="border-t border-mustard-100 pt-3 flex items-center gap-3">
                  <label className="text-sm font-semibold text-cocoa-700">Total (KES)</label>
                  <input
                    type="number"
                    className={inputClass + " w-32"}
                    defaultValue={order.totalPrice}
                    onChange={(e) => setPriceEdits((prev) => ({ ...prev, [order._id]: e.target.value }))}
                  />
                  <button
                    onClick={() => handleSavePrice(order._id)}
                    className="text-sm font-semibold text-mustard-600 hover:text-mustard-700"
                  >
                    Save Price
                  </button>
                  </div>
                  </div>
                ));
              })()}
            </Reveal>
          </>
        )}

        {tab === "Products" && (
          <div className="grid lg:grid-cols-3 gap-8">
            <Reveal className="lg:col-span-1">
              <form onSubmit={handleAddProduct} className="bg-white rounded-4xl shadow-card p-6 space-y-3">
                <h2 className="font-display text-lg text-cocoa-800 mb-2">Add Product</h2>

                <div className="flex items-center gap-4">
                  <ImagePlaceholder
                    src={newProduct.image}
                    alt="Product preview"
                    label="Preview"
                    className="h-20 w-20 rounded-2xl text-[10px] shrink-0"
                  />
                  <div className="flex-1 space-y-2">
                    <input
                      type="url"
                      placeholder="Paste image URL (e.g. Cloudinary)"
                      className={inputClass}
                      value={newProduct.image.startsWith("data:") ? "" : newProduct.image}
                      onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageSelect(e.target.files?.[0])}
                      className="text-xs text-cocoa-500 file:mr-3 file:rounded-full file:border-0 file:bg-mustard-500 file:px-3 file:py-1.5 file:text-cocoa-800 file:font-semibold file:cursor-pointer"
                    />
                  </div>
                </div>
                <p className="text-xs text-cocoa-400">Paste a URL, or upload a photo from your computer (under 4MB) — either works.</p>

                <input
                  required
                  placeholder="Name"
                  className={inputClass}
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                />
                <textarea
                  required
                  placeholder="Description"
                  className={inputClass}
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                />
                <select
                  className={inputClass}
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <input
                  required
                  type="number"
                  placeholder="Price (KES)"
                  className={inputClass}
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                />
                <div className="flex flex-wrap gap-4 text-sm text-cocoa-600">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newProduct.isFeatured}
                      onChange={(e) => setNewProduct({ ...newProduct, isFeatured: e.target.checked })}
                    />
                    Feature on homepage
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newProduct.isNew}
                      onChange={(e) => setNewProduct({ ...newProduct, isNew: e.target.checked })}
                    />
                    New
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newProduct.isBestSeller}
                      onChange={(e) => setNewProduct({ ...newProduct, isBestSeller: e.target.checked })}
                    />
                    Best Seller
                  </label>
                </div>
                <Button type="submit" variant="primary" className="w-full justify-center">
                  Add Product
                </Button>
              </form>
            </Reveal>

            <Reveal delay={0.1} className="lg:col-span-2 space-y-3">
              {products.map((p) =>
                editingId === p._id ? (
                  // --- Inline edit form ---
                  <form
                    key={p._id}
                    onSubmit={handleSaveEdit}
                    className="bg-white rounded-3xl shadow-card p-5 space-y-3 ring-2 ring-mustard-400"
                  >
                    <div className="flex items-center gap-4">
                      <ImagePlaceholder
                        src={editForm.image}
                        alt="Product preview"
                        label="Preview"
                        className="h-20 w-20 rounded-2xl text-[10px] shrink-0"
                      />
                      <div className="flex-1 space-y-2">
                        <input
                          type="url"
                          placeholder="Paste image URL (e.g. Cloudinary)"
                          className={inputClass}
                          value={editForm.image.startsWith("data:") ? "" : editForm.image}
                          onChange={(e) => setEditForm({ ...editForm, image: e.target.value })}
                        />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleEditImageSelect(e.target.files?.[0])}
                          className="text-xs text-cocoa-500 file:mr-3 file:rounded-full file:border-0 file:bg-mustard-500 file:px-3 file:py-1.5 file:text-cocoa-800 file:font-semibold file:cursor-pointer"
                        />
                      </div>
                    </div>

                    <input
                      required
                      placeholder="Name"
                      className={inputClass}
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                    <textarea
                      required
                      placeholder="Description"
                      className={inputClass}
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <select
                        className={inputClass}
                        value={editForm.category}
                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      >
                        {categories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <input
                        required
                        type="number"
                        placeholder="Price (KES)"
                        className={inputClass}
                        value={editForm.price}
                        onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                      />
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-cocoa-600">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editForm.inStock}
                          onChange={(e) => setEditForm({ ...editForm, inStock: e.target.checked })}
                        />
                        In stock
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editForm.isFeatured}
                          onChange={(e) => setEditForm({ ...editForm, isFeatured: e.target.checked })}
                        />
                        Feature on homepage
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editForm.isNew}
                          onChange={(e) => setEditForm({ ...editForm, isNew: e.target.checked })}
                        />
                        New
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editForm.isBestSeller}
                          onChange={(e) => setEditForm({ ...editForm, isBestSeller: e.target.checked })}
                        />
                        Best Seller
                      </label>
                    </div>

                    <div className="flex gap-3 pt-1">
                      <Button type="submit" variant="primary" className="flex-1 justify-center">
                        Save Changes
                      </Button>
                      <Button type="button" variant="ghost" onClick={cancelEdit} className="flex-1 justify-center">
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  // --- Normal row ---
                  <div
                    key={p._id}
                    className="bg-white rounded-3xl shadow-card p-4 flex items-center justify-between gap-4 flex-wrap"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <ImagePlaceholder
                        src={p.image}
                        alt={p.name}
                        label="No photo"
                        className="h-14 w-14 rounded-xl text-[9px] shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-display text-cocoa-800 truncate">{p.name}</p>
                        <p className="text-sm text-cocoa-500 capitalize">
                          {p.category} · KES {p.price?.toLocaleString()}
                          {p.isFeatured && " · On homepage"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => handleToggleFlag(p, "isNew")}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                          p.isNew ? "bg-mustard-500 text-cocoa-800" : "bg-mustard-50 text-cocoa-500"
                        }`}
                      >
                        New
                      </button>
                      <button
                        onClick={() => handleToggleFlag(p, "isBestSeller")}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                          p.isBestSeller ? "bg-cocoa-700 text-cream" : "bg-mustard-50 text-cocoa-500"
                        }`}
                      >
                        Best Seller
                      </button>
                      <button
                        onClick={() => handleToggleFlag(p, "isFeatured")}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                          p.isFeatured ? "bg-mustard-500 text-cocoa-800" : "bg-mustard-50 text-cocoa-500"
                        }`}
                      >
                        {p.isFeatured ? "On Homepage" : "Add to Homepage"}
                      </button>
                      <button
                        onClick={() => startEdit(p)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-full bg-cocoa-100 text-cocoa-700 hover:bg-cocoa-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p._id)}
                        className="text-sm font-semibold text-red-500 hover:text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )
              )}
            </Reveal>
          </div>
        )}

        {tab === "Reviews" && (
          <Reveal className="space-y-4">
            {reviews.map((r) => (
              <div key={r._id} className="bg-white rounded-3xl shadow-card p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="font-display text-cocoa-800">
                    {r.name} — {r.rating}★
                  </p>
                  <p className="text-sm text-cocoa-500">{r.comment}</p>
                </div>
                {r.approved ? (
                  <span className="text-xs font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">Approved</span>
                ) : (
                  <button
                    onClick={() => handleApproveReview(r._id)}
                    className="text-sm font-semibold text-mustard-600 hover:text-mustard-700"
                  >
                    Approve
                  </button>
                )}
              </div>
            ))}
          </Reveal>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
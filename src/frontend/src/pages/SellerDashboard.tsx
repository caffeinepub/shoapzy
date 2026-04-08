import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  Edit,
  IndianRupee,
  Package,
  Plus,
  ShoppingBag,
  Store,
  Tag,
  Trash2,
} from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { ExternalBlob, type Order, type Product } from "../types";

const CATEGORIES = [
  "Electronics",
  "Fashion",
  "Home & Kitchen",
  "Books",
  "Sports",
  "Beauty",
  "Toys",
  "Grocery",
  "Other",
];

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  approved: "bg-blue-100 text-blue-700 border-blue-200",
  shipped: "bg-purple-100 text-purple-700 border-purple-200",
  delivered: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

type TabType = "products" | "orders" | "add";

export default function SellerDashboard() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabType>("products");
  const [form, setForm] = useState({
    title: "",
    description: "",
    mrp: "",
    discountPercent: "",
    category: "Electronics",
    stock: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const principalStr = identity?.getPrincipal().toString();
  const enabled = !!actor && !!identity;

  const { data: profile } = useQuery({
    queryKey: ["profile", principalStr],
    queryFn: () => actor!.getCallerUserProfile(),
    enabled,
  });

  const { data: sellerStatus = "none" } = useQuery({
    queryKey: ["sellerStatus", principalStr],
    queryFn: () => (actor as any).getCallerSellerStatus() as Promise<string>,
    enabled,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["sellerProducts", principalStr],
    queryFn: () => actor!.getUserProducts(identity!.getPrincipal()),
    enabled,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["sellerOrders", principalStr],
    queryFn: () => actor!.getSellerOrders(identity!.getPrincipal()),
    enabled,
  });

  const isApproved =
    sellerStatus === "approved" || profile?.sellerApproved === true;

  const mrpValue = Number.parseFloat(form.mrp) || 0;
  const discountValue = Number.parseFloat(form.discountPercent) || 0;
  const sellingPrice = mrpValue > 0 ? mrpValue * (1 - discountValue / 100) : 0;

  const sellerEarnings = (orders as Order[]).reduce(
    (sum, o) => sum + Number(o.totalAmount) * 0.9,
    0,
  );

  if (!isApproved) {
    return (
      <div
        style={{ background: "#f1f3f6" }}
        className="min-h-screen flex items-center justify-center p-4"
      >
        <div className="bg-white rounded-lg shadow p-10 max-w-md w-full text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "#e8f0fe" }}
          >
            <Store className="w-8 h-8" style={{ color: "#2874f0" }} />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Not an Approved Seller
          </h2>
          {sellerStatus === "pending" ? (
            <>
              <p className="text-gray-500 mb-5 text-sm">
                Your seller registration is pending admin approval. Please wait.
              </p>
              <span className="inline-block text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-4 py-2 font-semibold">
                ⏳ Pending Review
              </span>
            </>
          ) : sellerStatus === "rejected" ? (
            <>
              <p className="text-gray-500 mb-5 text-sm">
                Your seller registration was rejected. You can re-register with
                updated info.
              </p>
              <Button
                onClick={() => navigate("/seller/register")}
                style={{ background: "#2874f0" }}
                className="text-white hover:opacity-90"
              >
                Re-register as Seller
              </Button>
            </>
          ) : (
            <>
              <p className="text-gray-500 mb-5 text-sm">
                Register and get approved before accessing your seller
                dashboard.
              </p>
              <Button
                onClick={() => navigate("/seller/register")}
                style={{ background: "#2874f0" }}
                className="text-white hover:opacity-90"
              >
                Register as Seller
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor || !identity) return;
    setSaving(true);
    try {
      let image: ExternalBlob;
      if (imageFile) {
        const bytes = new Uint8Array(await imageFile.arrayBuffer());
        image = ExternalBlob.fromBytes(bytes);
      } else {
        image = ExternalBlob.fromURL(
          "https://placehold.co/400x400?text=Product",
        );
      }
      const mrpPaise = Math.round(mrpValue * 100);
      const discount = Math.round(discountValue);
      const sellingPricePaise = Math.round(
        mrpValue * (1 - discountValue / 100) * 100,
      );
      const product: Product = {
        id: editId ?? crypto.randomUUID(),
        title: form.title,
        description: form.description,
        price: BigInt(sellingPricePaise),
        mrp: BigInt(mrpPaise),
        discountPercent: BigInt(discount),
        category: form.category,
        stock: BigInt(Number.parseInt(form.stock)),
        isActive: true,
        seller: identity.getPrincipal(),
        image,
      };
      if (editId) {
        await actor.updateProduct(product);
      } else {
        await actor.addProduct(product);
      }
      queryClient.invalidateQueries({ queryKey: ["sellerProducts"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setForm({
        title: "",
        description: "",
        mrp: "",
        discountPercent: "",
        category: "Electronics",
        stock: "",
      });
      setImageFile(null);
      setEditId(null);
      setTab("products");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!actor) return;
    await actor.deleteProduct(productId);
    queryClient.invalidateQueries({ queryKey: ["sellerProducts"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  const handleEdit = (product: Product) => {
    setForm({
      title: product.title,
      description: product.description,
      mrp: (Number(product.mrp) / 100).toString(),
      discountPercent: Number(product.discountPercent).toString(),
      category: product.category,
      stock: Number(product.stock).toString(),
    });
    setEditId(product.id);
    setTab("add");
  };

  const TABS: { key: TabType; label: string; icon: React.ReactNode }[] = [
    {
      key: "products",
      label: "My Products",
      icon: <Package className="w-4 h-4" />,
    },
    {
      key: "add",
      label: editId ? "Edit Product" : "Add Product",
      icon: <Plus className="w-4 h-4" />,
    },
    {
      key: "orders",
      label: "My Orders",
      icon: <ShoppingBag className="w-4 h-4" />,
    },
  ];

  return (
    <div style={{ background: "#f1f3f6" }} className="min-h-screen">
      {/* Blue header bar */}
      <div style={{ background: "#2874f0" }} className="px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-white text-xl font-bold">
              {profile?.shopName ?? "My Seller Hub"}
            </h1>
            <p className="text-blue-100 text-xs mt-0.5">
              {profile?.shopDescription ?? "Manage your products and orders"}
            </p>
          </div>
          <Badge className="bg-green-400 text-green-900 border-0 font-semibold px-3 py-1">
            ✓ Approved Seller
          </Badge>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            {
              label: "Total Products",
              value: (products as Product[]).length,
              icon: (
                <Package className="w-6 h-6" style={{ color: "#2874f0" }} />
              ),
              color: "#e8f0fe",
              textColor: "#2874f0",
            },
            {
              label: "Total Orders",
              value: (orders as Order[]).length,
              icon: <ShoppingBag className="w-6 h-6 text-orange-500" />,
              color: "#fff8f0",
              textColor: "#fb641b",
            },
            {
              label: "Your Earnings (90%)",
              value: `₹${(sellerEarnings / 100).toLocaleString()}`,
              icon: <IndianRupee className="w-6 h-6 text-green-600" />,
              color: "#f0fdf4",
              textColor: "#16a34a",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-lg shadow-sm p-5 flex items-center gap-4"
            >
              <div
                className="rounded-full p-3"
                style={{ background: stat.color }}
              >
                {stat.icon}
              </div>
              <div>
                <p
                  className="text-2xl font-bold"
                  style={{ color: stat.textColor }}
                >
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tab navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-4">
          <div className="flex border-b border-gray-100">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => {
                  setTab(t.key);
                  if (t.key !== "add") {
                    setEditId(null);
                    setForm({
                      title: "",
                      description: "",
                      mrp: "",
                      discountPercent: "",
                      category: "Electronics",
                      stock: "",
                    });
                  }
                }}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                  tab === t.key
                    ? "border-[#2874f0] text-[#2874f0]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
                data-ocid={`seller.tab.${t.key}`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          {/* Products Tab */}
          {tab === "products" && (
            <div className="p-5">
              {(products as Product[]).length === 0 ? (
                <div
                  className="text-center py-16"
                  data-ocid="seller.products.empty_state"
                >
                  <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 font-medium">No products yet</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Start adding products to sell on Shoapzy
                  </p>
                  <Button
                    onClick={() => setTab("add")}
                    className="mt-4 text-white"
                    style={{ background: "#2874f0" }}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add First Product
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                        <th className="pb-3 pr-4 font-semibold">Product</th>
                        <th className="pb-3 pr-4 font-semibold">Category</th>
                        <th className="pb-3 pr-4 font-semibold">MRP</th>
                        <th className="pb-3 pr-4 font-semibold">Discount</th>
                        <th className="pb-3 pr-4 font-semibold">Sell Price</th>
                        <th className="pb-3 pr-4 font-semibold">Stock</th>
                        <th className="pb-3 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {(products as Product[]).map((product, i) => (
                        <tr
                          key={product.id}
                          className="hover:bg-gray-50 transition-colors"
                          data-ocid={`seller.product.${i + 1}`}
                        >
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={product.image.getDirectURL()}
                                alt={product.title}
                                className="w-10 h-10 object-cover rounded border border-gray-100"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    "/placeholder.png";
                                }}
                              />
                              <div>
                                <p className="font-medium text-gray-800 truncate max-w-[150px]">
                                  {product.title}
                                </p>
                                <p className="text-xs text-gray-400 truncate max-w-[150px]">
                                  {product.description}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 pr-4">
                            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded font-medium">
                              {product.category}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-gray-400 line-through text-xs">
                            ₹{(Number(product.mrp) / 100).toLocaleString()}
                          </td>
                          <td className="py-3 pr-4">
                            {Number(product.discountPercent) > 0 && (
                              <span className="flex items-center gap-1 text-green-600 font-semibold text-xs">
                                <Tag className="w-3 h-3" />
                                {Number(product.discountPercent)}% off
                              </span>
                            )}
                          </td>
                          <td
                            className="py-3 pr-4 font-bold"
                            style={{ color: "#2874f0" }}
                          >
                            ₹{(Number(product.price) / 100).toLocaleString()}
                          </td>
                          <td className="py-3 pr-4">
                            <span
                              className={
                                Number(product.stock) > 0
                                  ? "text-green-600 font-medium"
                                  : "text-red-500 font-medium"
                              }
                            >
                              {Number(product.stock)}
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleEdit(product)}
                                className="p-1.5 rounded hover:bg-blue-50 text-blue-500 transition-colors"
                                aria-label="Edit product"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(product.id)}
                                className="p-1.5 rounded hover:bg-red-50 text-red-400 transition-colors"
                                aria-label="Delete product"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Add/Edit Product Tab */}
          {tab === "add" && (
            <div className="p-6">
              <h2 className="text-base font-bold text-gray-800 mb-5 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" style={{ color: "#2874f0" }} />
                {editId ? "Edit Product" : "Add New Product"}
              </h2>
              <form
                onSubmit={handleSaveProduct}
                className="max-w-2xl space-y-5"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label
                      htmlFor="p-title"
                      className="text-xs font-semibold text-gray-600 block mb-1.5 uppercase tracking-wide"
                    >
                      Product Title *
                    </label>
                    <Input
                      id="p-title"
                      value={form.title}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, title: e.target.value }))
                      }
                      required
                      placeholder="e.g. Premium Cotton T-Shirt"
                      className="border-gray-200 focus:border-[#2874f0]"
                    />
                  </div>
                  <div className="col-span-2">
                    <label
                      htmlFor="p-desc"
                      className="text-xs font-semibold text-gray-600 block mb-1.5 uppercase tracking-wide"
                    >
                      Description *
                    </label>
                    <textarea
                      id="p-desc"
                      value={form.description}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, description: e.target.value }))
                      }
                      rows={3}
                      required
                      placeholder="Describe your product..."
                      className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-[#2874f0] font-normal resize-none"
                    />
                  </div>
                </div>

                {/* Pricing section */}
                <div className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Pricing
                  </p>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <label
                        htmlFor="p-mrp"
                        className="text-xs font-semibold text-gray-600 block mb-1.5"
                      >
                        MRP (₹) *
                      </label>
                      <Input
                        id="p-mrp"
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.mrp}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, mrp: e.target.value }))
                        }
                        required
                        placeholder="e.g. 999"
                        className="border-gray-200 bg-white"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="p-discount"
                        className="text-xs font-semibold text-gray-600 block mb-1.5"
                      >
                        Discount (%) *
                      </label>
                      <Input
                        id="p-discount"
                        type="number"
                        step="1"
                        min="0"
                        max="100"
                        value={form.discountPercent}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            discountPercent: e.target.value,
                          }))
                        }
                        required
                        placeholder="e.g. 20"
                        className="border-gray-200 bg-white"
                      />
                    </div>
                  </div>
                  {mrpValue > 0 && (
                    <div
                      className="flex items-center justify-between bg-white border border-blue-100 rounded-lg px-4 py-3"
                      style={{ borderColor: "#2874f0" + "30" }}
                    >
                      <div>
                        <p className="text-xs text-gray-500">
                          Selling Price (auto-calculated)
                        </p>
                        <p
                          className="text-xl font-bold mt-0.5"
                          style={{ color: "#2874f0" }}
                        >
                          ₹
                          {sellingPrice.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                      {discountValue > 0 && (
                        <div
                          className="text-white text-sm font-bold px-3 py-1.5 rounded"
                          style={{ background: "#388e3c" }}
                        >
                          {discountValue}% OFF
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="p-stock"
                      className="text-xs font-semibold text-gray-600 block mb-1.5 uppercase tracking-wide"
                    >
                      Stock Quantity *
                    </label>
                    <Input
                      id="p-stock"
                      type="number"
                      min="0"
                      value={form.stock}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, stock: e.target.value }))
                      }
                      required
                      placeholder="e.g. 50"
                      className="border-gray-200"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="p-category"
                      className="text-xs font-semibold text-gray-600 block mb-1.5 uppercase tracking-wide"
                    >
                      Category *
                    </label>
                    <select
                      id="p-category"
                      value={form.category}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, category: e.target.value }))
                      }
                      className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 font-normal"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="p-image"
                    className="text-xs font-semibold text-gray-600 block mb-1.5 uppercase tracking-wide"
                  >
                    Product Image
                  </label>
                  <input
                    id="p-image"
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                    className="w-full text-sm text-gray-500 border border-gray-200 rounded-md px-3 py-2 file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:text-xs file:font-semibold"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="text-white px-8 font-semibold"
                    style={{ background: "#2874f0" }}
                    data-ocid="seller.add_product.submit"
                  >
                    {saving
                      ? "Saving..."
                      : editId
                        ? "Update Product"
                        : "Add Product"}
                  </Button>
                  {editId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditId(null);
                        setTab("products");
                      }}
                      className="border-gray-200"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* Orders Tab */}
          {tab === "orders" && (
            <div className="p-5">
              {(orders as Order[]).length === 0 ? (
                <div
                  className="text-center py-16"
                  data-ocid="seller.orders.empty_state"
                >
                  <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 font-medium">No orders yet</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Orders placed for your products will appear here
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                        <th className="pb-3 pr-4 font-semibold">Order ID</th>
                        <th className="pb-3 pr-4 font-semibold">Amount</th>
                        <th className="pb-3 pr-4 font-semibold">
                          Your Share (90%)
                        </th>
                        <th className="pb-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {(orders as Order[]).map((order, i) => {
                        const statusKey =
                          typeof order.status === "object"
                            ? Object.keys(order.status)[0]
                            : String(order.status);
                        const statusClass =
                          ORDER_STATUS_COLORS[statusKey] ??
                          "bg-gray-100 text-gray-600 border-gray-200";
                        return (
                          <tr
                            key={order.id}
                            className="hover:bg-gray-50 transition-colors"
                            data-ocid={`seller.order.${i + 1}`}
                          >
                            <td className="py-3 pr-4 font-mono text-xs text-gray-500">
                              #{order.id.slice(0, 12)}...
                            </td>
                            <td className="py-3 pr-4 font-bold text-gray-800">
                              ₹
                              {(
                                Number(order.totalAmount) / 100
                              ).toLocaleString()}
                            </td>
                            <td className="py-3 pr-4 font-semibold text-green-600">
                              ₹
                              {(
                                (Number(order.totalAmount) * 0.9) /
                                100
                              ).toLocaleString()}
                            </td>
                            <td className="py-3">
                              <span
                                className={`text-xs font-semibold px-2.5 py-1 rounded border ${statusClass}`}
                              >
                                {statusKey.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  Edit,
  IndianRupee,
  Layers,
  Package,
  Plus,
  ShoppingBag,
  Store,
  Tag,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  ExternalBlob,
  type Order,
  type Product,
  type ProductVariant,
  type ReturnRequest,
} from "../types";

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

const RETURN_STATUS_COLORS: Record<string, string> = {
  pending: "bg-orange-100 text-orange-700 border-orange-200",
  approved: "bg-green-100 text-green-700 border-green-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
};

type TabType = "products" | "orders" | "add";

interface OrderUpdateState {
  loading: boolean;
  error: string | null;
}

interface VariantRow {
  id: string;
  size: string;
  color: string;
  stock: string;
  price: string;
}

function emptyVariantRow(): VariantRow {
  return { id: crypto.randomUUID(), size: "", color: "", stock: "", price: "" };
}

// ── Variant Manager Panel ──────────────────────────────────────────────────
function VariantManager({
  product,
  actor,
  onClose,
}: {
  product: Product;
  actor: ReturnType<typeof useActor>["actor"];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<VariantRow[]>([emptyVariantRow()]);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Load existing variants once
  useQuery({
    queryKey: ["productVariants", product.id],
    queryFn: async () => {
      const variants = (await (actor as any).getProductVariants(
        product.id,
      )) as ProductVariant[];
      if (variants.length > 0) {
        setRows(
          variants.map((v) => ({
            id: v.id,
            size: v.size ?? "",
            color: v.color ?? "",
            stock: String(Number(v.stock)),
            price: v.price !== null ? String(v.price) : "",
          })),
        );
      }
      setLoaded(true);
      return variants;
    },
    enabled: !!actor && !loaded,
  });

  const updateRow = (id: string, field: keyof VariantRow, value: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    );
  };

  const removeRow = (id: string) => {
    setRows((prev) => {
      const next = prev.filter((r) => r.id !== id);
      return next.length === 0 ? [emptyVariantRow()] : next;
    });
  };

  const handleSave = async () => {
    if (!actor) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const variants: ProductVariant[] = rows
        .filter((r) => r.size.trim() || r.color.trim() || r.stock.trim())
        .map((r) => ({
          id: r.id,
          size: r.size.trim() || null,
          color: r.color.trim() || null,
          stock: BigInt(Number.parseInt(r.stock) || 0),
          price: r.price.trim() ? Number.parseFloat(r.price) : null,
        }));
      await (actor as any).setProductVariants(product.id, variants);
      queryClient.invalidateQueries({
        queryKey: ["productVariants", product.id],
      });
      setSaveMsg("Variants saved successfully!");
      setTimeout(() => setSaveMsg(null), 3000);
    } catch (err) {
      setSaveMsg(
        err instanceof Error ? err.message : "Failed to save variants",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="border-t border-blue-100 bg-blue-50/40 px-5 py-4"
      data-ocid="seller.variant_manager"
    >
      <div className="flex items-center justify-between mb-3">
        <h4
          className="text-sm font-bold flex items-center gap-2"
          style={{ color: "#2874f0" }}
        >
          <Layers className="w-4 h-4" />
          Manage Variants — {product.title}
        </h4>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded hover:bg-blue-100 text-blue-400 transition-colors"
          aria-label="Close variants"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Existing variants table */}
      <div className="overflow-x-auto rounded-lg border border-blue-100 bg-white mb-3">
        <table className="w-full text-xs">
          <thead>
            <tr
              className="text-left border-b border-blue-100"
              style={{ background: "#eef3ff" }}
            >
              <th className="px-3 py-2 font-semibold text-blue-700 w-[22%]">
                Size
              </th>
              <th className="px-3 py-2 font-semibold text-blue-700 w-[22%]">
                Color
              </th>
              <th className="px-3 py-2 font-semibold text-blue-700 w-[18%]">
                Stock
              </th>
              <th className="px-3 py-2 font-semibold text-blue-700 w-[28%]">
                Price Override (₹)
              </th>
              <th className="px-3 py-2 font-semibold text-blue-700 w-[10%]" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-blue-50/30 transition-colors"
              >
                <td className="px-2 py-1.5">
                  <Input
                    value={row.size}
                    onChange={(e) => updateRow(row.id, "size", e.target.value)}
                    placeholder="S / M / L / XL"
                    className="h-7 text-xs border-gray-200 min-w-0"
                    data-ocid="seller.variant.size_input"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <Input
                    value={row.color}
                    onChange={(e) => updateRow(row.id, "color", e.target.value)}
                    placeholder="Red / Blue"
                    className="h-7 text-xs border-gray-200 min-w-0"
                    data-ocid="seller.variant.color_input"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <Input
                    type="number"
                    min="0"
                    value={row.stock}
                    onChange={(e) => updateRow(row.id, "stock", e.target.value)}
                    placeholder="0"
                    className="h-7 text-xs border-gray-200 min-w-0"
                    data-ocid="seller.variant.stock_input"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.price}
                    onChange={(e) => updateRow(row.id, "price", e.target.value)}
                    placeholder="Leave blank to use product price"
                    className="h-7 text-xs border-gray-200 min-w-0"
                    data-ocid="seller.variant.price_input"
                  />
                </td>
                <td className="px-2 py-1.5 text-center">
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="p-1 rounded hover:bg-red-50 text-red-400 transition-colors"
                    aria-label="Remove variant"
                    data-ocid="seller.variant.remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => setRows((prev) => [...prev, emptyVariantRow()])}
          className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors px-3 py-1.5 border border-blue-200 rounded bg-white hover:bg-blue-50"
          data-ocid="seller.variant.add_row"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Variant
        </button>
        <Button
          size="sm"
          disabled={saving}
          onClick={handleSave}
          className="text-white text-xs font-semibold h-8 px-4"
          style={{ background: "#2874f0" }}
          data-ocid="seller.variant.save"
        >
          {saving ? "Saving..." : "Save Variants"}
        </Button>
        {saveMsg && (
          <span
            className={`text-xs font-medium px-2 py-1 rounded ${
              saveMsg.includes("success")
                ? "text-green-700 bg-green-50"
                : "text-red-600 bg-red-50"
            }`}
          >
            {saveMsg}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
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
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [orderUpdateState, setOrderUpdateState] = useState<
    Record<string, OrderUpdateState>
  >({});
  // Track which product's variant panel is open
  const [openVariantProductId, setOpenVariantProductId] = useState<
    string | null
  >(null);

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

  const { data: returnRequests = {} } = useQuery({
    queryKey: [
      "sellerReturnRequests",
      principalStr,
      (orders as Order[]).length,
    ],
    queryFn: async () => {
      if (!actor || !(orders as Order[]).length) return {};
      const results: Record<string, ReturnRequest | null> = {};
      await Promise.all(
        (orders as Order[]).map(async (order) => {
          try {
            const req = (await (actor as any).getReturnRequestByOrder(
              order.id,
            )) as ReturnRequest | null;
            results[order.id] = req;
          } catch {
            results[order.id] = null;
          }
        }),
      );
      return results;
    },
    enabled: enabled && (orders as Order[]).length > 0,
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

  const handleUpdateOrderStatus = async (
    orderId: string,
    newStatus: string,
  ) => {
    if (!actor) return;
    setOrderUpdateState((prev) => ({
      ...prev,
      [orderId]: { loading: true, error: null },
    }));
    try {
      await (actor as any).updateSellerOrderStatus(orderId, newStatus);
      await queryClient.invalidateQueries({
        queryKey: ["sellerOrders", principalStr],
      });
      setOrderUpdateState((prev) => ({
        ...prev,
        [orderId]: { loading: false, error: null },
      }));
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to update order status";
      setOrderUpdateState((prev) => ({
        ...prev,
        [orderId]: { loading: false, error: msg },
      }));
    }
  };

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
    if (!isApproved) {
      setSaveError(
        "Your seller account is pending approval. You cannot add products yet.",
      );
      return;
    }
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
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
      // Preserve existing variants when editing; default to empty array for new products
      const existingVariants = editId
        ? ((products as Product[]).find((p) => p.id === editId)?.variants ?? [])
        : [];
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
        variants: existingVariants,
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
      setSaveSuccess(true);
      setTab("products");
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : "Failed to save product. Please try again.";
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!actor) return;
    await actor.deleteProduct(productId);
    queryClient.invalidateQueries({ queryKey: ["sellerProducts"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
    if (openVariantProductId === productId) setOpenVariantProductId(null);
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
                    <tbody>
                      {(products as Product[]).map((product, i) => (
                        <>
                          <tr
                            key={product.id}
                            className="hover:bg-gray-50 transition-colors border-b border-gray-50"
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
                              <div className="flex gap-1 items-center">
                                {/* Manage Variants toggle */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    setOpenVariantProductId((prev) =>
                                      prev === product.id ? null : product.id,
                                    )
                                  }
                                  title="Manage Variants"
                                  className={`p-1.5 rounded transition-colors flex items-center gap-1 text-xs font-semibold ${
                                    openVariantProductId === product.id
                                      ? "bg-blue-100 text-blue-700"
                                      : "hover:bg-blue-50 text-blue-400"
                                  }`}
                                  data-ocid={`seller.product.${i + 1}.variants_toggle`}
                                >
                                  <Layers className="w-3.5 h-3.5" />
                                  {openVariantProductId === product.id ? (
                                    <ChevronUp className="w-3 h-3" />
                                  ) : (
                                    <ChevronDown className="w-3 h-3" />
                                  )}
                                </button>
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

                          {/* Inline Variant Manager panel */}
                          {openVariantProductId === product.id && actor && (
                            <tr key={`${product.id}-variants`}>
                              <td colSpan={7} className="p-0">
                                <VariantManager
                                  product={product}
                                  actor={actor}
                                  onClose={() => setOpenVariantProductId(null)}
                                />
                              </td>
                            </tr>
                          )}
                        </>
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
                        setForm((f) => ({
                          ...f,
                          description: e.target.value,
                        }))
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

                <div className="flex gap-3 pt-2 flex-col">
                  {saveError && (
                    <div
                      className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3"
                      data-ocid="seller.add_product.error"
                    >
                      <span className="font-semibold shrink-0">Error:</span>
                      <span>{saveError}</span>
                    </div>
                  )}
                  {saveSuccess && (
                    <div
                      className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 font-medium"
                      data-ocid="seller.add_product.success"
                    >
                      ✓ Product saved successfully!
                    </div>
                  )}
                  <div className="flex gap-3">
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
                <div className="space-y-3">
                  {(orders as Order[]).map((order, i) => {
                    const statusKey =
                      typeof order.status === "object"
                        ? Object.keys(order.status)[0]
                        : String(order.status);
                    const statusClass =
                      ORDER_STATUS_COLORS[statusKey] ??
                      "bg-gray-100 text-gray-600 border-gray-200";
                    const updateState = orderUpdateState[order.id] ?? {
                      loading: false,
                      error: null,
                    };
                    const returnReq = (
                      returnRequests as Record<string, ReturnRequest | null>
                    )[order.id];

                    return (
                      <div
                        key={order.id}
                        className="bg-white border border-gray-100 rounded-lg p-4 hover:shadow-sm transition-shadow"
                        data-ocid={`seller.order.${i + 1}`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="min-w-0">
                              <p className="font-mono text-xs text-gray-400">
                                #{order.id.slice(0, 12)}...
                              </p>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="font-bold text-gray-800 text-sm">
                                  ₹
                                  {(
                                    Number(order.totalAmount) / 100
                                  ).toLocaleString()}
                                </span>
                                <span className="text-xs text-green-600 font-semibold">
                                  Your share: ₹
                                  {(
                                    (Number(order.totalAmount) * 0.9) /
                                    100
                                  ).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <span
                              className={`text-xs font-semibold px-2.5 py-1 rounded border ${statusClass}`}
                            >
                              {statusKey.toUpperCase()}
                            </span>

                            {returnReq && (
                              <span
                                className={`text-xs font-semibold px-2.5 py-1 rounded border ${
                                  RETURN_STATUS_COLORS[returnReq.status] ??
                                  "bg-gray-100 text-gray-600 border-gray-200"
                                }`}
                                data-ocid={`seller.order.${i + 1}.return_badge`}
                              >
                                Return:{" "}
                                {returnReq.status.charAt(0).toUpperCase() +
                                  returnReq.status.slice(1)}
                              </span>
                            )}

                            {statusKey === "approved" && (
                              <Button
                                size="sm"
                                disabled={updateState.loading}
                                onClick={() =>
                                  handleUpdateOrderStatus(order.id, "shipped")
                                }
                                className="text-white text-xs h-8 px-3 font-semibold flex items-center gap-1.5"
                                style={{ background: "#7c3aed" }}
                                data-ocid={`seller.order.${i + 1}.mark_shipped`}
                              >
                                <Truck className="w-3.5 h-3.5" />
                                {updateState.loading
                                  ? "Updating..."
                                  : "Mark as Shipped"}
                              </Button>
                            )}
                            {statusKey === "shipped" && (
                              <Button
                                size="sm"
                                disabled={updateState.loading}
                                onClick={() =>
                                  handleUpdateOrderStatus(order.id, "delivered")
                                }
                                className="text-white text-xs h-8 px-3 font-semibold flex items-center gap-1.5"
                                style={{ background: "#16a34a" }}
                                data-ocid={`seller.order.${i + 1}.mark_delivered`}
                              >
                                <Package className="w-3.5 h-3.5" />
                                {updateState.loading
                                  ? "Updating..."
                                  : "Mark as Delivered"}
                              </Button>
                            )}

                            {updateState.error && (
                              <p
                                className="text-xs text-red-500 text-right max-w-[200px]"
                                data-ocid={`seller.order.${i + 1}.error`}
                              >
                                {updateState.error}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

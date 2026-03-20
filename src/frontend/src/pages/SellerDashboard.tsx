import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Package, Plus, Store, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ExternalBlob, type Order, type Product } from "../backend";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

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

export default function SellerDashboard() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"products" | "orders" | "add">("products");
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "Electronics",
    stock: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: profile } = useQuery({
    queryKey: ["profile", identity?.getPrincipal().toString()],
    queryFn: () => actor!.getCallerUserProfile(),
    enabled: !!actor && !!identity,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["sellerProducts", identity?.getPrincipal().toString()],
    queryFn: () => actor!.getUserProducts(identity!.getPrincipal()),
    enabled: !!actor && !!identity,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["sellerOrders", identity?.getPrincipal().toString()],
    queryFn: () => actor!.getSellerOrders(identity!.getPrincipal()),
    enabled: !!actor && !!identity,
  });

  if (!profile?.sellerApproved)
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <Store className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h2 className="text-2xl font-bold mb-2">Not an Approved Seller</h2>
        <p className="text-gray-500 mb-4">
          You need to register and get approved first.
        </p>
        <Button
          onClick={() => navigate("/seller/register")}
          className="bg-orange-500 hover:bg-orange-600"
        >
          Register as Seller
        </Button>
      </div>
    );

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
      const product: Product = {
        id: editId ?? crypto.randomUUID(),
        title: form.title,
        description: form.description,
        price: BigInt(Math.round(Number.parseFloat(form.price) * 100)),
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
        price: "",
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
      price: (Number(product.price) / 100).toString(),
      category: product.category,
      stock: Number(product.stock).toString(),
    });
    setEditId(product.id);
    setTab("add");
  };

  const sellerEarnings = (orders as Order[]).reduce(
    (sum, o) => sum + Number(o.totalAmount) * 0.9,
    0,
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {profile.shopName ?? "My Shop"}
          </h1>
          <p className="text-gray-500 text-sm">{profile.shopDescription}</p>
        </div>
        <Badge className="bg-green-100 text-green-700">Approved Seller</Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-2xl font-bold text-orange-500">
            {(products as Product[]).length}
          </p>
          <p className="text-sm text-gray-500">Products</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-2xl font-bold text-blue-500">
            {(orders as Order[]).length}
          </p>
          <p className="text-sm text-gray-500">Orders</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-2xl font-bold text-green-500">
            ₹{(sellerEarnings / 100).toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">Earnings (90%)</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(["products", "orders", "add"] as const).map((t) => (
          <Button
            key={t}
            variant={tab === t ? "default" : "outline"}
            size="sm"
            className={tab === t ? "bg-orange-500 hover:bg-orange-600" : ""}
            onClick={() => {
              setTab(t);
              if (t !== "add") {
                setEditId(null);
                setForm({
                  title: "",
                  description: "",
                  price: "",
                  category: "Electronics",
                  stock: "",
                });
              }
            }}
          >
            {t === "add"
              ? editId
                ? "Edit Product"
                : "Add Product"
              : t.charAt(0).toUpperCase() + t.slice(1)}
          </Button>
        ))}
      </div>

      {tab === "products" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(products as Product[]).length === 0 ? (
            <div className="col-span-2 text-center py-12 text-gray-400">
              No products yet. Add your first product!
            </div>
          ) : (
            (products as Product[]).map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl shadow p-4 flex gap-4"
              >
                <img
                  src={product.image.getDirectURL()}
                  alt={product.title}
                  className="w-20 h-20 object-cover rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder.png";
                  }}
                />
                <div className="flex-1">
                  <p className="font-semibold">{product.title}</p>
                  <p className="text-orange-500 font-bold">
                    ₹{(Number(product.price) / 100).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">
                    Stock: {Number(product.stock)}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(product)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => handleDelete(product.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "orders" && (
        <div className="space-y-3">
          {(orders as Order[]).length === 0 ? (
            <div className="text-center py-12 text-gray-400">No orders yet</div>
          ) : (
            (orders as Order[]).map((order) => (
              <div key={order.id} className="bg-white rounded-xl shadow p-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">
                    #{order.id.slice(0, 8)}
                  </p>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-orange-100 text-orange-700">
                    {order.status.toUpperCase()}
                  </span>
                </div>
                <p className="font-bold text-orange-500 mt-1">
                  ₹{(Number(order.totalAmount) / 100).toLocaleString()}
                </p>
                <p className="text-xs text-gray-400">
                  Your share (90%): ₹
                  {((Number(order.totalAmount) * 0.9) / 100).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "add" && (
        <form
          onSubmit={handleSaveProduct}
          className="bg-white rounded-xl shadow p-6 space-y-4 max-w-lg"
        >
          <h2 className="text-lg font-bold">
            {editId ? "Edit Product" : "Add New Product"}
          </h2>
          <div>
            {/* biome-ignore lint/a11y/noLabelWithoutControl: label wraps input */}
            <label className="text-sm font-medium block mb-1">
              Product Title *
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                required
                className="mt-1"
              />
            </label>
          </div>
          <div>
            {/* biome-ignore lint/a11y/noLabelWithoutControl: label wraps textarea */}
            <label className="text-sm font-medium block mb-1">
              Description *
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={3}
                required
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 mt-1 font-normal"
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              {/* biome-ignore lint/a11y/noLabelWithoutControl: label wraps input */}
              <label className="text-sm font-medium block mb-1">
                Price (₹) *
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, price: e.target.value }))
                  }
                  required
                  className="mt-1"
                />
              </label>
            </div>
            <div>
              {/* biome-ignore lint/a11y/noLabelWithoutControl: label wraps input */}
              <label className="text-sm font-medium block mb-1">
                Stock *
                <Input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, stock: e.target.value }))
                  }
                  required
                  className="mt-1"
                />
              </label>
            </div>
          </div>
          <div>
            {/* biome-ignore lint/a11y/noLabelWithoutControl: label wraps select */}
            <label className="text-sm font-medium block mb-1">
              Category *
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 mt-1 font-normal"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div>
            {/* biome-ignore lint/a11y/noLabelWithoutControl: label wraps file input */}
            <label className="text-sm font-medium block mb-1">
              Product Image
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 mt-1"
              />
            </label>
          </div>
          <Button
            type="submit"
            disabled={saving}
            className="w-full bg-orange-500 hover:bg-orange-600"
          >
            {saving ? "Saving..." : editId ? "Update Product" : "Add Product"}
          </Button>
        </form>
      )}
    </div>
  );
}

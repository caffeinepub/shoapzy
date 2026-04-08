import type { Principal } from "@icp-sdk/core/principal";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  IndianRupee,
  Package,
  ShoppingBag,
  Store,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  type Order,
  OrderStatus,
  type Product,
  type SellerRegistration,
} from "../types";

interface SellerInfo {
  principal: Principal;
  shopDescription?: string;
  shopName: string;
  status: string;
}

import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const ORDER_STATUSES = [
  OrderStatus.pending,
  OrderStatus.approved,
  OrderStatus.shipped,
  OrderStatus.delivered,
  OrderStatus.cancelled,
];

const getStatusKey = (s: unknown): string => {
  if (typeof s === "string") return s;
  if (s && typeof s === "object") return Object.keys(s)[0] ?? "";
  return String(s);
};

const STATUS_BADGE: Record<string, string> = {
  approved: "bg-green-100 text-green-700 border border-green-200",
  rejected: "bg-red-100 text-red-700 border border-red-200",
  pending: "bg-yellow-100 text-yellow-700 border border-yellow-200",
};

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  approved: "bg-blue-50 text-blue-700 border-blue-200",
  shipped: "bg-purple-50 text-purple-700 border-purple-200",
  delivered: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

function SellerProductsRow({
  seller,
  actor,
}: { seller: SellerInfo; actor: ReturnType<typeof useActor>["actor"] }) {
  const [expanded, setExpanded] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (!expanded && !fetched) {
      setLoading(true);
      try {
        const result = await (actor as any).getSellerProducts(seller.principal);
        setProducts(result as Product[]);
        setFetched(true);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    setExpanded((v) => !v);
  };

  const statusClass = STATUS_BADGE[seller.status] ?? STATUS_BADGE.pending;

  return (
    <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "#e8f0fe" }}
          >
            <Store className="w-4 h-4" style={{ color: "#2874f0" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800 text-sm truncate">
              {seller.shopName}
            </p>
            {seller.shopDescription && (
              <p className="text-xs text-gray-400 truncate">
                {seller.shopDescription}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded ${statusClass}`}
          >
            {seller.status.charAt(0).toUpperCase() + seller.status.slice(1)}
          </span>
          <button
            type="button"
            onClick={handleToggle}
            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded transition-colors"
            style={{ color: "#2874f0", background: "#e8f0fe" }}
            data-ocid="allsellers.toggle"
          >
            <Package className="w-3.5 h-3.5" />
            Products
            {expanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
          {loading ? (
            <p
              className="text-sm text-gray-400 text-center py-4"
              data-ocid="allsellers.loading_state"
            >
              Loading products...
            </p>
          ) : products.length === 0 ? (
            <p
              className="text-sm text-gray-400 text-center py-4"
              data-ocid="allsellers.empty_state"
            >
              No products listed yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-200">
                    <th className="pb-2 pr-3 font-semibold">Product</th>
                    <th className="pb-2 pr-3 font-semibold">Category</th>
                    <th className="pb-2 pr-3 font-semibold">MRP</th>
                    <th className="pb-2 pr-3 font-semibold">Discount</th>
                    <th className="pb-2 pr-3 font-semibold">Sell Price</th>
                    <th className="pb-2 font-semibold">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((p, i) => {
                    const mrp = Number(p.mrp) / 100;
                    const discount = Number(p.discountPercent);
                    const sellPrice = Number(p.price) / 100;
                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-white transition-colors"
                        data-ocid={`allsellers.item.${i + 1}`}
                      >
                        <td className="py-2 pr-3">
                          <p className="font-medium text-gray-700 truncate max-w-[140px]">
                            {p.title}
                          </p>
                        </td>
                        <td className="py-2 pr-3">
                          <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                            {p.category}
                          </span>
                        </td>
                        <td className="py-2 pr-3 text-gray-400 line-through">
                          {mrp > 0 ? `₹${mrp.toLocaleString()}` : "—"}
                        </td>
                        <td className="py-2 pr-3 text-green-600 font-semibold">
                          {discount > 0 ? `${discount}% off` : "—"}
                        </td>
                        <td
                          className="py-2 pr-3 font-bold"
                          style={{ color: "#2874f0" }}
                        >
                          ₹{sellPrice.toLocaleString()}
                        </td>
                        <td className="py-2">
                          <span
                            className={
                              Number(p.stock) > 0
                                ? "text-green-600 font-semibold"
                                : "text-red-500 font-semibold"
                            }
                          >
                            {Number(p.stock)}
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
  );
}

type AdminTab = "sellers" | "allSellers" | "orders" | "earnings";

export default function AdminDashboard() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<AdminTab>("sellers");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const enabled = !!actor && !!identity;

  const { data: pendingSellers = [] } = useQuery({
    queryKey: ["pendingSellers"],
    queryFn: () => actor!.getPendingSellerDetails(),
    enabled,
  });

  const { data: allSellers = [], isLoading: allSellersLoading } = useQuery({
    queryKey: ["allSellers"],
    queryFn: () => (actor as any).getAllSellers(),
    enabled,
  });

  const { data: allOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["allOrders"],
    queryFn: () => actor!.getAllOrders(),
    enabled,
  });

  const { data: platformEarnings = BigInt(0) } = useQuery({
    queryKey: ["platformEarnings"],
    queryFn: () => actor!.getPlatformEarnings(),
    enabled,
  });

  const handleApproveSeller = async (principal: Principal) => {
    const key = `approve-${principal.toString()}`;
    setActionLoading(key);
    try {
      await actor!.approveSeller(principal);
      toast.success("Seller approved successfully!");
      queryClient.invalidateQueries({ queryKey: ["pendingSellers"] });
      queryClient.invalidateQueries({ queryKey: ["allSellers"] });
    } catch (e) {
      console.error(e);
      toast.error("Failed to approve seller. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectSeller = async (principal: Principal) => {
    const key = `reject-${principal.toString()}`;
    setActionLoading(key);
    try {
      await actor!.rejectSeller(principal);
      toast.success("Seller rejected.");
      queryClient.invalidateQueries({ queryKey: ["pendingSellers"] });
      queryClient.invalidateQueries({ queryKey: ["allSellers"] });
    } catch (e) {
      console.error(e);
      toast.error("Failed to reject seller. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await actor!.updateOrderStatus(orderId, status);
      queryClient.invalidateQueries({ queryKey: ["allOrders"] });
      queryClient.invalidateQueries({ queryKey: ["platformEarnings"] });
      toast.success("Order status updated!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to update order status.");
    }
  };

  const sellerList = allSellers as SellerInfo[];
  const orderList = allOrders as Order[];
  const pendingList = pendingSellers as SellerRegistration[];
  const activeSellers = sellerList.filter(
    (s) => s.status === "approved",
  ).length;
  const totalRevenue = orderList.reduce((s, o) => s + Number(o.totalAmount), 0);

  const TABS: { key: AdminTab; label: string; count?: number }[] = [
    { key: "sellers", label: "Pending Approvals", count: pendingList.length },
    { key: "allSellers", label: "All Sellers", count: sellerList.length },
    { key: "orders", label: "Orders", count: orderList.length },
    { key: "earnings", label: "Platform Earnings" },
  ];

  return (
    <div style={{ background: "#f1f3f6" }} className="min-h-screen">
      {/* Blue header */}
      <div style={{ background: "#2874f0" }} className="px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-white" />
          <div>
            <h1 className="text-white text-xl font-bold">
              Seller Hub — Admin Panel
            </h1>
            <p className="text-blue-100 text-xs mt-0.5">
              Manage sellers, orders & platform earnings
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: "Total Sellers",
              value: sellerList.length,
              icon: <Users className="w-5 h-5" style={{ color: "#2874f0" }} />,
              bg: "#e8f0fe",
              color: "#2874f0",
            },
            {
              label: "Pending Approvals",
              value: pendingList.length,
              icon: <Store className="w-5 h-5 text-yellow-600" />,
              bg: "#fef9c3",
              color: "#854d0e",
            },
            {
              label: "Total Orders",
              value: orderList.length,
              icon: <ShoppingBag className="w-5 h-5 text-orange-500" />,
              bg: "#fff7ed",
              color: "#fb641b",
            },
            {
              label: "Platform Revenue",
              value: `₹${(totalRevenue / 100).toLocaleString()}`,
              icon: <IndianRupee className="w-5 h-5 text-green-600" />,
              bg: "#f0fdf4",
              color: "#16a34a",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-3"
            >
              <div
                className="rounded-full p-2.5 shrink-0"
                style={{ background: s.bg }}
              >
                {s.icon}
              </div>
              <div>
                <p className="text-xl font-bold" style={{ color: s.color }}>
                  {s.value}
                </p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tab navigation */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-100">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-5 py-4 text-sm font-semibold border-b-2 transition-colors ${
                  tab === t.key
                    ? "border-[#2874f0] text-[#2874f0]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
                data-ocid={`admin.tab.${t.key}`}
              >
                {t.label}
                {t.count !== undefined && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                      tab === t.key
                        ? "bg-[#2874f0] text-white"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Pending Approvals Tab */}
          {tab === "sellers" && (
            <div className="p-5">
              {pendingList.length === 0 ? (
                <div
                  className="text-center py-16"
                  data-ocid="sellers.empty_state"
                >
                  <CheckCircle className="w-12 h-12 text-green-200 mx-auto mb-3" />
                  <p className="text-gray-400 font-medium">All caught up!</p>
                  <p className="text-gray-400 text-sm mt-1">
                    No pending seller registrations
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingList.map((seller, idx) => (
                    <div
                      key={seller.principal.toString()}
                      className="border border-gray-100 rounded-lg p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      data-ocid={`sellers.item.${idx + 1}`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0 mr-4">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: "#fef9c3" }}
                        >
                          <Store className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800">
                            {seller.shopName}
                          </p>
                          {seller.shopDescription && (
                            <p className="text-sm text-gray-500 truncate">
                              {seller.shopDescription}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 font-mono mt-0.5">
                            {seller.principal.toString().slice(0, 20)}...
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          className="bg-green-500 hover:bg-green-600 text-white font-semibold"
                          disabled={
                            actionLoading ===
                            `approve-${seller.principal.toString()}`
                          }
                          onClick={() => handleApproveSeller(seller.principal)}
                          data-ocid={`sellers.confirm_button.${idx + 1}`}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          {actionLoading ===
                          `approve-${seller.principal.toString()}`
                            ? "Approving..."
                            : "Approve"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-500 border-red-200 hover:bg-red-50"
                          disabled={
                            actionLoading ===
                            `reject-${seller.principal.toString()}`
                          }
                          onClick={() => handleRejectSeller(seller.principal)}
                          data-ocid={`sellers.delete_button.${idx + 1}`}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          {actionLoading ===
                          `reject-${seller.principal.toString()}`
                            ? "Rejecting..."
                            : "Reject"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* All Sellers Tab */}
          {tab === "allSellers" && (
            <div className="p-5">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Users className="w-4 h-4" />
                  <span>
                    <strong className="text-gray-800">
                      {sellerList.length}
                    </strong>{" "}
                    total sellers
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>
                    <strong className="text-gray-800">{activeSellers}</strong>{" "}
                    active
                  </span>
                </div>
              </div>
              {allSellersLoading ? (
                <div
                  className="text-center py-12 text-gray-400"
                  data-ocid="allsellers.loading_state"
                >
                  Loading sellers...
                </div>
              ) : sellerList.length === 0 ? (
                <div
                  className="text-center py-16"
                  data-ocid="allsellers.empty_state"
                >
                  <Store className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 font-medium">
                    No sellers registered yet
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sellerList.map((seller) => (
                    <SellerProductsRow
                      key={seller.principal.toString()}
                      seller={seller}
                      actor={actor}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Orders Tab */}
          {tab === "orders" && (
            <div className="p-5">
              {ordersLoading ? (
                <div
                  className="text-center py-12 text-gray-400"
                  data-ocid="orders.loading_state"
                >
                  Loading orders...
                </div>
              ) : orderList.length === 0 ? (
                <div
                  className="text-center py-16"
                  data-ocid="orders.empty_state"
                >
                  <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 font-medium">No orders yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                        <th className="pb-3 pr-4 font-semibold">Order ID</th>
                        <th className="pb-3 pr-4 font-semibold">Date</th>
                        <th className="pb-3 pr-4 font-semibold">Amount</th>
                        <th className="pb-3 pr-4 font-semibold">
                          Commission (10%)
                        </th>
                        <th className="pb-3 font-semibold">Update Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {orderList.map((order, idx) => {
                        const currentKey = getStatusKey(order.status);
                        const statusClass =
                          ORDER_STATUS_COLORS[currentKey] ??
                          "bg-gray-50 text-gray-600 border-gray-100";
                        return (
                          <tr
                            key={order.id}
                            className="hover:bg-gray-50 transition-colors"
                            data-ocid={`orders.item.${idx + 1}`}
                          >
                            <td className="py-3 pr-4">
                              <p className="font-mono text-xs text-gray-400">
                                #{order.id.slice(0, 12)}...
                              </p>
                              <span
                                className={`text-xs px-2 py-0.5 rounded border mt-1 inline-block ${statusClass}`}
                              >
                                {currentKey.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-3 pr-4 text-xs text-gray-500">
                              {new Date(
                                Number(order.timestamp),
                              ).toLocaleDateString("en-IN")}
                            </td>
                            <td className="py-3 pr-4 font-bold text-gray-800">
                              ₹
                              {(
                                Number(order.totalAmount) / 100
                              ).toLocaleString()}
                            </td>
                            <td className="py-3 pr-4 font-semibold text-purple-600">
                              ₹
                              {(
                                (Number(order.totalAmount) * 0.1) /
                                100
                              ).toLocaleString()}
                            </td>
                            <td className="py-3">
                              <div className="flex gap-1.5 flex-wrap">
                                {ORDER_STATUSES.map((status) => {
                                  const sk = getStatusKey(status);
                                  const isActive = currentKey === sk;
                                  return (
                                    <button
                                      key={sk}
                                      type="button"
                                      onClick={() =>
                                        handleUpdateStatus(order.id, status)
                                      }
                                      className={`text-xs px-2.5 py-1 rounded border font-semibold transition-colors ${
                                        isActive
                                          ? "text-white border-transparent"
                                          : "bg-white text-gray-500 border-gray-200 hover:border-[#2874f0] hover:text-[#2874f0]"
                                      }`}
                                      style={
                                        isActive
                                          ? {
                                              background: "#2874f0",
                                              borderColor: "#2874f0",
                                            }
                                          : {}
                                      }
                                    >
                                      {sk.charAt(0).toUpperCase() + sk.slice(1)}
                                    </button>
                                  );
                                })}
                              </div>
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

          {/* Platform Earnings Tab */}
          {tab === "earnings" && (
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[
                  {
                    label: "Total Platform Revenue",
                    value: `₹${(totalRevenue / 100).toLocaleString()}`,
                    icon: <TrendingUp className="w-6 h-6 text-green-600" />,
                    bg: "#f0fdf4",
                  },
                  {
                    label: "Admin Commission (10%)",
                    value: `₹${(Number(platformEarnings) / 100).toLocaleString()}`,
                    icon: (
                      <IndianRupee
                        className="w-6 h-6"
                        style={{ color: "#2874f0" }}
                      />
                    ),
                    bg: "#e8f0fe",
                  },
                  {
                    label: "Seller Payouts (90%)",
                    value: `₹${((totalRevenue * 0.9) / 100).toLocaleString()}`,
                    icon: <Store className="w-6 h-6 text-orange-500" />,
                    bg: "#fff7ed",
                  },
                ].map((card) => (
                  <div
                    key={card.label}
                    className="bg-white border border-gray-100 rounded-lg p-5 flex items-center gap-4"
                  >
                    <div
                      className="rounded-full p-3"
                      style={{ background: card.bg }}
                    >
                      {card.icon}
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-800">
                        {card.value}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {card.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {orderList.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  No order data yet
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                        <th className="pb-3 pr-4 font-semibold">Order ID</th>
                        <th className="pb-3 pr-4 font-semibold">Date</th>
                        <th className="pb-3 pr-4 font-semibold">
                          Total Amount
                        </th>
                        <th className="pb-3 pr-4 font-semibold">Admin (10%)</th>
                        <th className="pb-3 font-semibold">Seller (90%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {orderList.map((order) => {
                        const total = Number(order.totalAmount);
                        return (
                          <tr
                            key={order.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="py-3 pr-4 font-mono text-xs text-gray-400">
                              #{order.id.slice(0, 12)}...
                            </td>
                            <td className="py-3 pr-4 text-xs text-gray-500">
                              {new Date(
                                Number(order.timestamp),
                              ).toLocaleDateString("en-IN")}
                            </td>
                            <td className="py-3 pr-4 font-semibold text-gray-800">
                              ₹{(total / 100).toLocaleString()}
                            </td>
                            <td className="py-3 pr-4 font-semibold text-purple-600">
                              ₹{((total * 0.1) / 100).toLocaleString()}
                            </td>
                            <td className="py-3 font-semibold text-green-600">
                              ₹{((total * 0.9) / 100).toLocaleString()}
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

import { useQuery } from "@tanstack/react-query";
import { MapPin, Package, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { type Order, OrderStatus } from "../types";

interface DeliveryAddress {
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

function parseAddress(raw?: string): DeliveryAddress | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DeliveryAddress;
  } catch {
    return { address: raw };
  }
}

interface StatusConfig {
  label: string;
  bg: string;
  color: string;
  border: string;
  stepIndex: number;
}

const STATUS_MAP: Record<string, StatusConfig> = {
  pending: {
    label: "Order Placed",
    bg: "#fff8e1",
    color: "#f57f17",
    border: "#ffe082",
    stepIndex: 0,
  },
  approved: {
    label: "Confirmed",
    bg: "#e3f2fd",
    color: "#1565c0",
    border: "#90caf9",
    stepIndex: 1,
  },
  shipped: {
    label: "Shipped",
    bg: "#f3e5f5",
    color: "#6a1b9a",
    border: "#ce93d8",
    stepIndex: 2,
  },
  delivered: {
    label: "Delivered",
    bg: "#e8f5e9",
    color: "#2e7d32",
    border: "#a5d6a7",
    stepIndex: 3,
  },
  paid: {
    label: "Paid",
    bg: "#e0f7fa",
    color: "#00695c",
    border: "#80cbc4",
    stepIndex: 3,
  },
  cancelled: {
    label: "Cancelled",
    bg: "#ffebee",
    color: "#c62828",
    border: "#ef9a9a",
    stepIndex: -1,
  },
};

const ORDER_STEPS = ["Ordered", "Confirmed", "Shipped", "Delivered"];

function OrderTracker({ status }: { status: string }) {
  const config = STATUS_MAP[status];
  if (!config || config.stepIndex < 0) return null;
  const current = config.stepIndex;

  return (
    <div className="flex items-center gap-0 mt-4">
      {ORDER_STEPS.map((step, idx) => (
        <div key={step} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold border-2"
              style={
                idx <= current
                  ? {
                      background: "#2874f0",
                      borderColor: "#2874f0",
                      color: "#fff",
                    }
                  : {
                      background: "#fff",
                      borderColor: "#e0e0e0",
                      color: "#bbb",
                    }
              }
            >
              {idx < current ? "✓" : ""}
            </div>
            <span
              className="text-xs mt-1 font-medium"
              style={{ color: idx <= current ? "#2874f0" : "#9e9e9e" }}
            >
              {step}
            </span>
          </div>
          {idx < ORDER_STEPS.length - 1 && (
            <div
              className="flex-1 h-0.5 mb-5 mx-1"
              style={{ background: idx < current ? "#2874f0" : "#e0e0e0" }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function Orders() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders", identity?.getPrincipal().toString()],
    queryFn: () => actor!.getUserOrders(identity!.getPrincipal()),
    enabled: !!actor && !!identity,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => actor!.getProducts(),
    enabled: !!actor,
  });

  const orderList = (orders as Order[]).sort(
    (a, b) => Number(b.timestamp) - Number(a.timestamp),
  );
  const productList = products as {
    id: string;
    title: string;
    image: { getDirectURL?: () => string };
  }[];

  if (isLoading) {
    return (
      <div
        style={{ background: "#f1f3f6" }}
        className="min-h-screen flex items-center justify-center"
      >
        <p className="text-muted-foreground">Loading your orders...</p>
      </div>
    );
  }

  if (orderList.length === 0) {
    return (
      <div
        style={{ background: "#f1f3f6" }}
        className="min-h-screen flex flex-col items-center justify-center gap-4 px-4"
      >
        <div
          className="bg-card rounded-sm shadow-sm p-12 flex flex-col items-center gap-4 max-w-sm w-full text-center"
          data-ocid="orders-empty-state"
        >
          <Package className="w-20 h-20" style={{ color: "#2874f0" }} />
          <h2 className="text-xl font-semibold text-foreground">
            No orders yet
          </h2>
          <p className="text-muted-foreground text-sm">
            Looks like you haven't placed any orders. Start shopping!
          </p>
          <button
            type="button"
            onClick={() => navigate("/")}
            style={{ background: "#2874f0" }}
            className="text-white font-medium px-10 py-2 rounded-sm hover:opacity-90 transition-opacity"
            data-ocid="orders-shop-now-btn"
          >
            Shop Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#f1f3f6" }} className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* Header */}
        <div className="bg-card shadow-sm rounded-sm px-6 py-4 mb-4 flex items-center gap-3">
          <ShoppingBag className="w-5 h-5" style={{ color: "#2874f0" }} />
          <h1 className="text-lg font-semibold text-foreground">My Orders</h1>
          <span className="text-sm text-muted-foreground ml-1">
            ({orderList.length})
          </span>
        </div>

        {/* Orders List */}
        <div className="space-y-3">
          {orderList.map((order) => {
            const addr = parseAddress(order.deliveryAddress);
            const statusConfig = STATUS_MAP[order.status] ?? {
              label: order.status.toUpperCase(),
              bg: "#f5f5f5",
              color: "#616161",
              border: "#e0e0e0",
              stepIndex: 0,
            };
            const orderDate = new Date(
              Number(order.timestamp),
            ).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });

            return (
              <div
                key={order.id}
                className="bg-card shadow-sm rounded-sm overflow-hidden"
                data-ocid={`order-card-${order.id}`}
              >
                {/* Order Header */}
                <div className="px-6 py-4 border-b border-border flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-6 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        Order ID
                      </p>
                      <p className="font-mono font-medium text-foreground">
                        {order.id.slice(0, 8).toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        Date
                      </p>
                      <p className="font-medium text-foreground">{orderDate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        Total
                      </p>
                      <p className="font-bold text-foreground">
                        ₹{(Number(order.totalAmount) / 100).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        Payment
                      </p>
                      <p className="font-medium text-foreground capitalize">
                        {typeof order.paymentMethod === "object"
                          ? Object.keys(order.paymentMethod)[0]
                          : String(order.paymentMethod)}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div
                    className="px-3 py-1 rounded-sm text-xs font-semibold border"
                    style={{
                      background: statusConfig.bg,
                      color: statusConfig.color,
                      borderColor: statusConfig.border,
                    }}
                  >
                    {statusConfig.label}
                  </div>
                </div>

                {/* Order Items */}
                <div className="px-6 py-4 border-b border-border">
                  <div className="space-y-3">
                    {order.items.map((item) => {
                      const product = productList.find(
                        (p) => p.id === item.productId,
                      );
                      return (
                        <div
                          key={item.productId}
                          className="flex items-center gap-4"
                          data-ocid={`order-item-${item.productId}`}
                        >
                          <div className="w-14 h-14 bg-muted rounded-sm overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {product ? (
                              <img
                                src={
                                  product.image.getDirectURL
                                    ? product.image.getDirectURL()
                                    : String(product.image)
                                }
                                alt={product.title}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    "/placeholder.png";
                                }}
                              />
                            ) : (
                              <Package className="w-6 h-6 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground line-clamp-1">
                              {product?.title ?? item.productId}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Qty: {Number(item.quantity)} · ₹
                              {(Number(item.price) / 100).toLocaleString()} each
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-foreground flex-shrink-0">
                            ₹
                            {(
                              (Number(item.price) * Number(item.quantity)) /
                              100
                            ).toLocaleString()}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Order Tracker */}
                {order.status !== "cancelled" && (
                  <div className="px-6 pt-3 pb-1">
                    <OrderTracker status={order.status} />
                  </div>
                )}

                {/* Delivery Address */}
                {addr && (
                  <div className="px-6 py-4 flex items-start gap-2 text-sm text-muted-foreground border-t border-border">
                    <MapPin
                      className="w-4 h-4 flex-shrink-0 mt-0.5"
                      style={{ color: "#2874f0" }}
                    />
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                        Delivery Address
                      </p>
                      <p className="text-sm text-foreground">
                        {[
                          addr.name,
                          addr.address,
                          addr.city,
                          addr.state,
                          addr.pincode,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                        {addr.phone && (
                          <span className="text-muted-foreground">
                            {" "}
                            · {addr.phone}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

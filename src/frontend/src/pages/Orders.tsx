import { useQuery } from "@tanstack/react-query";
import { Package } from "lucide-react";
import { type Order, OrderStatus } from "../backend";
import { Badge } from "../components/ui/badge";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  paid: "bg-teal-100 text-teal-700",
};

export default function Orders() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders", identity?.getPrincipal().toString()],
    queryFn: () => actor!.getUserOrders(identity!.getPrincipal()),
    enabled: !!actor && !!identity,
  });

  if (isLoading)
    return <div className="text-center py-20">Loading orders...</div>;

  if ((orders as Order[]).length === 0)
    return (
      <div className="text-center py-20">
        <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <p className="text-xl text-gray-500">No orders yet</p>
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>
      <div className="space-y-4">
        {(orders as Order[]).map((order) => (
          <div key={order.id} className="bg-white rounded-xl shadow p-5">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-xs text-gray-400">
                  Order ID: {order.id.slice(0, 8)}...
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(Number(order.timestamp)).toLocaleDateString()}
                </p>
              </div>
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_COLORS[order.status] ?? "bg-gray-100"}`}
              >
                {order.status.toUpperCase()}
              </span>
            </div>
            <div className="border-t pt-3">
              <p className="text-sm text-gray-600">
                {order.items.length} item(s) • Payment:{" "}
                {order.paymentMethod.toUpperCase()}
              </p>
              <p className="text-lg font-bold text-orange-500 mt-1">
                ₹{(Number(order.totalAmount) / 100).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

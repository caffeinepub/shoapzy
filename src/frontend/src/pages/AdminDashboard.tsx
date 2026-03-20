import type { Principal } from "@icp-sdk/core/principal";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";
import { type Order, OrderStatus } from "../backend";
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

export default function AdminDashboard() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"sellers" | "orders">("sellers");

  const { data: pendingSellers = [] } = useQuery({
    queryKey: ["pendingSellers"],
    queryFn: () => actor!.getPendingSellerRegistrations(),
    enabled: !!actor && !!identity,
  });

  const { data: allOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["allOrders"],
    queryFn: () => actor!.getAllOrders(),
    enabled: !!actor && !!identity,
  });

  const { data: platformEarnings = BigInt(0) } = useQuery({
    queryKey: ["platformEarnings"],
    queryFn: () => actor!.getPlatformEarnings(),
    enabled: !!actor && !!identity,
  });

  const handleApproveSeller = async (principal: Principal) => {
    await actor!.approveSeller(principal);
    queryClient.invalidateQueries({ queryKey: ["pendingSellers"] });
  };

  const handleRejectSeller = async (principal: Principal) => {
    await actor!.rejectSeller(principal);
    queryClient.invalidateQueries({ queryKey: ["pendingSellers"] });
  };

  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    await actor!.updateOrderStatus(orderId, status);
    queryClient.invalidateQueries({ queryKey: ["allOrders"] });
    queryClient.invalidateQueries({ queryKey: ["platformEarnings"] });
  };

  const totalOrders = (allOrders as Order[]).length;
  const totalRevenue = (allOrders as Order[]).reduce(
    (s, o) => s + Number(o.totalAmount),
    0,
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <BarChart3 className="text-orange-500" /> Admin Dashboard
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-2xl font-bold text-orange-500">
            {(pendingSellers as unknown[]).length}
          </p>
          <p className="text-sm text-gray-500">Pending Sellers</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-2xl font-bold text-blue-500">{totalOrders}</p>
          <p className="text-sm text-gray-500">Total Orders</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-2xl font-bold text-green-500">
            ₹{(totalRevenue / 100).toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">Total Revenue</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-2xl font-bold text-purple-500">
            ₹{(Number(platformEarnings) / 100).toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">Platform Earnings (10%)</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={tab === "sellers" ? "default" : "outline"}
          size="sm"
          className={
            tab === "sellers" ? "bg-orange-500 hover:bg-orange-600" : ""
          }
          onClick={() => setTab("sellers")}
        >
          Pending Sellers ({(pendingSellers as unknown[]).length})
        </Button>
        <Button
          variant={tab === "orders" ? "default" : "outline"}
          size="sm"
          className={
            tab === "orders" ? "bg-orange-500 hover:bg-orange-600" : ""
          }
          onClick={() => setTab("orders")}
        >
          All Orders
        </Button>
      </div>

      {tab === "sellers" && (
        <div className="space-y-3">
          {(pendingSellers as Principal[]).length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-white rounded-xl shadow">
              No pending seller registrations
            </div>
          ) : (
            (pendingSellers as Principal[]).map((principal) => (
              <div
                key={principal.toString()}
                className="bg-white rounded-xl shadow p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-sm">
                    Principal: {principal.toString().slice(0, 20)}...
                  </p>
                  <p className="text-xs text-yellow-600">Pending Approval</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-green-500 hover:bg-green-600"
                    onClick={() => handleApproveSeller(principal)}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-500 border-red-300 hover:bg-red-50"
                    onClick={() => handleRejectSeller(principal)}
                  >
                    <XCircle className="w-4 h-4 mr-1" /> Reject
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "orders" && (
        <div className="space-y-3">
          {ordersLoading ? (
            <div>Loading orders...</div>
          ) : (allOrders as Order[]).length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-white rounded-xl shadow">
              No orders yet
            </div>
          ) : (
            (allOrders as Order[]).map((order) => (
              <div key={order.id} className="bg-white rounded-xl shadow p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-sm">
                      Order #{order.id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(Number(order.timestamp)).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-orange-500">
                      ₹{(Number(order.totalAmount) / 100).toLocaleString()}
                    </p>
                    <p className="text-xs text-purple-600">
                      Commission: ₹
                      {(
                        (Number(order.totalAmount) * 0.1) /
                        100
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap mt-3">
                  {ORDER_STATUSES.map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={order.status === status ? "default" : "outline"}
                      className={
                        order.status === status
                          ? "bg-orange-500 hover:bg-orange-600"
                          : "text-xs"
                      }
                      onClick={() => handleUpdateStatus(order.id, status)}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

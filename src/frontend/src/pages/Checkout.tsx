import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard, Truck } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  type CartItem,
  type Order,
  OrderStatus,
  type ShoppingItem,
  Variant_cod_online,
} from "../backend";
import { Button } from "../components/ui/button";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function Checkout() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "online">("cod");
  const [placing, setPlacing] = useState(false);

  const { data: cart = [] } = useQuery({
    queryKey: ["cart", identity?.getPrincipal().toString()],
    queryFn: async () => (await actor!.getCallerCart()) ?? [],
    enabled: !!actor && !!identity,
  });

  const total = (cart as CartItem[]).reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0,
  );

  const handlePlaceOrder = async () => {
    if (!actor || !identity || (cart as CartItem[]).length === 0) return;
    setPlacing(true);
    try {
      if (paymentMethod === "online") {
        const items: ShoppingItem[] = (cart as CartItem[]).map((item) => ({
          productName: item.productId,
          currency: "inr",
          quantity: item.quantity,
          priceInCents: item.price,
          productDescription: "Product",
        }));
        const url = await actor.createCheckoutSession(
          items,
          `${window.location.origin}/orders`,
          `${window.location.origin}/cart`,
        );
        window.location.href = url;
        return;
      }

      const order: Order = {
        id: crypto.randomUUID(),
        status: OrderStatus.pending,
        paymentMethod: Variant_cod_online.cod,
        totalAmount: BigInt(total),
        timestamp: BigInt(Date.now()),
        buyer: identity.getPrincipal(),
        items: cart as CartItem[],
      };
      await actor.placeOrder(order);
      await actor.clearCallerCart();
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      navigate("/orders");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      <div className="bg-white rounded-xl shadow p-6 mb-4">
        <h2 className="font-semibold text-lg mb-4">Select Payment Method</h2>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setPaymentMethod("cod")}
            className={`border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-colors ${
              paymentMethod === "cod"
                ? "border-orange-500 bg-orange-50"
                : "border-gray-200 hover:border-orange-300"
            }`}
          >
            <Truck className="w-8 h-8 text-orange-500" />
            <span className="font-medium">Cash on Delivery</span>
            <span className="text-xs text-gray-500">Pay when delivered</span>
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod("online")}
            className={`border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-colors ${
              paymentMethod === "online"
                ? "border-orange-500 bg-orange-50"
                : "border-gray-200 hover:border-orange-300"
            }`}
          >
            <CreditCard className="w-8 h-8 text-orange-500" />
            <span className="font-medium">Online Payment</span>
            <span className="text-xs text-gray-500">Card / UPI via Stripe</span>
          </button>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex justify-between text-xl font-bold mb-4">
          <span>Order Total</span>
          <span className="text-orange-500">
            ₹{(total / 100).toLocaleString()}
          </span>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          {(cart as CartItem[]).length} item(s) — Payment:{" "}
          {paymentMethod === "cod" ? "Cash on Delivery" : "Online"}
        </p>
        <Button
          onClick={handlePlaceOrder}
          disabled={placing || (cart as CartItem[]).length === 0}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white py-6 text-lg"
        >
          {placing ? "Placing Order..." : "Place Order"}
        </Button>
      </div>
    </div>
  );
}

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ShoppingBag, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { CartItem, Product } from "../backend";
import { Button } from "../components/ui/button";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function Cart() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: cart = [], isLoading } = useQuery({
    queryKey: ["cart", identity?.getPrincipal().toString()],
    queryFn: async () => (await actor!.getCallerCart()) ?? [],
    enabled: !!actor && !!identity,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => actor!.getProducts(),
    enabled: !!actor,
  });

  const total = (cart as CartItem[]).reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0,
  );

  const getProduct = (productId: string) =>
    (products as Product[]).find((p) => p.id === productId);

  const handleClear = async () => {
    await actor!.clearCallerCart();
    queryClient.invalidateQueries({ queryKey: ["cart"] });
  };

  if (isLoading)
    return <div className="text-center py-20">Loading cart...</div>;

  if ((cart as CartItem[]).length === 0)
    return (
      <div className="text-center py-20">
        <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <p className="text-xl text-gray-500">Your cart is empty</p>
        <Button
          onClick={() => navigate("/")}
          className="mt-4 bg-orange-500 hover:bg-orange-600"
        >
          Shop Now
        </Button>
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        Shopping Cart ({(cart as CartItem[]).length} items)
      </h1>
      <div className="space-y-4">
        {(cart as CartItem[]).map((item) => {
          const product = getProduct(item.productId);
          return (
            <div
              key={item.productId}
              className="bg-white rounded-xl shadow p-4 flex gap-4 items-center"
            >
              {product && (
                <img
                  src={product.image.getDirectURL()}
                  alt={product.title}
                  className="w-16 h-16 object-cover rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder.png";
                  }}
                />
              )}
              <div className="flex-1">
                <p className="font-semibold">
                  {product?.title ?? item.productId}
                </p>
                <p className="text-sm text-gray-500">
                  Qty: {Number(item.quantity)}
                </p>
              </div>
              <p className="font-bold text-orange-500">
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
      <div className="mt-6 bg-white rounded-xl shadow p-6">
        <div className="flex justify-between text-xl font-bold mb-4">
          <span>Total</span>
          <span className="text-orange-500">
            ₹{(total / 100).toLocaleString()}
          </span>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleClear} className="flex-1">
            <Trash2 className="w-4 h-4 mr-2" /> Clear Cart
          </Button>
          <Button
            onClick={() => navigate("/checkout")}
            className="flex-1 bg-orange-500 hover:bg-orange-600"
          >
            Proceed to Checkout
          </Button>
        </div>
      </div>
    </div>
  );
}

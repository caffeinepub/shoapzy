import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Minus, Plus, ShieldCheck, ShoppingBag, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import type { CartItem, Product } from "../types";

export default function Cart() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

  const cartItems = cart as CartItem[];
  const productList = products as Product[];

  const getProduct = (productId: string) =>
    productList.find((p) => p.id === productId);

  const mrpTotal = cartItems.reduce((sum, item) => {
    const product = getProduct(item.productId);
    const mrp = product?.mrp ? Number(product.mrp) : Number(item.price);
    return sum + mrp * Number(item.quantity);
  }, 0);

  const sellingTotal = cartItems.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0,
  );

  const discount = mrpTotal - sellingTotal;

  const handleRemove = async (productId: string) => {
    setUpdatingId(productId);
    try {
      await actor!.removeFromCart(productId);
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleClear = async () => {
    await actor!.clearCallerCart();
    queryClient.invalidateQueries({ queryKey: ["cart"] });
  };

  if (isLoading) {
    return (
      <div
        style={{ background: "#f1f3f6" }}
        className="min-h-screen flex items-center justify-center"
      >
        <p className="text-muted-foreground">Loading cart...</p>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div
        style={{ background: "#f1f3f6" }}
        className="min-h-screen flex flex-col items-center justify-center gap-4 px-4"
      >
        <div
          className="bg-card rounded-sm shadow-sm p-12 flex flex-col items-center gap-4 max-w-sm w-full text-center"
          data-ocid="cart-empty-state"
        >
          <ShoppingBag className="w-20 h-20" style={{ color: "#2874f0" }} />
          <h2 className="text-xl font-semibold text-foreground">
            Your cart is empty!
          </h2>
          <p className="text-muted-foreground text-sm">Add items to it now</p>
          <button
            type="button"
            onClick={() => navigate("/")}
            style={{ background: "#2874f0" }}
            className="text-white font-medium px-10 py-2 rounded-sm hover:opacity-90 transition-opacity"
            data-ocid="cart-shop-now-btn"
          >
            Shop Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#f1f3f6" }} className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex gap-4 items-start">
          {/* Left: Cart Items */}
          <div className="flex-1 min-w-0 space-y-0">
            {/* Header */}
            <div className="bg-card shadow-sm rounded-t-sm px-6 py-4 flex items-center justify-between">
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  My Cart
                </h1>
                <p className="text-sm text-muted-foreground">
                  {cartItems.length} item{cartItems.length !== 1 ? "s" : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClear}
                className="text-sm text-destructive hover:underline flex items-center gap-1"
                data-ocid="cart-clear-btn"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear All
              </button>
            </div>

            {/* Items */}
            {cartItems.map((item, idx) => {
              const product = getProduct(item.productId);
              const mrp = product?.mrp
                ? Number(product.mrp)
                : Number(item.price);
              const sellingPrice = Number(item.price);
              const discountPct =
                mrp > sellingPrice
                  ? Math.round(((mrp - sellingPrice) / mrp) * 100)
                  : 0;
              const isLast = idx === cartItems.length - 1;

              return (
                <div
                  key={item.productId}
                  className={`bg-card shadow-sm px-6 py-5 flex gap-4 ${!isLast ? "border-b border-border" : "rounded-b-sm"}`}
                  data-ocid={`cart-item-${item.productId}`}
                >
                  {/* Image */}
                  <div className="w-24 h-24 flex-shrink-0 flex items-center justify-center bg-muted rounded-sm overflow-hidden">
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
                      <ShoppingBag className="w-10 h-10 text-muted-foreground" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground line-clamp-2 text-sm">
                      {product?.title ?? item.productId}
                    </p>
                    {product?.seller && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Seller: {String(product.seller)}
                      </p>
                    )}

                    {/* Pricing */}
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-lg font-semibold text-foreground">
                        ₹{(sellingPrice / 100).toLocaleString()}
                      </span>
                      {discountPct > 0 && (
                        <>
                          <span className="text-sm text-muted-foreground line-through">
                            ₹{(mrp / 100).toLocaleString()}
                          </span>
                          <span
                            className="text-sm font-medium"
                            style={{ color: "#388e3c" }}
                          >
                            {discountPct}% off
                          </span>
                        </>
                      )}
                    </div>

                    {/* Qty + Remove */}
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center border border-border rounded-sm overflow-hidden">
                        <button
                          type="button"
                          className="w-8 h-8 flex items-center justify-center hover:bg-muted transition-colors"
                          disabled={updatingId === item.productId}
                          aria-label="Decrease quantity"
                          onClick={async () => {
                            if (Number(item.quantity) <= 1) {
                              await handleRemove(item.productId);
                            } else {
                              setUpdatingId(item.productId);
                              try {
                                await actor!.removeFromCart(item.productId);
                                const updatedItem: CartItem = {
                                  ...item,
                                  quantity: BigInt(Number(item.quantity) - 1),
                                };
                                await actor!.addToCart(updatedItem);
                                queryClient.invalidateQueries({
                                  queryKey: ["cart"],
                                });
                              } finally {
                                setUpdatingId(null);
                              }
                            }
                          }}
                        >
                          <Minus className="w-3.5 h-3.5 text-foreground" />
                        </button>
                        <span className="w-10 text-center text-sm font-medium text-foreground border-x border-border py-1">
                          {Number(item.quantity)}
                        </span>
                        <button
                          type="button"
                          className="w-8 h-8 flex items-center justify-center hover:bg-muted transition-colors"
                          disabled={updatingId === item.productId}
                          aria-label="Increase quantity"
                          onClick={async () => {
                            setUpdatingId(item.productId);
                            try {
                              await actor!.removeFromCart(item.productId);
                              const updatedItem: CartItem = {
                                ...item,
                                quantity: BigInt(Number(item.quantity) + 1),
                              };
                              await actor!.addToCart(updatedItem);
                              queryClient.invalidateQueries({
                                queryKey: ["cart"],
                              });
                            } finally {
                              setUpdatingId(null);
                            }
                          }}
                        >
                          <Plus className="w-3.5 h-3.5 text-foreground" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemove(item.productId)}
                        disabled={updatingId === item.productId}
                        className="text-sm font-medium text-muted-foreground hover:text-destructive transition-colors"
                        data-ocid={`cart-remove-${item.productId}`}
                      >
                        REMOVE
                      </button>
                    </div>
                  </div>

                  {/* Item total */}
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-foreground">
                      ₹
                      {(
                        (sellingPrice * Number(item.quantity)) /
                        100
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Place Order bottom bar */}
            <div className="bg-card shadow-sm rounded-sm mt-0 px-6 py-4 flex justify-end border-t border-border">
              <button
                type="button"
                onClick={() => navigate("/checkout")}
                style={{ background: "#fb641b" }}
                className="text-white font-medium px-16 py-3 rounded-sm hover:opacity-90 transition-opacity text-sm shadow-md"
                data-ocid="cart-place-order-btn"
              >
                PLACE ORDER
              </button>
            </div>
          </div>

          {/* Right: Price Details */}
          <div className="w-80 flex-shrink-0 space-y-3">
            <div
              className="bg-card shadow-sm rounded-sm p-5"
              data-ocid="cart-price-details"
            >
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide border-b border-border pb-3 mb-4">
                Price Details
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-foreground">
                  <span>
                    Price ({cartItems.length} item
                    {cartItems.length !== 1 ? "s" : ""})
                  </span>
                  <span>₹{(mrpTotal / 100).toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div
                    className="flex justify-between"
                    style={{ color: "#388e3c" }}
                  >
                    <span>Discount</span>
                    <span>− ₹{(discount / 100).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-foreground">
                  <span>Delivery Charges</span>
                  <span style={{ color: "#388e3c" }} className="font-medium">
                    FREE
                  </span>
                </div>
              </div>
              <div className="border-t border-border mt-4 pt-4 flex justify-between font-semibold text-base text-foreground">
                <span>Total Amount</span>
                <span>₹{(sellingTotal / 100).toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <p
                  className="mt-3 text-xs font-medium"
                  style={{ color: "#388e3c" }}
                >
                  You will save ₹{(discount / 100).toLocaleString()} on this
                  order
                </p>
              )}
            </div>

            {/* Safe Payments */}
            <div className="bg-card shadow-sm rounded-sm px-5 py-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                Safe and Secure Payments. Easy returns. 100% Authentic products.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

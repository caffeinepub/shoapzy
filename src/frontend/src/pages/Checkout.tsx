import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, CreditCard, MapPin, Truck } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  type CartItem,
  type Order,
  OrderStatus,
  type ShoppingItem,
  Variant_cod_online,
} from "../types";

interface DeliveryAddress {
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

const FIELD_CONFIG: {
  field: keyof DeliveryAddress;
  label: string;
  placeholder: string;
  type?: string;
  maxLength?: number;
  span?: boolean;
}[] = [
  { field: "name", label: "Full Name", placeholder: "Rahul Sharma" },
  {
    field: "phone",
    label: "Phone Number",
    placeholder: "9876543210",
    type: "tel",
  },
  { field: "pincode", label: "Pincode", placeholder: "560034", maxLength: 6 },
  {
    field: "address",
    label: "Address (House No, Street, Area)",
    placeholder: "123, MG Road, Koramangala",
    span: true,
  },
  { field: "city", label: "City/District/Town", placeholder: "Bengaluru" },
  { field: "state", label: "State", placeholder: "Karnataka" },
];

function StepHeader({
  number,
  label,
  active,
  done,
}: { number: number; label: string; active: boolean; done: boolean }) {
  return (
    <div
      className={`flex items-center gap-3 px-6 py-4 border-b border-border ${active ? "bg-card" : "bg-muted/30"}`}
    >
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
        style={
          done
            ? { background: "#388e3c", color: "#fff" }
            : active
              ? { background: "#2874f0", color: "#fff" }
              : { background: "#e0e0e0", color: "#666" }
        }
      >
        {done ? <CheckCircle2 className="w-4 h-4" /> : number}
      </div>
      <span
        className={`font-semibold text-sm uppercase tracking-wide ${active ? "text-foreground" : "text-muted-foreground"}`}
        style={active ? { color: "#2874f0" } : {}}
      >
        {label}
      </span>
    </div>
  );
}

export default function Checkout() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "online">("cod");
  const [placing, setPlacing] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const { data: cart = [] } = useQuery({
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
  const total = cartItems.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0,
  );

  const isAddressComplete = FIELD_CONFIG.every((f) =>
    deliveryAddress[f.field].trim(),
  );

  const handleChange =
    (field: keyof DeliveryAddress) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setDeliveryAddress((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handlePlaceOrder = async () => {
    if (!actor || !identity || cartItems.length === 0 || !isAddressComplete)
      return;
    setPlacing(true);
    try {
      const addressStr = JSON.stringify(deliveryAddress);
      if (paymentMethod === "online") {
        const items: ShoppingItem[] = cartItems.map((item) => ({
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
        items: cartItems,
        deliveryAddress: addressStr,
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
    <div style={{ background: "#f1f3f6" }} className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex gap-4 items-start">
          {/* Left: Steps */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Step 1: Delivery Address */}
            <div className="bg-card shadow-sm rounded-sm overflow-hidden">
              <StepHeader
                number={1}
                label="Delivery Address"
                active={step === 1}
                done={step > 1}
              />
              {step === 1 && (
                <div className="px-6 py-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {FIELD_CONFIG.map(
                      ({
                        field,
                        label,
                        placeholder,
                        type,
                        maxLength,
                        span,
                      }) => (
                        <div
                          key={field}
                          className={span ? "sm:col-span-2" : ""}
                        >
                          <label
                            className="block text-xs font-medium text-muted-foreground mb-1"
                            htmlFor={`addr-${field}`}
                          >
                            {label} *
                          </label>
                          <input
                            id={`addr-${field}`}
                            type={type ?? "text"}
                            value={deliveryAddress[field]}
                            onChange={handleChange(field)}
                            placeholder={placeholder}
                            maxLength={maxLength}
                            required
                            className="w-full border border-input rounded-sm px-3 py-2 text-sm text-foreground bg-background focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                            data-ocid={`checkout-addr-${field}`}
                          />
                        </div>
                      ),
                    )}
                  </div>
                  {!isAddressComplete && (
                    <p className="text-xs text-destructive mt-3">
                      * Please fill in all fields to continue
                    </p>
                  )}
                  <div className="mt-5 flex justify-end">
                    <button
                      type="button"
                      disabled={!isAddressComplete}
                      onClick={() => setStep(2)}
                      style={{ background: "#fb641b" }}
                      className="text-white font-medium px-12 py-2.5 rounded-sm hover:opacity-90 transition-opacity text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      data-ocid="checkout-continue-to-summary"
                    >
                      CONTINUE
                    </button>
                  </div>
                </div>
              )}
              {step > 1 && (
                <div className="px-6 py-3 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 inline mr-1" />
                    {deliveryAddress.name}, {deliveryAddress.address},{" "}
                    {deliveryAddress.city} - {deliveryAddress.pincode}
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs font-medium"
                    style={{ color: "#2874f0" }}
                    data-ocid="checkout-edit-address"
                  >
                    CHANGE
                  </button>
                </div>
              )}
            </div>

            {/* Step 2: Order Summary */}
            <div className="bg-card shadow-sm rounded-sm overflow-hidden">
              <StepHeader
                number={2}
                label="Order Summary"
                active={step === 2}
                done={step > 2}
              />
              {step === 2 && (
                <div className="px-6 py-5">
                  <div className="space-y-4">
                    {cartItems.map((item) => {
                      const productList = products as {
                        id: string;
                        title: string;
                        image: { getDirectURL?: () => string };
                      }[];
                      const product = productList.find(
                        (p) => p.id === item.productId,
                      );
                      return (
                        <div
                          key={item.productId}
                          className="flex items-center gap-4 pb-4 border-b border-border last:border-0 last:pb-0"
                        >
                          <div className="w-14 h-14 bg-muted rounded-sm overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {product && (
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
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground line-clamp-1">
                              {product?.title ?? item.productId}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Qty: {Number(item.quantity)}
                            </p>
                          </div>
                          <p className="font-semibold text-sm text-foreground">
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
                  <div className="mt-5 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      style={{ background: "#fb641b" }}
                      className="text-white font-medium px-12 py-2.5 rounded-sm hover:opacity-90 transition-opacity text-sm"
                      data-ocid="checkout-continue-to-payment"
                    >
                      CONTINUE
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Payment */}
            <div className="bg-card shadow-sm rounded-sm overflow-hidden">
              <StepHeader
                number={3}
                label="Payment Options"
                active={step === 3}
                done={false}
              />
              {step === 3 && (
                <div className="px-6 py-5">
                  <div className="space-y-3">
                    {/* COD Option */}
                    <label
                      className={`flex items-center gap-4 border rounded-sm p-4 cursor-pointer transition-colors ${paymentMethod === "cod" ? "border-blue-500 bg-blue-50" : "border-border hover:border-blue-300"}`}
                      data-ocid="checkout-payment-cod"
                    >
                      <input
                        type="radio"
                        name="payment"
                        value="cod"
                        checked={paymentMethod === "cod"}
                        onChange={() => setPaymentMethod("cod")}
                        className="accent-blue-600"
                      />
                      <Truck
                        className="w-6 h-6 flex-shrink-0"
                        style={{
                          color: paymentMethod === "cod" ? "#2874f0" : "#888",
                        }}
                      />
                      <div>
                        <p className="font-medium text-sm text-foreground">
                          Cash on Delivery
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Pay when your order is delivered
                        </p>
                      </div>
                    </label>

                    {/* Online Option */}
                    <label
                      className={`flex items-center gap-4 border rounded-sm p-4 cursor-pointer transition-colors ${paymentMethod === "online" ? "border-blue-500 bg-blue-50" : "border-border hover:border-blue-300"}`}
                      data-ocid="checkout-payment-online"
                    >
                      <input
                        type="radio"
                        name="payment"
                        value="online"
                        checked={paymentMethod === "online"}
                        onChange={() => setPaymentMethod("online")}
                        className="accent-blue-600"
                      />
                      <CreditCard
                        className="w-6 h-6 flex-shrink-0"
                        style={{
                          color:
                            paymentMethod === "online" ? "#2874f0" : "#888",
                        }}
                      />
                      <div>
                        <p className="font-medium text-sm text-foreground">
                          Online Payment
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Credit / Debit Card, UPI via Stripe
                        </p>
                      </div>
                    </label>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      onClick={handlePlaceOrder}
                      disabled={placing || cartItems.length === 0}
                      style={{ background: "#fb641b" }}
                      className="text-white font-medium px-12 py-3 rounded-sm hover:opacity-90 transition-opacity text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                      data-ocid="checkout-place-order-btn"
                    >
                      {placing ? "Placing Order..." : "PLACE ORDER"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Price Summary */}
          <div className="w-80 flex-shrink-0">
            <div
              className="bg-card shadow-sm rounded-sm p-5"
              data-ocid="checkout-price-summary"
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
                  <span>₹{(total / 100).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-foreground">
                  <span>Discount</span>
                  <span style={{ color: "#388e3c" }}>− ₹0</span>
                </div>
                <div className="flex justify-between text-foreground">
                  <span>Delivery Charges</span>
                  <span style={{ color: "#388e3c" }} className="font-medium">
                    FREE
                  </span>
                </div>
              </div>
              <div className="border-t border-border mt-4 pt-4 flex justify-between font-semibold text-base text-foreground">
                <span>Total Amount</span>
                <span>₹{(total / 100).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

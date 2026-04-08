import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, CreditCard, MapPin, Tag, Truck, X } from "lucide-react";
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

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountPercent: number;
  } | null>(null);
  const [couponError, setCouponError] = useState("");

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
  const subtotal = cartItems.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0,
  );
  const discountAmount = appliedCoupon
    ? Math.round((subtotal * appliedCoupon.discountPercent) / 100)
    : 0;
  const total = subtotal - discountAmount;

  const isAddressComplete = FIELD_CONFIG.every((f) =>
    deliveryAddress[f.field].trim(),
  );

  const handleChange =
    (field: keyof DeliveryAddress) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setDeliveryAddress((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleApplyCoupon = async () => {
    if (!actor || !couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    try {
      const result = await actor.validateCoupon(
        couponCode.trim().toUpperCase(),
      );
      if (result.__kind === "ok") {
        const discount = Number(result.ok);
        setAppliedCoupon({
          code: couponCode.trim().toUpperCase(),
          discountPercent: discount,
        });
        setCouponCode("");
      } else {
        setCouponError(result.err);
        setAppliedCoupon(null);
      }
    } catch {
      setCouponError("Failed to validate coupon. Please try again.");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError("");
  };

  const handlePlaceOrder = async () => {
    if (!actor || !identity || cartItems.length === 0 || !isAddressComplete)
      return;
    setPlacing(true);
    try {
      // Increment coupon usage if applied
      if (appliedCoupon) {
        await actor.applyCoupon(appliedCoupon.code);
      }
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

            {/* Step 2: Order Summary + Coupon */}
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

                  {/* Coupon Section */}
                  <div className="mt-5 border border-dashed border-blue-200 rounded-sm p-4 bg-blue-50/40">
                    <div className="flex items-center gap-2 mb-3">
                      <Tag className="w-4 h-4" style={{ color: "#2874f0" }} />
                      <span
                        className="text-sm font-semibold"
                        style={{ color: "#2874f0" }}
                      >
                        Apply Coupon
                      </span>
                    </div>

                    {appliedCoupon ? (
                      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-sm px-3 py-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <div>
                            <span className="text-sm font-bold text-green-700">
                              {appliedCoupon.code}
                            </span>
                            <span className="text-xs text-green-600 ml-2">
                              — {appliedCoupon.discountPercent}% off applied!
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="text-gray-400 hover:text-red-500 transition-colors ml-2"
                          aria-label="Remove coupon"
                          data-ocid="checkout-remove-coupon"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => {
                            setCouponCode(e.target.value.toUpperCase());
                            setCouponError("");
                          }}
                          placeholder="Enter coupon code"
                          className="flex-1 border border-input rounded-sm px-3 py-2 text-sm bg-background focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors uppercase"
                          data-ocid="checkout-coupon-input"
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleApplyCoupon()
                          }
                        />
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          disabled={!couponCode.trim() || couponLoading}
                          style={{ background: "#2874f0" }}
                          className="text-white font-semibold px-5 py-2 rounded-sm text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                          data-ocid="checkout-apply-coupon-btn"
                        >
                          {couponLoading ? "Checking..." : "APPLY"}
                        </button>
                      </div>
                    )}

                    {couponError && (
                      <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                        <X className="w-3 h-3" />
                        {couponError}
                      </p>
                    )}
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
              {step > 2 && (
                <div className="px-6 py-3 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {cartItems.length} item{cartItems.length !== 1 ? "s" : ""}
                    {appliedCoupon && (
                      <span className="ml-2 text-green-600 font-medium">
                        · Coupon: {appliedCoupon.code} (
                        {appliedCoupon.discountPercent}% off)
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-xs font-medium"
                    style={{ color: "#2874f0" }}
                  >
                    CHANGE
                  </button>
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

                  {/* Order Review with coupon discount */}
                  {appliedCoupon && (
                    <div className="mt-5 border border-green-200 rounded-sm bg-green-50/60 p-4">
                      <p className="text-xs font-semibold text-green-700 mb-2 uppercase tracking-wide">
                        Order Total Breakdown
                      </p>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Subtotal</span>
                          <span>₹{(subtotal / 100).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-green-700 font-medium">
                          <span className="flex items-center gap-1">
                            <Tag className="w-3.5 h-3.5" />
                            Coupon ({appliedCoupon.code} —{" "}
                            {appliedCoupon.discountPercent}% off)
                          </span>
                          <span>
                            − ₹{(discountAmount / 100).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between font-bold text-foreground border-t border-green-200 pt-2 mt-1">
                          <span>Final Total</span>
                          <span style={{ color: "#2874f0" }}>
                            ₹{(total / 100).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

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
                  <span>₹{(subtotal / 100).toLocaleString()}</span>
                </div>
                {appliedCoupon ? (
                  <div
                    className="flex justify-between"
                    style={{ color: "#388e3c" }}
                  >
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      Coupon ({appliedCoupon.discountPercent}% off)
                    </span>
                    <span>− ₹{(discountAmount / 100).toLocaleString()}</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-foreground">
                    <span>Discount</span>
                    <span style={{ color: "#388e3c" }}>− ₹0</span>
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
                <span>₹{(total / 100).toLocaleString()}</span>
              </div>
              {appliedCoupon && (
                <p className="text-xs mt-2 text-green-700 font-medium text-center bg-green-50 rounded px-2 py-1.5 border border-green-100">
                  🎉 You save ₹{(discountAmount / 100).toLocaleString()} with
                  coupon!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookMarked,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  MapPin,
  Star,
  Tag,
  Truck,
  X,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  type CartItem,
  type Order,
  OrderStatus,
  type SavedAddress,
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
  const [orderSuccess, setOrderSuccess] = useState<{
    pointsEarned: number;
  } | null>(null);
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

  // Loyalty points state
  const [pointsToRedeem, setPointsToRedeem] = useState("");
  const [pointsApplied, setPointsApplied] = useState(0); // actual discount in paise
  const [pointsApplying, setPointsApplying] = useState(false);
  const [pointsError, setPointsError] = useState("");
  const [redeemedPoints, setRedeemedPoints] = useState(0); // points actually redeemed

  // Load saved addresses from localStorage
  const savedAddresses = (() => {
    try {
      const raw = localStorage.getItem("shoapzy_saved_addresses");
      if (!raw) return [] as SavedAddress[];
      return JSON.parse(raw) as SavedAddress[];
    } catch {
      return [] as SavedAddress[];
    }
  })();

  const [selectedSavedId, setSelectedSavedId] = useState<string>("");

  const handleSelectSavedAddress = (id: string) => {
    setSelectedSavedId(id);
    if (!id) return;
    const addr = savedAddresses.find((a) => a.id === id);
    if (!addr) return;
    setDeliveryAddress({
      name: addr.name,
      phone: addr.phone,
      address: addr.street,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
    });
  };

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

  const { data: loyaltyPoints = BigInt(0) } = useQuery({
    queryKey: ["loyaltyPoints", identity?.getPrincipal().toString()],
    queryFn: async () => {
      const pts = await actor!.getLoyaltyPoints();
      return pts;
    },
    enabled: !!actor && !!identity,
  });

  const availablePoints = Number(loyaltyPoints);

  const cartItems = cart as CartItem[];
  const subtotal = cartItems.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0,
  );
  const couponDiscountAmount = appliedCoupon
    ? Math.round((subtotal * appliedCoupon.discountPercent) / 100)
    : 0;
  // Points discount: 1 point = ₹1 = 100 paise, max 20% of subtotal
  const maxPointsDiscount = Math.floor(subtotal * 0.2);
  const previewPointsDiscount =
    pointsToRedeem && !redeemedPoints
      ? Math.min(
          Math.min(Number(pointsToRedeem), availablePoints) * 100,
          maxPointsDiscount,
        )
      : pointsApplied;
  const totalDiscount = couponDiscountAmount + previewPointsDiscount;
  const total = Math.max(0, subtotal - totalDiscount);

  // Earnings estimate: 1% of order value in points
  const pointsEarnEstimate = Math.floor(total / 10000);

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

  const handleApplyPoints = async () => {
    if (!actor || !pointsToRedeem) return;
    const pts = Number(pointsToRedeem);
    if (pts <= 0 || pts > availablePoints) {
      setPointsError(`Enter a value between 1 and ${availablePoints}`);
      return;
    }
    const discountPaise = Math.min(pts * 100, maxPointsDiscount);
    const actualPoints = Math.ceil(discountPaise / 100);

    setPointsApplying(true);
    setPointsError("");
    try {
      const result = await actor.redeemLoyaltyPoints(BigInt(actualPoints));
      if (result.__kind === "ok") {
        setPointsApplied(discountPaise);
        setRedeemedPoints(actualPoints);
        setPointsToRedeem("");
        queryClient.invalidateQueries({ queryKey: ["loyaltyPoints"] });
      } else {
        setPointsError(result.err ?? "Failed to redeem points.");
      }
    } catch {
      setPointsError("Failed to apply points. Please try again.");
    } finally {
      setPointsApplying(false);
    }
  };

  const handleRemovePoints = () => {
    setPointsApplied(0);
    setRedeemedPoints(0);
    setPointsToRedeem("");
    setPointsError("");
  };

  const handlePlaceOrder = async () => {
    if (!actor || !identity || cartItems.length === 0 || !isAddressComplete)
      return;
    setPlacing(true);
    try {
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
      queryClient.invalidateQueries({ queryKey: ["loyaltyPoints"] });
      setOrderSuccess({ pointsEarned: pointsEarnEstimate });
    } finally {
      setPlacing(false);
    }
  };

  if (orderSuccess) {
    return (
      <div
        style={{ background: "#f1f3f6" }}
        className="min-h-screen flex items-center justify-center"
      >
        <div className="bg-card rounded-sm shadow-md p-10 text-center max-w-md w-full mx-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "#e8f5e9" }}
          >
            <CheckCircle2 className="w-8 h-8" style={{ color: "#388e3c" }} />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: "#388e3c" }}>
            Order Placed Successfully!
          </h2>
          <p className="text-muted-foreground text-sm mb-4">
            Your order has been placed and is being processed.
          </p>
          {orderSuccess.pointsEarned > 0 && (
            <div
              className="flex items-center justify-center gap-2 rounded-sm px-4 py-3 mb-5 text-sm font-semibold"
              style={{
                background: "#fffbea",
                border: "1px solid #f59e0b",
                color: "#92400e",
              }}
            >
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              You earned{" "}
              <span className="font-bold">{orderSuccess.pointsEarned} pts</span>{" "}
              loyalty points from this order!
            </div>
          )}
          <button
            type="button"
            onClick={() => navigate("/orders")}
            style={{ background: "#2874f0" }}
            className="text-white font-semibold px-8 py-2.5 rounded-sm hover:opacity-90 transition-opacity text-sm"
            data-ocid="checkout-view-orders-btn"
          >
            VIEW MY ORDERS
          </button>
        </div>
      </div>
    );
  }

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
                  {/* Saved addresses quick-select */}
                  {savedAddresses.length > 0 && (
                    <div className="mb-5 p-3 rounded-sm border border-blue-100 bg-blue-50/40">
                      <div className="flex items-center gap-2 mb-2">
                        <BookMarked
                          className="w-4 h-4"
                          style={{ color: "#2874f0" }}
                        />
                        <span
                          className="text-sm font-semibold"
                          style={{ color: "#2874f0" }}
                        >
                          Select from Saved Addresses
                        </span>
                      </div>
                      <div className="relative">
                        <select
                          value={selectedSavedId}
                          onChange={(e) =>
                            handleSelectSavedAddress(e.target.value)
                          }
                          className="w-full border border-input rounded-sm px-3 py-2 text-sm text-foreground bg-background focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors appearance-none pr-8"
                          data-ocid="checkout-saved-address-select"
                        >
                          <option value="">— Choose a saved address —</option>
                          {savedAddresses.map((addr) => (
                            <option key={addr.id} value={addr.id}>
                              [{addr.label.toUpperCase()}] {addr.name},{" "}
                              {addr.city} - {addr.pincode}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
                      </div>
                      {selectedSavedId && (
                        <p className="text-xs mt-1.5 text-green-700 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Address filled
                          from saved — you can still edit below
                        </p>
                      )}
                    </div>
                  )}
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

            {/* Step 2: Order Summary + Coupon + Loyalty Points */}
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
                          className="text-muted-foreground hover:text-red-500 transition-colors ml-2"
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

                  {/* Loyalty Points Section */}
                  <div
                    className="mt-4 rounded-sm p-4"
                    style={{
                      background:
                        "linear-gradient(135deg, #fffbea 0%, #fef3c7 100%)",
                      border: "1.5px solid #f59e0b",
                    }}
                    data-ocid="checkout-loyalty-section"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Star
                          className="w-4 h-4 fill-amber-400"
                          style={{ color: "#d97706" }}
                        />
                        <span
                          className="text-sm font-bold"
                          style={{ color: "#92400e" }}
                        >
                          Use Your Points
                        </span>
                      </div>
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: "#fef3c7",
                          color: "#92400e",
                          border: "1px solid #fbbf24",
                        }}
                      >
                        {availablePoints} pts available
                      </span>
                    </div>

                    <p className="text-xs mb-3" style={{ color: "#a16207" }}>
                      You have{" "}
                      <strong>
                        {availablePoints} pts = ₹{availablePoints}
                      </strong>
                      . Redeem up to <strong>20% of order total</strong> (max ₹
                      {(maxPointsDiscount / 100).toLocaleString()}).
                    </p>

                    {redeemedPoints > 0 ? (
                      <div
                        className="flex items-center justify-between rounded-sm px-3 py-2"
                        style={{
                          background: "#fef9ee",
                          border: "1px solid #fbbf24",
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2
                            className="w-4 h-4 flex-shrink-0"
                            style={{ color: "#d97706" }}
                          />
                          <div>
                            <span
                              className="text-sm font-bold"
                              style={{ color: "#92400e" }}
                            >
                              {redeemedPoints} pts redeemed
                            </span>
                            <span
                              className="text-xs ml-2"
                              style={{ color: "#a16207" }}
                            >
                              — ₹{(pointsApplied / 100).toLocaleString()} off!
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemovePoints}
                          className="transition-colors ml-2"
                          style={{ color: "#b45309" }}
                          aria-label="Remove points"
                          data-ocid="checkout-remove-points"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min={1}
                            max={availablePoints}
                            value={pointsToRedeem}
                            onChange={(e) => {
                              setPointsToRedeem(e.target.value);
                              setPointsError("");
                            }}
                            placeholder={`Max ${availablePoints} pts`}
                            className="flex-1 border rounded-sm px-3 py-2 text-sm bg-background focus:outline-none transition-colors"
                            style={{
                              borderColor: "#f59e0b",
                              color: "#92400e",
                            }}
                            data-ocid="checkout-points-input"
                          />
                          <button
                            type="button"
                            onClick={handleApplyPoints}
                            disabled={
                              !pointsToRedeem ||
                              availablePoints === 0 ||
                              pointsApplying
                            }
                            className="font-semibold px-5 py-2 rounded-sm text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-white"
                            style={{ background: "#d97706" }}
                            data-ocid="checkout-apply-points-btn"
                          >
                            {pointsApplying ? "Applying..." : "APPLY"}
                          </button>
                        </div>
                        {/* Live preview */}
                        {pointsToRedeem && Number(pointsToRedeem) > 0 && (
                          <p
                            className="text-xs font-medium"
                            style={{ color: "#92400e" }}
                          >
                            ✓ You'll save ₹
                            {(
                              Math.min(
                                Math.min(
                                  Number(pointsToRedeem),
                                  availablePoints,
                                ) * 100,
                                maxPointsDiscount,
                              ) / 100
                            ).toLocaleString()}{" "}
                            with these points
                          </p>
                        )}
                      </div>
                    )}

                    {pointsError && (
                      <p
                        className="text-xs mt-2 flex items-center gap-1"
                        style={{ color: "#b91c1c" }}
                      >
                        <X className="w-3 h-3" />
                        {pointsError}
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
                    {redeemedPoints > 0 && (
                      <span
                        className="ml-2 font-medium"
                        style={{ color: "#d97706" }}
                      >
                        · {redeemedPoints} pts redeemed
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

                  {/* Order Total Breakdown — always shown in step 3 */}
                  <div
                    className="mt-5 rounded-sm p-4"
                    style={{
                      background: "#f8f9fa",
                      border: "1px solid #e0e0e0",
                    }}
                  >
                    <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                      Order Total Breakdown
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-foreground">
                        <span>Subtotal</span>
                        <span>₹{(subtotal / 100).toLocaleString()}</span>
                      </div>
                      {appliedCoupon ? (
                        <div
                          className="flex justify-between font-medium"
                          style={{ color: "#388e3c" }}
                        >
                          <span className="flex items-center gap-1">
                            <Tag className="w-3.5 h-3.5" />
                            Coupon ({appliedCoupon.code} —{" "}
                            {appliedCoupon.discountPercent}% off)
                          </span>
                          <span>
                            − ₹{(couponDiscountAmount / 100).toLocaleString()}
                          </span>
                        </div>
                      ) : (
                        <div className="flex justify-between text-muted-foreground">
                          <span>Coupon Discount</span>
                          <span>− ₹0</span>
                        </div>
                      )}
                      {redeemedPoints > 0 ? (
                        <div
                          className="flex justify-between font-medium"
                          style={{ color: "#d97706" }}
                        >
                          <span className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                            Points Discount ({redeemedPoints} pts)
                          </span>
                          <span>
                            − ₹{(pointsApplied / 100).toLocaleString()}
                          </span>
                        </div>
                      ) : (
                        <div className="flex justify-between text-muted-foreground">
                          <span>Points Discount</span>
                          <span>− ₹0</span>
                        </div>
                      )}
                      <div className="flex justify-between text-foreground">
                        <span>Delivery Charges</span>
                        <span
                          style={{ color: "#388e3c" }}
                          className="font-medium"
                        >
                          FREE
                        </span>
                      </div>
                      <div
                        className="flex justify-between font-bold text-base border-t pt-2 mt-1"
                        style={{ borderColor: "#e0e0e0" }}
                      >
                        <span className="text-foreground">Final Total</span>
                        <span style={{ color: "#2874f0" }}>
                          ₹{(total / 100).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    {pointsEarnEstimate > 0 && (
                      <p
                        className="text-xs mt-3 flex items-center gap-1 font-medium"
                        style={{ color: "#92400e" }}
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        You'll earn ~{pointsEarnEstimate} pts from this order
                      </p>
                    )}
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
          <div className="w-80 flex-shrink-0 space-y-3">
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
                <div
                  className="flex justify-between"
                  style={{ color: "#388e3c" }}
                >
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    Coupon Discount
                  </span>
                  <span>
                    − ₹{(couponDiscountAmount / 100).toLocaleString()}
                  </span>
                </div>
                <div
                  className="flex justify-between"
                  style={{ color: "#d97706" }}
                >
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400" />
                    Points Discount
                  </span>
                  <span>
                    − ₹{(previewPointsDiscount / 100).toLocaleString()}
                  </span>
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
              {totalDiscount > 0 && (
                <p
                  className="text-xs mt-2 font-medium text-center rounded px-2 py-1.5 border"
                  style={{
                    color: "#166534",
                    background: "#f0fdf4",
                    borderColor: "#bbf7d0",
                  }}
                >
                  🎉 You save ₹{(totalDiscount / 100).toLocaleString()} on this
                  order!
                </p>
              )}
            </div>

            {/* Loyalty points balance card */}
            {availablePoints > 0 && (
              <div
                className="rounded-sm p-4 shadow-sm"
                style={{
                  background:
                    "linear-gradient(135deg, #fffbea 0%, #fef3c7 100%)",
                  border: "1.5px solid #f59e0b",
                }}
                data-ocid="checkout-points-balance-card"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Star
                    className="w-4 h-4 fill-amber-400"
                    style={{ color: "#d97706" }}
                  />
                  <span
                    className="text-xs font-bold"
                    style={{ color: "#92400e" }}
                  >
                    Your Loyalty Points
                  </span>
                </div>
                <p
                  className="text-lg font-extrabold"
                  style={{ color: "#d97706" }}
                >
                  {availablePoints} pts
                  <span
                    className="text-xs font-normal ml-2"
                    style={{ color: "#a16207" }}
                  >
                    = ₹{availablePoints}
                  </span>
                </p>
                {redeemedPoints === 0 && (
                  <p className="text-xs mt-1" style={{ color: "#a16207" }}>
                    Apply in Order Summary to save more!
                  </p>
                )}
                {redeemedPoints > 0 && (
                  <p
                    className="text-xs mt-1 font-semibold"
                    style={{ color: "#388e3c" }}
                  >
                    ✓ {redeemedPoints} pts applied
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

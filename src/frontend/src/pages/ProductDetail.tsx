import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  MapPin,
  Minus,
  Plus,
  ShoppingCart,
  Star,
  Store,
  Tag,
  Truck,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import type { CartItem, Product, ProductVariant, Review } from "../types";

const OFFERS = [
  {
    label: "Bank Offer",
    detail: "10% off on SBI Credit Cards, up to ₹1,500. T&C",
  },
  {
    label: "Bank Offer",
    detail: "5% Unlimited Cashback on Shoapzy Axis Bank Credit Card",
  },
  {
    label: "Special Price",
    detail: "Get extra 12% off (price inclusive of cashback/coupon)",
  },
  {
    label: "Partner Offer",
    detail: "Sign up for Shoapzy Pay Later and get free Times Prime membership",
  },
];

const STAR_KEYS = ["s1", "s2", "s3", "s4", "s5"];

function FilledStars({
  value,
  max = 5,
  size = "sm",
}: { value: number; max?: number; size?: "sm" | "md" }) {
  const sz = size === "md" ? "w-5 h-5" : "w-3.5 h-3.5";
  const keys = STAR_KEYS.slice(0, max);
  return (
    <div className="flex items-center gap-0.5">
      {keys.map((key, i) => (
        <Star
          key={key}
          className={`${sz} ${i < Math.round(value) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

function InlineStars({ value, max = 5 }: { value: number; max?: number }) {
  const keys = STAR_KEYS.slice(0, max);
  return (
    <div className="flex items-center gap-0.5">
      {keys.map((key, i) => (
        <svg
          key={key}
          className={`w-3.5 h-3.5 ${i < Math.floor(value) || (i === Math.floor(value) && value - Math.floor(value) >= 0.5) ? "text-white" : "text-white/50"}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function DeliveryDate() {
  const d = new Date();
  d.setDate(d.getDate() + 4);
  return d.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
}

function formatTimestamp(ts: bigint): string {
  try {
    return new Date(Number(ts) / 1_000_000).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

// ── Related product mini-card ─────────────────────────────────────────────────
function RelatedCard({
  product,
  onClick,
}: { product: Product; onClick: () => void }) {
  const price = Number(product.price) / 100;
  const mrp = Number(product.mrp ?? product.price) / 100;
  const disc = Number(product.discountPercent ?? 0);
  const imgSrc =
    typeof product.image === "string"
      ? product.image
      : ((product.image as { getDirectURL?: () => string })?.getDirectURL?.() ??
        "/placeholder.png");

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-shrink-0 w-40 bg-white rounded border hover:shadow-md transition-shadow text-left overflow-hidden"
      style={{ borderColor: "#e0e0e0" }}
      data-ocid="related-product-card"
    >
      <div className="h-32 bg-muted/20 flex items-center justify-center p-2">
        <img
          src={imgSrc}
          alt={product.title}
          className="max-h-full max-w-full object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/placeholder.png";
          }}
        />
      </div>
      <div className="p-2">
        <p className="text-xs font-medium text-foreground line-clamp-2 leading-tight mb-1">
          {product.title}
        </p>
        <p className="text-sm font-bold text-foreground">
          ₹{price.toLocaleString("en-IN")}
        </p>
        {disc > 0 && mrp > price && (
          <p className="text-xs" style={{ color: "#388e3c" }}>
            {disc}% off
          </p>
        )}
      </div>
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [adding, setAdding] = useState(false);
  const [buying, setBuying] = useState(false);
  const [qty, setQty] = useState(1);
  const [activeThumb, setActiveThumb] = useState(0);

  // Variant state
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState<number>(0);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reviewMsg, setReviewMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => actor!.getProducts(),
    enabled: !!actor,
  });

  const product = (products as Product[]).find((p) => p.id === id);

  // Fetch reviews and rating
  useEffect(() => {
    if (!actor || !id) return;
    setReviewsLoading(true);
    Promise.all([
      actor.getProductReviews(id),
      actor.getProductAverageRating(id),
    ])
      .then(([rvs, avg]: [Review[], number]) => {
        setReviews(rvs);
        setAvgRating(avg);
      })
      .catch(() => {})
      .finally(() => setReviewsLoading(false));
  }, [actor, id]);

  // Fetch variants
  useEffect(() => {
    if (!actor || !id) return;
    setVariants([]);
    setSelectedSize(null);
    setSelectedColor(null);
    (
      actor as unknown as {
        getProductVariants?: (id: string) => Promise<ProductVariant[]>;
      }
    )
      .getProductVariants?.(id)
      ?.then((vts) => setVariants(vts ?? []))
      ?.catch(() => setVariants([]));
  }, [actor, id]);

  const reloadReviews = () => {
    if (!actor || !id) return;
    Promise.all([
      actor.getProductReviews(id),
      actor.getProductAverageRating(id),
    ]).then(([rvs, avg]: [Review[], number]) => {
      setReviews(rvs);
      setAvgRating(avg);
    });
  };

  const handleSubmitReview = async () => {
    if (
      !actor ||
      !identity ||
      !id ||
      selectedRating === 0 ||
      !reviewText.trim()
    )
      return;
    setSubmitting(true);
    setReviewMsg(null);
    try {
      const result = await actor.addReview(
        id,
        BigInt(selectedRating),
        reviewText.trim(),
      );
      if ("ok" in result) {
        setReviewMsg({ type: "success", text: "Review submitted! Thank you." });
        setSelectedRating(0);
        setReviewText("");
        reloadReviews();
      } else {
        const errText = "err" in result ? (result.err ?? "") : "";
        if (errText.toLowerCase().includes("already")) {
          setReviewMsg({
            type: "error",
            text: "You already reviewed this product.",
          });
        } else {
          setReviewMsg({
            type: "error",
            text: errText || "Failed to submit review.",
          });
        }
      }
    } catch {
      setReviewMsg({
        type: "error",
        text: "Something went wrong. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddToCart = async (redirect: "cart" | "checkout") => {
    if (!actor || !identity || !product) return;
    redirect === "cart" ? setAdding(true) : setBuying(true);
    try {
      if (redirect === "checkout") {
        // Buy Now: clear cart first, then add only this product
        await actor.clearCallerCart();
        await actor.addToCart({
          productId: product.id,
          seller: product.seller,
          quantity: BigInt(qty),
          price: product.price,
        } as CartItem);
      } else {
        for (let i = 0; i < qty; i++) {
          await actor.addToCart({
            productId: product.id,
            seller: product.seller,
            quantity: BigInt(1),
            price: product.price,
          } as CartItem);
        }
      }
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      navigate(redirect === "cart" ? "/cart" : "/checkout", {
        state: redirect === "checkout" ? { buyNow: true } : undefined,
      });
    } finally {
      setAdding(false);
      setBuying(false);
    }
  };

  if (!product) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#f1f3f6" }}
      >
        <p className="text-muted-foreground">Product not found.</p>
      </div>
    );
  }

  // ── Variant derived state ────────────────────────────────────────────────────
  const hasSizes = variants.some((v) => v.size);
  const hasColors = variants.some((v) => v.color);
  const hasVariants = variants.length > 0;

  // Unique sizes (preserving order)
  const sizes = hasSizes
    ? Array.from(
        new Set(variants.filter((v) => v.size).map((v) => v.size as string)),
      )
    : [];
  // Unique colors
  const colors = hasColors
    ? Array.from(
        new Set(variants.filter((v) => v.color).map((v) => v.color as string)),
      )
    : [];

  // Find matching variant when size+color both selected (or only one dimension exists)
  const resolvedVariant = hasVariants
    ? (variants.find((v) => {
        if (hasSizes && hasColors)
          return v.size === selectedSize && v.color === selectedColor;
        if (hasSizes) return v.size === selectedSize;
        if (hasColors) return v.color === selectedColor;
        return false;
      }) ?? null)
    : null;

  // Available colors for currently selected size (or all if no size)
  const availableColors =
    hasColors && hasSizes && selectedSize
      ? Array.from(
          new Set(
            variants
              .filter((v) => v.size === selectedSize && v.color)
              .map((v) => v.color as string),
          ),
        )
      : colors;

  const maxQty = resolvedVariant
    ? Math.min(10, Number(resolvedVariant.stock))
    : Math.min(10, Number(product.stock));

  const sellingPrice =
    resolvedVariant?.price != null
      ? resolvedVariant.price / 100
      : Number(product.price) / 100;
  const mrpPrice = Number(product.mrp ?? product.price) / 100;
  const discount = Number(product.discountPercent ?? 0);
  const hasDiscount = mrpPrice > sellingPrice && discount > 0;

  // Gate cart/buy: if variants exist, user must pick one
  const variantOutOfStock =
    hasVariants &&
    resolvedVariant !== null &&
    Number(resolvedVariant.stock) === 0;
  const variantNotSelected = hasVariants && resolvedVariant === null;
  const canAddToCart =
    !!identity && maxQty > 0 && !variantOutOfStock && !variantNotSelected;

  const highlights = product.description
    ? product.description
        .split(/\n|;/)
        .map((s) => s.trim())
        .filter(Boolean)
    : ["Quality product"];

  const imgSrc =
    typeof product.image === "string"
      ? product.image
      : ((product.image as { getDirectURL?: () => string })?.getDirectURL?.() ??
        "/placeholder.png");

  // Related products
  const relatedProducts = (products as Product[])
    .filter(
      (p) =>
        p.id !== product.id && p.category === product.category && p.isActive,
    )
    .slice(0, 6);

  const ratingDisplay = avgRating > 0 ? avgRating.toFixed(1) : "0.0";
  const reviewCount = reviews.length;

  return (
    <div className="min-h-screen" style={{ background: "#f1f3f6" }}>
      {/* Breadcrumb */}
      <div
        className="w-full"
        style={{ background: "#fff", borderBottom: "1px solid #e0e0e0" }}
      >
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-2 text-xs text-muted-foreground">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="hover:text-[#2874f0] transition-colors"
            data-ocid="pdp-breadcrumb-home"
          >
            Home
          </button>
          <span>/</span>
          <span className="capitalize">{product.category}</span>
          <span>/</span>
          <span className="text-foreground font-medium truncate max-w-[240px]">
            {product.title}
          </span>
        </div>
      </div>

      {/* Main layout */}
      <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col lg:flex-row gap-4">
        {/* ── Left column ── */}
        <div className="lg:w-[380px] flex-shrink-0 flex flex-col gap-3">
          <div
            className="bg-white rounded shadow-card p-4 flex flex-col gap-4 lg:sticky lg:top-20"
            style={{ border: "1px solid #e0e0e0" }}
          >
            {/* Main image */}
            <div className="flex justify-center items-center h-[340px] overflow-hidden rounded">
              <img
                src={imgSrc}
                alt={product.title}
                className="max-h-[320px] max-w-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder.png";
                }}
              />
            </div>

            {/* Thumbnails */}
            <div className="flex gap-2 justify-center">
              {(["t0", "t1", "t2", "t3"] as const).map((key, i) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => setActiveThumb(i)}
                  className={`w-14 h-14 border-2 rounded flex items-center justify-center overflow-hidden transition-colors ${activeThumb === i ? "border-[#2874f0]" : "border-transparent hover:border-[#2874f0]/40"}`}
                  style={{ background: "#f1f3f6" }}
                >
                  <img
                    src={imgSrc}
                    alt={`view-${key}`}
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder.png";
                    }}
                  />
                </button>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mt-1">
              <button
                type="button"
                onClick={() => handleAddToCart("cart")}
                disabled={adding || !canAddToCart}
                data-ocid="pdp-add-to-cart"
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded font-bold text-sm transition-opacity disabled:opacity-60"
                style={{ background: "#ff9f00", color: "#fff" }}
              >
                <ShoppingCart className="w-4 h-4" />
                {adding
                  ? "Adding…"
                  : !identity
                    ? "LOGIN TO BUY"
                    : variantNotSelected
                      ? "SELECT OPTIONS"
                      : variantOutOfStock
                        ? "OUT OF STOCK"
                        : "ADD TO CART"}
              </button>
              <button
                type="button"
                onClick={() => handleAddToCart("checkout")}
                disabled={buying || !canAddToCart}
                data-ocid="pdp-buy-now"
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded font-bold text-sm transition-opacity disabled:opacity-60"
                style={{ background: "#fb641b", color: "#fff" }}
              >
                <Zap className="w-4 h-4" />
                {buying ? "Loading…" : "BUY NOW"}
              </button>
            </div>
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {/* Product info card */}
          <div
            className="bg-white rounded shadow-card p-5"
            style={{ border: "1px solid #e0e0e0" }}
          >
            <span
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: "#2874f0" }}
            >
              {product.category}
            </span>
            <h1 className="text-xl font-semibold text-foreground mt-1 leading-snug">
              {product.title}
            </h1>

            {/* Rating badge — real data */}
            <div className="flex items-center gap-3 mt-2">
              {reviewCount > 0 ? (
                <>
                  <span
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded text-white text-sm font-bold"
                    style={{
                      background:
                        avgRating >= 4
                          ? "#388e3c"
                          : avgRating >= 3
                            ? "#ff9f00"
                            : "#b12704",
                    }}
                  >
                    {ratingDisplay} <InlineStars value={avgRating} />
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {reviewCount} {reviewCount === 1 ? "Rating" : "Ratings"}
                  </span>
                  <span className="text-muted-foreground text-sm">|</span>
                  <span className="text-sm text-muted-foreground">
                    {reviewCount} {reviewCount === 1 ? "Review" : "Reviews"}
                  </span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">
                  No ratings yet
                </span>
              )}
            </div>

            <hr className="my-3" style={{ borderColor: "#f0f0f0" }} />

            {/* Price */}
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-3xl font-semibold text-foreground">
                ₹{sellingPrice.toLocaleString("en-IN")}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-base line-through text-muted-foreground">
                    ₹{mrpPrice.toLocaleString("en-IN")}
                  </span>
                  <span
                    className="text-base font-semibold"
                    style={{ color: "#388e3c" }}
                  >
                    {discount}% off
                  </span>
                </>
              )}
            </div>
            {hasDiscount && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Inclusive of all taxes
              </p>
            )}

            {/* ── Variant Selectors ── */}
            {hasVariants && (
              <div className="mt-4 flex flex-col gap-4">
                {/* Size selector */}
                {hasSizes && (
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-2">
                      Size
                      {selectedSize && (
                        <span className="ml-2 font-normal text-muted-foreground">
                          : {selectedSize}
                        </span>
                      )}
                    </p>
                    <div
                      className="flex flex-wrap gap-2"
                      data-ocid="variant-size-selector"
                    >
                      {sizes.map((sz) => {
                        const isSelected = selectedSize === sz;
                        const hasStock = variants
                          .filter((v) => v.size === sz)
                          .some((v) => Number(v.stock) > 0);
                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => {
                              setSelectedSize(sz);
                              setSelectedColor(null);
                            }}
                            disabled={!hasStock}
                            aria-label={`Size ${sz}`}
                            className={`min-w-[44px] h-10 px-3 rounded border-2 text-sm font-semibold transition-all ${
                              isSelected
                                ? "border-[#2874f0] bg-[#2874f0]/10 text-[#2874f0]"
                                : hasStock
                                  ? "border-muted-foreground/30 text-foreground hover:border-[#2874f0]/60"
                                  : "border-muted-foreground/20 text-muted-foreground/40 line-through cursor-not-allowed"
                            }`}
                          >
                            {sz}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Color selector */}
                {hasColors && (
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-2">
                      Color
                      {selectedColor && (
                        <span className="ml-2 font-normal text-muted-foreground capitalize">
                          : {selectedColor}
                        </span>
                      )}
                    </p>
                    <div
                      className="flex flex-wrap gap-2"
                      data-ocid="variant-color-selector"
                    >
                      {availableColors.map((col) => {
                        const isSelected = selectedColor === col;
                        const matchingVariants = variants.filter(
                          (v) =>
                            v.color === col &&
                            (!hasSizes || v.size === selectedSize),
                        );
                        const hasStock = matchingVariants.some(
                          (v) => Number(v.stock) > 0,
                        );
                        return (
                          <button
                            key={col}
                            type="button"
                            onClick={() => setSelectedColor(col)}
                            disabled={!hasStock || (hasSizes && !selectedSize)}
                            aria-label={`Color ${col}`}
                            title={col}
                            className={`w-9 h-9 rounded-full border-2 transition-all flex items-center justify-center ${
                              isSelected
                                ? "border-[#2874f0] scale-110 shadow-md"
                                : hasStock
                                  ? "border-transparent hover:border-[#2874f0]/50 hover:scale-105"
                                  : "border-transparent opacity-30 cursor-not-allowed"
                            }`}
                            style={{ background: col }}
                          >
                            {isSelected && (
                              <span className="w-2.5 h-2.5 rounded-full bg-white block" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {hasSizes && !selectedSize && hasColors && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Please select a size first
                      </p>
                    )}
                  </div>
                )}

                {/* Variant stock status */}
                {resolvedVariant !== null && (
                  <div>
                    {variantOutOfStock ? (
                      <span
                        className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded"
                        style={{ background: "#fce4e4", color: "#b12704" }}
                        data-ocid="variant-out-of-stock"
                      >
                        Out of Stock
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded"
                        style={{ background: "#e8f5e9", color: "#388e3c" }}
                        data-ocid="variant-in-stock"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        In Stock ({Number(resolvedVariant.stock)} left)
                      </span>
                    )}
                  </div>
                )}

                {variantNotSelected && (
                  <p
                    className="text-xs font-medium"
                    style={{ color: "#b12704" }}
                    data-ocid="variant-select-prompt"
                  >
                    Please select {hasSizes ? "a size" : ""}
                    {hasSizes && hasColors ? " and " : ""}
                    {hasColors ? "a color" : ""} to continue
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Highlights */}
          <div
            className="bg-white rounded shadow-card p-5"
            style={{ border: "1px solid #e0e0e0" }}
          >
            <p className="text-sm font-semibold text-foreground mb-2">
              Highlights
            </p>
            <ul className="flex flex-col gap-1.5">
              {highlights.map((h) => (
                <li
                  key={h.slice(0, 30)}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <CheckCircle2
                    className="w-4 h-4 mt-0.5 flex-shrink-0"
                    style={{ color: "#2874f0" }}
                  />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Delivery + Seller */}
          <div
            className="bg-white rounded shadow-card p-5 flex flex-col gap-3"
            style={{ border: "1px solid #e0e0e0" }}
          >
            <div className="flex items-start gap-3 text-sm">
              <Truck className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
              <div>
                <span className="text-foreground font-medium">
                  Delivery by {DeliveryDate()}
                </span>
                <p className="text-muted-foreground mt-0.5">
                  FREE Delivery on orders above ₹499
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground">
                Delivering to{" "}
                <span className="text-foreground font-medium">110001</span> –
                Delhi
              </span>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <Store className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground">
                Sold by{" "}
                <Link
                  to={`/seller/${product.seller?.toString?.()}`}
                  className="text-[#2874f0] font-medium hover:underline"
                  data-ocid="pdp-seller-link"
                >
                  {product.seller?.toString?.().slice(0, 10) ?? "Shoapzy Store"}
                  …
                </Link>
              </span>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <CheckCircle2
                className="w-4 h-4 mt-0.5 flex-shrink-0"
                style={{ color: "#388e3c" }}
              />
              <span className="text-foreground font-medium">
                {Number(product.stock) > 0
                  ? `${Number(product.stock)} in stock`
                  : "Out of stock"}
              </span>
            </div>
          </div>

          {/* Quantity selector */}
          <div
            className="bg-white rounded shadow-card p-5"
            style={{ border: "1px solid #e0e0e0" }}
          >
            <p className="text-sm font-semibold text-foreground mb-3">
              Quantity
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
                data-ocid="pdp-qty-minus"
                className="w-8 h-8 rounded-full border flex items-center justify-center text-foreground hover:bg-muted disabled:opacity-40 transition-colors"
                style={{ borderColor: "#c2c2c2" }}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span
                className="w-12 text-center text-base font-semibold text-foreground border rounded py-1"
                style={{ borderColor: "#c2c2c2" }}
                data-ocid="pdp-qty-display"
              >
                {qty}
              </span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                disabled={qty >= maxQty}
                data-ocid="pdp-qty-plus"
                className="w-8 h-8 rounded-full border flex items-center justify-center text-foreground hover:bg-muted disabled:opacity-40 transition-colors"
                style={{ borderColor: "#c2c2c2" }}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs text-muted-foreground">
                (Max 10 per order)
              </span>
            </div>
          </div>

          {/* Available Offers */}
          <div
            className="bg-white rounded shadow-card p-5"
            style={{ border: "1px solid #e0e0e0" }}
          >
            <p className="text-sm font-semibold text-foreground mb-3">
              Available Offers
            </p>
            <ul className="flex flex-col gap-3">
              {OFFERS.map((o) => (
                <li
                  key={`${o.label}-${o.detail.slice(0, 20)}`}
                  className="flex items-start gap-2 text-sm"
                >
                  <Tag className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#2874f0]" />
                  <span>
                    <span className="font-semibold text-foreground">
                      {o.label}
                    </span>{" "}
                    <span className="text-muted-foreground">{o.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Product Description */}
          <div
            className="bg-white rounded shadow-card p-5"
            style={{ border: "1px solid #e0e0e0" }}
          >
            <p className="text-sm font-semibold text-foreground mb-3">
              Product Description
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {product.description || "No description available."}
            </p>
          </div>

          {/* ── Customer Reviews & Ratings ── */}
          <div
            className="bg-white rounded shadow-card p-5 flex flex-col gap-4"
            style={{ border: "1px solid #e0e0e0" }}
          >
            <p className="text-base font-semibold text-foreground">
              Customer Reviews &amp; Ratings
            </p>

            {/* Rating summary bar */}
            {reviewCount > 0 && (
              <div
                className="flex items-center gap-4 pb-3"
                style={{ borderBottom: "1px solid #f0f0f0" }}
              >
                <div className="flex flex-col items-center">
                  <span className="text-4xl font-bold text-foreground">
                    {ratingDisplay}
                  </span>
                  <FilledStars value={avgRating} size="md" />
                  <span className="text-xs text-muted-foreground mt-1">
                    {reviewCount} Reviews
                  </span>
                </div>
              </div>
            )}

            {/* Write a review form */}
            {identity ? (
              <div
                className="flex flex-col gap-3 p-4 rounded"
                style={{ background: "#f9f9f9", border: "1px solid #eeeeee" }}
              >
                <p className="text-sm font-semibold text-foreground">
                  Write a Review
                </p>

                {/* Star picker */}
                <div
                  className="flex items-center gap-1"
                  data-ocid="review-star-picker"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={`pick-${n}`}
                      type="button"
                      onClick={() => setSelectedRating(n)}
                      onMouseEnter={() => setHoverRating(n)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="focus:outline-none"
                      aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${n <= (hoverRating || selectedRating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30 hover:text-yellow-300"}`}
                      />
                    </button>
                  ))}
                  {selectedRating > 0 && (
                    <span className="text-sm text-muted-foreground ml-2">
                      {
                        ["", "Poor", "Fair", "Good", "Very Good", "Excellent"][
                          selectedRating
                        ]
                      }
                    </span>
                  )}
                </div>

                {/* Text area */}
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value.slice(0, 500))}
                  placeholder="Share your experience with this product…"
                  rows={3}
                  data-ocid="review-text-input"
                  className="w-full text-sm rounded border px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#2874f0]/40"
                  style={{ borderColor: "#c2c2c2" }}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {reviewText.length}/500
                  </span>
                  <button
                    type="button"
                    onClick={handleSubmitReview}
                    disabled={
                      submitting || selectedRating === 0 || !reviewText.trim()
                    }
                    data-ocid="review-submit"
                    className="px-5 py-2 rounded text-sm font-bold text-white transition-opacity disabled:opacity-50"
                    style={{ background: "#2874f0" }}
                  >
                    {submitting ? "Submitting…" : "Submit Review"}
                  </button>
                </div>

                {reviewMsg && (
                  <p
                    className="text-sm font-medium"
                    style={{
                      color:
                        reviewMsg.type === "success" ? "#388e3c" : "#b12704",
                    }}
                    data-ocid="review-feedback-msg"
                  >
                    {reviewMsg.text}
                  </p>
                )}
              </div>
            ) : (
              <div
                className="text-sm text-muted-foreground p-3 rounded"
                style={{ background: "#f9f9f9", border: "1px dashed #d0d0d0" }}
              >
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="text-[#2874f0] font-medium hover:underline"
                >
                  Login
                </button>{" "}
                to write a review for this product.
              </div>
            )}

            {/* Reviews list */}
            {reviewsLoading ? (
              <div className="flex flex-col gap-3">
                {[1, 2].map((n) => (
                  <div
                    key={n}
                    className="animate-pulse flex flex-col gap-2 p-3 rounded"
                    style={{ background: "#f5f5f5" }}
                  >
                    <div className="h-3 w-24 bg-muted rounded" />
                    <div className="h-3 w-full bg-muted rounded" />
                  </div>
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div
                className="text-center py-8 text-muted-foreground"
                data-ocid="reviews-empty-state"
              >
                <Star className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
                <p className="font-medium text-foreground">No reviews yet.</p>
                <p className="text-sm mt-1">
                  Be the first to review this product!
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3" data-ocid="reviews-list">
                {reviews.map((r) => (
                  <div
                    key={`review-${r.id}`}
                    className="p-4 rounded flex flex-col gap-1.5"
                    style={{
                      background: "#fafafa",
                      border: "1px solid #f0f0f0",
                    }}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">
                        {r.buyerName || "Verified Buyer"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(r.timestamp)}
                      </span>
                    </div>
                    <FilledStars value={Number(r.rating)} size="sm" />
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {r.reviewText}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Related Products ── */}
          {relatedProducts.length > 0 && (
            <div
              className="bg-white rounded shadow-card p-5"
              style={{ border: "1px solid #e0e0e0" }}
            >
              <p className="text-base font-semibold text-foreground mb-3 capitalize">
                More in {product.category}
              </p>
              {relatedProducts.length === 0 ? (
                <p
                  className="text-sm text-muted-foreground"
                  data-ocid="related-empty-state"
                >
                  No similar products found.
                </p>
              ) : (
                <div
                  className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin"
                  data-ocid="related-products-row"
                >
                  {relatedProducts.map((rp) => (
                    <RelatedCard
                      key={rp.id}
                      product={rp}
                      onClick={() => navigate(`/product/${rp.id}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { BarChart2, Heart, ShoppingCart, Zap } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useActor } from "../hooks/useActor";
import { useCompare } from "../hooks/useCompare";
import type { Product, ReviewSummary } from "../types";

const STATIC_RATINGS: Record<number, { stars: number; count: string }> = {};
export function getRating(seed: number) {
  if (!STATIC_RATINGS[seed]) {
    const stars = 3.5 + (seed % 15) / 10;
    const count = 100 + ((seed * 37) % 9900);
    STATIC_RATINGS[seed] = {
      stars: Math.round(stars * 10) / 10,
      count: count.toLocaleString(),
    };
  }
  return STATIC_RATINGS[seed];
}

interface ProductCardProps {
  product: Product;
  isLoggedIn: boolean;
  addingId: string | null;
  onAddToCart: (p: Product) => void;
  wishlistIds?: string[];
  onToggleWishlist?: (p: Product) => void;
  togglingWishlistId?: string | null;
  reviewSummary?: ReviewSummary;
}

export function ProductCard({
  product,
  isLoggedIn,
  addingId,
  onAddToCart,
  wishlistIds = [],
  onToggleWishlist,
  togglingWishlistId,
  reviewSummary,
}: ProductCardProps) {
  const navigate = useNavigate();
  const { actor } = useActor();
  const { addToCompare, removeFromCompare, isInCompare, canAdd } = useCompare();
  const seed = product.title.charCodeAt(0) + product.title.length;
  const staticRating = getRating(seed);
  const mrp = Number(product.mrp) / 100;
  const price = Number(product.price) / 100;
  const discount = Number(product.discountPercent);
  const hasDiscount = mrp > price && discount > 0;
  const isWishlisted = wishlistIds.includes(product.id);
  const isTogglingThis = togglingWishlistId === product.id;
  const inCompare = isInCompare(product.id);

  // Live rating or fallback to static
  const ratingDisplay = reviewSummary
    ? {
        stars: reviewSummary.averageRating.toFixed(1),
        count:
          reviewSummary.reviewCount > 0n
            ? Number(reviewSummary.reviewCount).toLocaleString()
            : null,
      }
    : { stars: String(staticRating.stars), count: staticRating.count };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    onToggleWishlist?.(product);
  };

  const handleCompareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inCompare) {
      removeFromCompare(product.id);
    } else if (canAdd) {
      addToCompare(product);
    }
  };

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    if (!actor) return;
    try {
      await actor.clearCallerCart();
      await actor.addToCart({
        productId: product.id,
        seller: product.seller,
        quantity: BigInt(1),
        price: product.price,
      });
      navigate("/checkout");
    } catch (err) {
      console.error("Buy Now failed:", err);
    }
  };

  return (
    <div
      data-ocid="product-card"
      className="bg-white flex flex-col hover:shadow-md transition-all duration-200 cursor-pointer relative"
    >
      {/* Top-right action buttons: wishlist + compare */}
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
        {/* Wishlist */}
        <button
          type="button"
          data-ocid="wishlist-btn"
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          onClick={handleWishlistClick}
          className={`w-7 h-7 rounded-full flex items-center justify-center shadow-sm transition-all duration-200 ${
            isLoggedIn
              ? "bg-white hover:scale-110"
              : "bg-white/70 cursor-pointer"
          } ${isTogglingThis ? "opacity-50" : ""}`}
        >
          <Heart
            className={`w-4 h-4 transition-colors duration-200 ${
              isWishlisted && isLoggedIn
                ? "fill-red-500 text-red-500"
                : isLoggedIn
                  ? "text-muted-foreground hover:text-red-400"
                  : "text-muted-foreground/40"
            }`}
          />
        </button>

        {/* Compare */}
        <button
          type="button"
          data-ocid="compare-btn"
          aria-label={inCompare ? "Remove from compare" : "Add to compare"}
          onClick={handleCompareClick}
          disabled={!inCompare && !canAdd}
          title={
            inCompare
              ? "Remove from compare"
              : canAdd
                ? "Compare this product"
                : "Compare list is full (max 4)"
          }
          className={`w-7 h-7 rounded-full flex items-center justify-center shadow-sm transition-all duration-200 ${
            inCompare
              ? "bg-[#2874f0] scale-110"
              : canAdd
                ? "bg-white hover:scale-110"
                : "bg-white/50 cursor-not-allowed opacity-50"
          }`}
        >
          <BarChart2
            className={`w-4 h-4 transition-colors duration-200 ${
              inCompare ? "text-white" : "text-muted-foreground"
            }`}
          />
        </button>
      </div>

      <Link to={`/product/${product.id}`} className="block">
        <div className="aspect-square overflow-hidden flex items-center justify-center p-3 bg-[#f9f9f9]">
          <img
            src={product.image?.getDirectURL?.() ?? "/placeholder.png"}
            alt={product.title}
            className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder.png";
            }}
          />
        </div>
      </Link>

      <div className="px-3 pt-2 pb-3 flex flex-col flex-1">
        <Link to={`/product/${product.id}`}>
          <p className="text-sm text-foreground line-clamp-2 leading-snug hover:text-[#2874f0] transition-colors min-h-[2.5rem]">
            {product.title}
          </p>
        </Link>

        {/* Star rating */}
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="bg-[#388e3c] text-white text-xs px-1.5 py-0.5 rounded font-semibold flex items-center gap-0.5 leading-none">
            {ratingDisplay.stars} ★
          </span>
          {ratingDisplay.count !== null ? (
            <span className="text-xs text-muted-foreground">
              ({ratingDisplay.count})
            </span>
          ) : (
            <span className="text-xs text-[#388e3c] font-medium">New</span>
          )}
        </div>

        {/* Seller name */}
        {product.seller && (
          <Link
            to={`/seller/${product.seller.toString()}`}
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-[#2874f0] hover:underline mt-1 truncate block"
            data-ocid="product-seller-link"
          >
            {product.seller.toString().slice(0, 12)}…
          </Link>
        )}

        {/* Pricing */}
        <div className="mt-1.5 flex items-baseline gap-1.5 flex-wrap">
          <span className="text-base font-bold text-foreground">
            ₹{price.toLocaleString("en-IN")}
          </span>
          {hasDiscount && (
            <>
              <span className="text-xs line-through text-muted-foreground">
                ₹{mrp.toLocaleString("en-IN")}
              </span>
              <span className="text-xs font-semibold text-[#388e3c]">
                {discount}% off
              </span>
            </>
          )}
        </div>

        {/* Action buttons */}
        <div className="mt-2.5 flex flex-col gap-1.5">
          {/* Add to Cart */}
          <button
            type="button"
            data-ocid="add-to-cart-btn"
            className="w-full bg-[#ff9f00] hover:bg-[#fb8c00] text-white text-xs font-semibold py-1.5 rounded-sm transition-colors duration-150 flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!isLoggedIn) {
                navigate("/login");
                return;
              }
              onAddToCart(product);
            }}
            disabled={addingId === product.id}
          >
            {addingId === product.id ? (
              <span className="animate-pulse">Adding…</span>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5" />
                Add to Cart
              </>
            )}
          </button>

          {/* Buy Now */}
          <button
            type="button"
            data-ocid="buy-now-btn"
            className="w-full bg-[#fb641b] hover:bg-[#e85d18] text-white text-xs font-semibold py-1.5 rounded-sm transition-colors duration-150 flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleBuyNow}
            disabled={!isLoggedIn || !actor}
            aria-label="Buy Now"
          >
            <Zap className="w-3.5 h-3.5" />
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}

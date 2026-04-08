import { Principal } from "@icp-sdk/core/principal";
import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { Package, ShoppingBag, Star, Store } from "lucide-react";
import { useParams } from "react-router-dom";
import { ProductCard } from "../components/ProductCard";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import type { Product, Review } from "../types";

interface SellerProfileData {
  principal: Principal;
  shopName: string;
  shopDescription: string[] | [];
  averageRating: number;
  totalReviews: bigint;
  productCount: bigint;
}

const STAR_KEYS = ["s1", "s2", "s3", "s4", "s5"] as const;

function StarDisplay({ value, max = 5 }: { value: number; max?: number }) {
  const keys = STAR_KEYS.slice(0, max);
  return (
    <div className="flex items-center gap-0.5">
      {keys.map((key, i) => (
        <Star
          key={key}
          className={`w-4 h-4 ${i < Math.round(value) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded border border-border animate-pulse p-3 flex flex-col gap-2">
      <div className="aspect-square bg-muted rounded" />
      <div className="h-3 bg-muted rounded w-3/4" />
      <div className="h-3 bg-muted rounded w-1/2" />
      <div className="h-5 bg-muted rounded w-1/3" />
    </div>
  );
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

export default function SellerProfile() {
  const { principalId } = useParams<{ principalId: string }>();
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const isLoggedIn = !!identity;

  const sellerPrincipal: Principal | null = principalId
    ? Principal.fromText(principalId)
    : null;

  const { data: profileData, isLoading: profileLoading } =
    useQuery<SellerProfileData | null>({
      queryKey: ["sellerProfile", principalId],
      queryFn: async () => {
        if (!actor || !sellerPrincipal) return null;
        const result = await actor.getSellerProfileData(sellerPrincipal);
        if (!result || result.length === 0) return null;
        return result[0] as SellerProfileData;
      },
      enabled: !!actor && !!sellerPrincipal,
    });

  const { data: sellerProducts = [], isLoading: productsLoading } = useQuery<
    Product[]
  >({
    queryKey: ["sellerProducts", principalId],
    queryFn: async () => {
      if (!actor || !sellerPrincipal) return [];
      return actor.getSellerProducts(sellerPrincipal) as Promise<Product[]>;
    },
    enabled: !!actor && !!sellerPrincipal,
  });

  const { data: sellerReviews = [], isLoading: reviewsLoading } = useQuery<
    Review[]
  >({
    queryKey: ["sellerReviews", principalId],
    queryFn: async () => {
      if (!actor || !sellerPrincipal) return [];
      return actor.getSellerReviews(sellerPrincipal, BigInt(10)) as Promise<
        Review[]
      >;
    },
    enabled: !!actor && !!sellerPrincipal,
  });

  const isLoading = profileLoading || productsLoading;

  // Cart add handler
  const handleAddToCart = async (product: Product) => {
    if (!actor) return;
    try {
      await actor.addToCart({
        productId: product.id,
        seller: product.seller,
        quantity: BigInt(1),
        price: product.price,
      });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    } catch (err) {
      console.error("Add to cart failed:", err);
    }
  };

  if (!principalId) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#f1f3f6" }}
      >
        <p className="text-muted-foreground">Invalid seller ID.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ background: "#f1f3f6" }}>
        {/* Header skeleton */}
        <div style={{ background: "#2874f0" }} className="py-8">
          <div className="max-w-6xl mx-auto px-4 animate-pulse flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-white/20" />
            <div className="flex flex-col gap-3">
              <div className="h-6 w-48 bg-white/20 rounded" />
              <div className="h-4 w-64 bg-white/20 rounded" />
              <div className="flex gap-4">
                <div className="h-4 w-20 bg-white/20 rounded" />
                <div className="h-4 w-20 bg-white/20 rounded" />
              </div>
            </div>
          </div>
        </div>
        {/* Products skeleton */}
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <SkeletonCard key={n} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ background: "#f1f3f6" }}
        data-ocid="seller-not-found"
      >
        <Store className="w-16 h-16 text-muted-foreground/30" />
        <p className="text-xl font-semibold text-foreground">
          Seller not found
        </p>
        <p className="text-sm text-muted-foreground">
          This seller may have been removed or does not exist.
        </p>
      </div>
    );
  }

  const avgRating = profileData.averageRating ?? 0;
  const totalReviews = Number(profileData.totalReviews ?? 0);
  const productCount = Number(profileData.productCount ?? 0);
  const shopDesc =
    Array.isArray(profileData.shopDescription) &&
    profileData.shopDescription.length > 0
      ? profileData.shopDescription[0]
      : typeof profileData.shopDescription === "string"
        ? profileData.shopDescription
        : null;

  return (
    <div className="min-h-screen" style={{ background: "#f1f3f6" }}>
      {/* ── Shop Header ── */}
      <div style={{ background: "#2874f0" }} data-ocid="seller-profile-header">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 border-2 border-white/40">
              <Store className="w-10 h-10 text-white" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-white leading-tight truncate">
                {profileData.shopName}
              </h1>
              {shopDesc && (
                <p className="text-white/80 text-sm mt-1 line-clamp-2">
                  {shopDesc}
                </p>
              )}

              {/* Stats row */}
              <div className="flex flex-wrap items-center gap-4 mt-3">
                {/* Rating */}
                <div className="flex items-center gap-1.5">
                  <span className="flex items-center gap-1 bg-white/20 text-white text-sm font-bold px-2 py-0.5 rounded">
                    {avgRating > 0 ? avgRating.toFixed(1) : "New"} ★
                  </span>
                  {totalReviews > 0 && (
                    <span className="text-white/70 text-sm">
                      {totalReviews.toLocaleString()} ratings
                    </span>
                  )}
                </div>

                {/* Products */}
                <div className="flex items-center gap-1.5 text-white/80 text-sm">
                  <Package className="w-4 h-4" />
                  <span>
                    {productCount} {productCount === 1 ? "Product" : "Products"}
                  </span>
                </div>

                {/* Seller ID snippet */}
                <div className="flex items-center gap-1.5 text-white/60 text-xs font-mono">
                  <span>ID: {principalId?.slice(0, 20)}…</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-5 flex flex-col gap-6">
        {/* ── Products Grid ── */}
        <section data-ocid="seller-products-section">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingBag className="w-5 h-5" style={{ color: "#2874f0" }} />
            <h2 className="text-base font-semibold text-foreground">
              Products by {profileData.shopName}
            </h2>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {sellerProducts.length}
            </span>
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5].map((n) => (
                <SkeletonCard key={n} />
              ))}
            </div>
          ) : sellerProducts.length === 0 ? (
            <div
              className="text-center py-12 bg-white rounded border"
              style={{ borderColor: "#e0e0e0" }}
              data-ocid="seller-products-empty"
            >
              <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="font-medium text-foreground">No products yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                This seller hasn't listed any products.
              </p>
            </div>
          ) : (
            <div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-0 border border-border rounded overflow-hidden"
              data-ocid="seller-products-grid"
            >
              {sellerProducts.map((product) => (
                <div
                  key={product.id}
                  className="border-r border-b border-border last:border-r-0"
                >
                  <ProductCard
                    product={product}
                    isLoggedIn={isLoggedIn}
                    addingId={null}
                    onAddToCart={handleAddToCart}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Recent Reviews ── */}
        <section data-ocid="seller-reviews-section">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            <h2 className="text-base font-semibold text-foreground">
              Recent Customer Reviews
            </h2>
          </div>

          {reviewsLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="bg-white rounded border animate-pulse p-4 flex flex-col gap-2"
                  style={{ borderColor: "#e0e0e0" }}
                >
                  <div className="h-3 w-32 bg-muted rounded" />
                  <div className="h-3 w-20 bg-muted rounded" />
                  <div className="h-3 w-full bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : sellerReviews.length === 0 ? (
            <div
              className="text-center py-10 bg-white rounded border"
              style={{ borderColor: "#e0e0e0" }}
              data-ocid="seller-reviews-empty"
            >
              <Star className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
              <p className="font-medium text-foreground">No reviews yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Be the first to buy and review a product from this seller!
              </p>
            </div>
          ) : (
            <div
              className="flex flex-col gap-3"
              data-ocid="seller-reviews-list"
            >
              {sellerReviews.map((review) => (
                <div
                  key={`review-${review.id}`}
                  className="bg-white rounded border p-4 flex flex-col gap-2"
                  style={{ borderColor: "#e0e0e0" }}
                >
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-semibold text-foreground">
                        {review.buyerName || "Verified Buyer"}
                      </span>
                      <StarDisplay value={Number(review.rating)} />
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatTimestamp(review.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {review.reviewText}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

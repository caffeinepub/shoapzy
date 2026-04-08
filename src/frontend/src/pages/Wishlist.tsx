import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { ProductCard } from "../components/ProductCard";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import type { CartItem, Product } from "../types";

export default function Wishlist() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [addingId, setAddingId] = useState<string | null>(null);
  const [togglingWishlistId, setTogglingWishlistId] = useState<string | null>(
    null,
  );

  const { data: wishlistIds = [] } = useQuery<string[]>({
    queryKey: ["wishlist", identity?.getPrincipal().toString()],
    queryFn: () => actor!.getCallerWishlist(),
    enabled: !!actor && !!identity,
  });

  const { data: allProducts = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => actor!.getProducts(),
    enabled: !!actor,
  });

  const wishlistProducts = (allProducts as Product[]).filter(
    (p) => p.isActive && wishlistIds.includes(p.id),
  );

  const handleAddToCart = async (product: Product) => {
    if (!actor || !identity) return;
    setAddingId(product.id);
    try {
      const item: CartItem = {
        productId: product.id,
        seller: product.seller,
        quantity: BigInt(1),
        price: product.price,
      };
      await actor.addToCart(item);
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    } finally {
      setAddingId(null);
    }
  };

  const handleToggleWishlist = async (product: Product) => {
    if (!actor || !identity) return;
    setTogglingWishlistId(product.id);
    try {
      const inWishlist = wishlistIds.includes(product.id);
      if (inWishlist) {
        await actor.removeFromWishlist(product.id);
      } else {
        await actor.addToWishlist(product.id);
      }
      queryClient.invalidateQueries({
        queryKey: ["wishlist", identity.getPrincipal().toString()],
      });
    } finally {
      setTogglingWishlistId(null);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "#f1f3f6" }}>
      <div className="max-w-7xl mx-auto px-3 md:px-4 py-4 space-y-3">
        {/* Header */}
        <div className="bg-white shadow-sm rounded-sm px-5 py-4 flex items-center gap-3 border-b-2 border-[#2874f0]">
          <Heart className="w-6 h-6 text-red-500 fill-red-500" />
          <div>
            <h1 className="text-lg font-bold text-foreground">My Wishlist</h1>
            {!isLoading && (
              <p className="text-xs text-muted-foreground">
                {wishlistProducts.length}{" "}
                {wishlistProducts.length === 1 ? "item" : "items"} saved
              </p>
            )}
          </div>
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="bg-white rounded-sm shadow-sm p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 divide-x divide-y divide-[#f0f0f0]">
            {Array.from({ length: 8 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
              <div key={i} className="p-3 space-y-2">
                <div className="aspect-square bg-[#f1f3f6] animate-pulse rounded" />
                <div className="h-3 bg-[#f1f3f6] animate-pulse rounded w-3/4" />
                <div className="h-3 bg-[#f1f3f6] animate-pulse rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && wishlistProducts.length === 0 && (
          <div
            data-ocid="wishlist-empty"
            className="bg-white rounded-sm shadow-sm text-center py-20 px-4"
          >
            <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground/20" />
            <h2 className="text-xl font-bold text-foreground mb-2">
              Your wishlist is empty
            </h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
              Save items you love by tapping the heart icon on any product
            </p>
            <Link
              to="/"
              data-ocid="wishlist-empty-cta"
              className="inline-flex items-center gap-2 bg-[#2874f0] text-white text-sm font-semibold px-6 py-2.5 rounded-sm hover:bg-[#1a5fd9] transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              Start Shopping
            </Link>
          </div>
        )}

        {/* Product grid */}
        {!isLoading && wishlistProducts.length > 0 && (
          <section className="bg-white rounded-sm shadow-sm">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 divide-x divide-y divide-[#f0f0f0]">
              {wishlistProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isLoggedIn={!!identity}
                  addingId={addingId}
                  onAddToCart={handleAddToCart}
                  wishlistIds={wishlistIds}
                  onToggleWishlist={handleToggleWishlist}
                  togglingWishlistId={togglingWishlistId}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

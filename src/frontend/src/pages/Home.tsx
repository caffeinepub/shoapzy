import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  ShoppingCart,
  SlidersHorizontal,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ProductCard } from "../components/ProductCard";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import type { CartItem, Product } from "../types";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { label: "Electronics", icon: "📱" },
  { label: "Fashion", icon: "👗" },
  { label: "Home & Furniture", icon: "🛋️" },
  { label: "Books", icon: "📚" },
  { label: "Sports", icon: "⚽" },
  { label: "Beauty", icon: "💄" },
  { label: "Toys", icon: "🧸" },
  { label: "Grocery", icon: "🛒" },
  { label: "Mobiles", icon: "📲" },
  { label: "Appliances", icon: "🏠" },
];

const FILTER_CATEGORIES = [
  "All",
  "Electronics",
  "Fashion",
  "Home & Furniture",
  "Appliances",
  "Beauty",
  "Toys",
  "Sports",
  "Books",
  "Grocery",
  "Mobile",
];

const BANNERS = [
  {
    id: 1,
    gradient: "from-[#2874f0] to-[#1a56b0]",
    title: "Big Billion Days",
    subtitle: "Biggest Sale of the Year — Up to 80% OFF",
    cta: "Shop Now",
  },
  {
    id: 2,
    gradient: "from-[#11998e] to-[#38ef7d]",
    title: "New Arrivals",
    subtitle: "Fresh Styles, Fresh Deals — Up to 60% OFF",
    cta: "Explore Now",
  },
  {
    id: 3,
    gradient: "from-[#6c2bd9] to-[#2874f0]",
    title: "Electronics Fest",
    subtitle: "Smartphones, Laptops & More — Min 40% OFF",
    cta: "Shop Electronics",
  },
];

// ─── Countdown Timer ──────────────────────────────────────────────────────────

function CountdownTimer({ label }: { label?: string }) {
  const [time, setTime] = useState({ h: 5, m: 47, s: 32 });
  useEffect(() => {
    const t = setInterval(() => {
      setTime((prev) => {
        let { h, m, s } = prev;
        s -= 1;
        if (s < 0) {
          s = 59;
          m -= 1;
        }
        if (m < 0) {
          m = 59;
          h -= 1;
        }
        if (h < 0) {
          h = 23;
          m = 59;
          s = 59;
        }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <div className="flex items-center gap-1 text-white">
      {label && <span className="text-xs font-medium mr-1">{label}</span>}
      {(["h", "m", "s"] as const).map((unit, i) => (
        <span key={unit}>
          <span className="bg-black/30 rounded px-1.5 py-0.5 text-xs font-mono font-bold">
            {pad(time[unit])}
          </span>
          {i < 2 && <span className="text-xs font-bold mx-0.5">:</span>}
        </span>
      ))}
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({
  title,
  badge,
  onViewAll,
}: {
  title: string;
  badge?: React.ReactNode;
  onViewAll?: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-[#f0f0f0]">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        {badge}
      </div>
      {onViewAll && (
        <button
          type="button"
          onClick={onViewAll}
          className="text-[#2874f0] text-sm font-medium border border-[#2874f0] px-3 py-1 rounded-sm hover:bg-[#2874f0] hover:text-white transition-colors"
        >
          VIEW ALL
        </button>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Home() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const [searchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState("All");
  const [bannerIdx, setBannerIdx] = useState(0);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const searchQuery = searchParams.get("search")?.toLowerCase() ?? "";
  const queryClient = useQueryClient();
  const [addingId, setAddingId] = useState<string | null>(null);
  const [togglingWishlistId, setTogglingWishlistId] = useState<string | null>(
    null,
  );
  const productsSectionRef = useRef<HTMLElement>(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => actor!.getProducts(),
    enabled: !!actor,
  });

  const { data: wishlistIds = [] } = useQuery<string[]>({
    queryKey: ["wishlist", identity?.getPrincipal().toString()],
    queryFn: () => actor!.getCallerWishlist(),
    enabled: !!actor && !!identity,
  });

  const activeProducts = (products as Product[]).filter((p) => p.isActive);

  // Deals of the Day: top 6 by highest discountPercent
  const dealProducts = [...activeProducts]
    .filter((p) => Number(p.discountPercent) > 0)
    .sort((a, b) => Number(b.discountPercent) - Number(a.discountPercent))
    .slice(0, 6);

  // Flash Sale: last 6 most recently added (by id order)
  const flashProducts = [...activeProducts].slice(-6).reverse();

  // Popular Products: first 12
  const popularProducts = activeProducts.slice(0, 12);

  // Filtered products for the grid
  const filtered = activeProducts.filter((p) => {
    const matchCat = activeCategory === "All" || p.category === activeCategory;
    const matchSearch =
      !searchQuery ||
      p.title.toLowerCase().includes(searchQuery) ||
      (p.description?.toLowerCase().includes(searchQuery) ?? false);
    const priceInRupees = Number(p.price) / 100;
    const matchMin = !minPrice || priceInRupees >= Number(minPrice);
    const matchMax = !maxPrice || priceInRupees <= Number(maxPrice);
    return matchCat && matchSearch && matchMin && matchMax;
  });

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

  const handleCategorySelect = (catLabel: string) => {
    // Map "Mobiles" tile → "Mobile" filter pill
    const mapped = catLabel === "Mobiles" ? "Mobile" : catLabel;
    setActiveCategory(mapped);
    // Scroll to products section
    setTimeout(() => {
      productsSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  };

  const nextBanner = useCallback(
    () => setBannerIdx((i) => (i + 1) % BANNERS.length),
    [],
  );
  const prevBanner = () =>
    setBannerIdx((i) => (i - 1 + BANNERS.length) % BANNERS.length);

  useEffect(() => {
    const t = setInterval(nextBanner, 5000);
    return () => clearInterval(t);
  }, [nextBanner]);

  const banner = BANNERS[bannerIdx];

  return (
    <div className="min-h-screen" style={{ background: "#f1f3f6" }}>
      {/* ── Hero Banner Carousel ── */}
      <section
        className="w-full bg-white relative overflow-hidden"
        style={{ height: 280 }}
      >
        <div
          className={`w-full h-full bg-gradient-to-r ${banner.gradient} flex items-center justify-center transition-all duration-500`}
        >
          <div className="text-center text-white px-8 select-none">
            <h1 className="text-4xl md:text-5xl font-bold mb-2 drop-shadow-md">
              {banner.title}
            </h1>
            <p className="text-base md:text-lg opacity-90 mb-5">
              {banner.subtitle}
            </p>
            <button
              type="button"
              onClick={() => {
                productsSectionRef.current?.scrollIntoView({
                  behavior: "smooth",
                });
              }}
              className="text-white font-bold px-8 py-2.5 rounded-sm text-sm tracking-wide transition-colors border-2 border-white hover:bg-white hover:text-[#2874f0]"
            >
              {banner.cta}
            </button>
          </div>
        </div>
        {/* Arrow controls */}
        <button
          type="button"
          onClick={prevBanner}
          aria-label="Previous banner"
          className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 shadow-md transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-[#333]" />
        </button>
        <button
          type="button"
          onClick={nextBanner}
          aria-label="Next banner"
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 shadow-md transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-[#333]" />
        </button>
        {/* Dots */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {BANNERS.map((b, i) => (
            <button
              key={b.id}
              type="button"
              aria-label={`Banner ${i + 1}`}
              onClick={() => setBannerIdx(i)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === bannerIdx ? "bg-white scale-125" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-2 md:px-4 space-y-3 py-3">
        {/* ── Top Categories Card ── */}
        <section className="bg-white shadow-sm rounded-sm p-4">
          <div className="overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            <div className="flex gap-4 min-w-max md:grid md:grid-cols-10 md:gap-2 md:min-w-0">
              {CATEGORIES.map((cat) => {
                const mappedCat =
                  cat.label === "Mobiles" ? "Mobile" : cat.label;
                const isActive = activeCategory === mappedCat;
                return (
                  <button
                    key={cat.label}
                    type="button"
                    data-ocid="category-icon"
                    onClick={() => handleCategorySelect(cat.label)}
                    className="flex flex-col items-center gap-1.5 group cursor-pointer"
                  >
                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-colors duration-200 ${
                        isActive
                          ? "bg-[#2874f0]/15 ring-2 ring-[#2874f0]"
                          : "bg-[#f1f3f6] group-hover:bg-[#2874f0]/10"
                      }`}
                    >
                      {cat.icon}
                    </div>
                    <span
                      className={`text-xs text-center leading-tight font-medium whitespace-nowrap transition-colors ${
                        isActive ? "text-[#2874f0]" : "text-foreground"
                      }`}
                    >
                      {cat.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Deals of the Day ── */}
        {dealProducts.length > 0 && (
          <section className="bg-white shadow-sm rounded-sm">
            <SectionHeader
              title="Deals of the Day"
              badge={
                <div className="flex items-center gap-1.5 bg-[#212121] rounded px-2 py-1">
                  <Clock className="w-3.5 h-3.5 text-white" />
                  <CountdownTimer />
                </div>
              }
              onViewAll={() => {
                setActiveCategory("All");
                productsSectionRef.current?.scrollIntoView({
                  behavior: "smooth",
                });
              }}
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 divide-x divide-y divide-[#f0f0f0]">
              {dealProducts.map((product) => (
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

        {/* ── Flash Sale ── */}
        {flashProducts.length > 0 && (
          <section className="bg-white shadow-sm rounded-sm">
            <SectionHeader
              title="Flash Sale"
              badge={
                <div className="flex items-center gap-1.5 bg-[#fb641b] rounded px-2 py-1">
                  <Zap className="w-3.5 h-3.5 text-white fill-white" />
                  <CountdownTimer />
                </div>
              }
              onViewAll={() => {
                setActiveCategory("All");
                productsSectionRef.current?.scrollIntoView({
                  behavior: "smooth",
                });
              }}
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 divide-x divide-y divide-[#f0f0f0]">
              {flashProducts.map((product) => (
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

        {/* ── Category Filter + Price Filters ── */}
        <div className="bg-white shadow-sm rounded-sm px-3 py-2.5 space-y-2">
          {/* Category pills */}
          <div
            data-ocid="category-filter"
            className="flex gap-2 overflow-x-auto pb-0.5"
            style={{ scrollbarWidth: "none" }}
          >
            {FILTER_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors duration-150 ${
                  activeCategory === cat
                    ? "bg-[#2874f0] text-white border-[#2874f0]"
                    : "bg-white text-foreground border-border hover:border-[#2874f0] hover:text-[#2874f0]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Filter toggle + price inputs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              data-ocid="filter-toggle"
              onClick={() => setShowFilters((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                showFilters || minPrice || maxPrice
                  ? "bg-[#2874f0] text-white border-[#2874f0]"
                  : "text-foreground border-border hover:border-[#2874f0] hover:text-[#2874f0]"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Price Filter
            </button>

            {showFilters && (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">₹</span>
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    data-ocid="filter-min-price"
                    className="w-24 text-xs border border-border rounded px-2 py-1 outline-none focus:border-[#2874f0] focus:ring-1 focus:ring-[#2874f0]/30"
                    min={0}
                  />
                </div>
                <span className="text-xs text-muted-foreground">—</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">₹</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    data-ocid="filter-max-price"
                    className="w-24 text-xs border border-border rounded px-2 py-1 outline-none focus:border-[#2874f0] focus:ring-1 focus:ring-[#2874f0]/30"
                    min={0}
                  />
                </div>
                {(minPrice || maxPrice) && (
                  <button
                    type="button"
                    onClick={() => {
                      setMinPrice("");
                      setMaxPrice("");
                    }}
                    className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}

            {/* Active filter summary */}
            {(minPrice || maxPrice) && !showFilters && (
              <span className="text-xs text-muted-foreground">
                {minPrice && maxPrice
                  ? `₹${minPrice} – ₹${maxPrice}`
                  : minPrice
                    ? `Min ₹${minPrice}`
                    : `Max ₹${maxPrice}`}
                <button
                  type="button"
                  onClick={() => {
                    setMinPrice("");
                    setMaxPrice("");
                  }}
                  className="ml-1.5 text-red-400 hover:text-red-600"
                >
                  ✕
                </button>
              </span>
            )}
          </div>
        </div>

        {/* ── Popular Products ── */}
        {!searchQuery &&
          activeCategory === "All" &&
          !minPrice &&
          !maxPrice &&
          popularProducts.length > 0 && (
            <section className="bg-white shadow-sm rounded-sm">
              <SectionHeader title="Popular Products" onViewAll={undefined} />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 divide-x divide-y divide-[#f0f0f0]">
                {popularProducts.map((product) => (
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

        {/* ── All Products / Filtered Grid ── */}
        <section
          id="products-section"
          ref={productsSectionRef}
          className="bg-white shadow-sm rounded-sm"
        >
          <div className="px-4 pt-4 pb-2 border-b border-[#f0f0f0] flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">
              {activeCategory === "All" ? "All Products" : activeCategory}
              {searchQuery && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  — results for &ldquo;{searchQuery}&rdquo;
                </span>
              )}
            </h2>
            <span className="text-xs text-muted-foreground">
              {!isLoading && `${filtered.length} items`}
            </span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 divide-x divide-y divide-[#f0f0f0]">
              {Array.from({ length: 8 }).map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
                <div key={i} className="p-3 space-y-2">
                  <div className="aspect-square bg-[#f1f3f6] animate-pulse rounded" />
                  <div className="h-3 bg-[#f1f3f6] animate-pulse rounded w-3/4" />
                  <div className="h-3 bg-[#f1f3f6] animate-pulse rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div data-ocid="empty-state" className="text-center py-20 px-4">
              <ShoppingCart className="w-14 h-14 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-lg font-semibold text-foreground mb-1">
                No products found
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Try a different category or search term
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveCategory("All");
                  setMinPrice("");
                  setMaxPrice("");
                }}
                className="text-[#2874f0] text-sm font-medium border border-[#2874f0] px-4 py-1.5 rounded-sm hover:bg-[#2874f0] hover:text-white transition-colors"
              >
                View All Products
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 divide-x divide-y divide-[#f0f0f0]">
              {filtered.map((product) => (
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
          )}
        </section>
      </div>
    </div>
  );
}

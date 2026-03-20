import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ShoppingCart, Star } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { CartItem, Product } from "../backend";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const CATEGORIES = [
  "All",
  "Electronics",
  "Fashion",
  "Home & Kitchen",
  "Books",
  "Sports",
  "Beauty",
  "Toys",
  "Grocery",
];

export default function Home() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const [searchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState("All");
  const searchQuery = searchParams.get("search")?.toLowerCase() ?? "";
  const queryClient = useQueryClient();
  const [addingId, setAddingId] = useState<string | null>(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => actor!.getProducts(),
    enabled: !!actor,
  });

  const filtered = (products as Product[]).filter((p) => {
    const matchCat = activeCategory === "All" || p.category === activeCategory;
    const matchSearch =
      !searchQuery ||
      p.title.toLowerCase().includes(searchQuery) ||
      p.description.toLowerCase().includes(searchQuery);
    return p.isActive && matchCat && matchSearch;
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

  return (
    <div>
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-[#1a1a2e] to-[#e94560] text-white py-12 px-4 text-center">
        <h1 className="text-4xl font-bold mb-2">Shop Everything, Anytime</h1>
        <p className="text-lg opacity-80">
          Best deals from thousands of sellers across India
        </p>
      </div>

      {/* Category Filter */}
      <div className="bg-white shadow-sm sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 flex gap-2 overflow-x-auto py-3">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(cat)}
              className={
                activeCategory === cat
                  ? "bg-orange-500 hover:bg-orange-600 shrink-0"
                  : "shrink-0"
              }
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Products */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
              <div key={i} className="bg-white rounded-xl h-64 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-xl">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl shadow hover:shadow-lg transition-shadow border border-gray-100 flex flex-col"
              >
                <Link to={`/product/${product.id}`}>
                  <div className="aspect-square bg-gray-100 rounded-t-xl overflow-hidden">
                    <img
                      src={product.image.getDirectURL()}
                      alt={product.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.png";
                      }}
                    />
                  </div>
                </Link>
                <div className="p-3 flex flex-col flex-1">
                  <Link to={`/product/${product.id}`}>
                    <h3 className="font-semibold text-gray-800 text-sm line-clamp-2 hover:text-orange-500">
                      {product.title}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs text-gray-400">(24)</span>
                  </div>
                  <Badge variant="secondary" className="w-fit mt-1 text-xs">
                    {product.category}
                  </Badge>
                  <div className="mt-auto pt-2 flex items-center justify-between">
                    <span className="text-lg font-bold text-orange-500">
                      ₹{(Number(product.price) / 100).toLocaleString()}
                    </span>
                    <Button
                      size="sm"
                      className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-2"
                      onClick={() => handleAddToCart(product)}
                      disabled={addingId === product.id || !identity}
                    >
                      {addingId === product.id ? (
                        "..."
                      ) : (
                        <ShoppingCart className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

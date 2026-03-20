import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ShoppingCart, Star } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { CartItem, Product } from "../backend";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [qty, setQty] = useState(1);

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => actor!.getProducts(),
    enabled: !!actor,
  });

  const product = (products as Product[]).find((p) => p.id === id);

  const handleAddToCart = async () => {
    if (!actor || !identity || !product) return;
    setAdding(true);
    try {
      for (let i = 0; i < qty; i++) {
        await actor.addToCart({
          productId: product.id,
          seller: product.seller,
          quantity: BigInt(1),
          price: product.price,
        } as CartItem);
      }
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      navigate("/cart");
    } finally {
      setAdding(false);
    }
  };

  if (!product)
    return <div className="text-center py-20">Product not found</div>;

  const maxQty = Math.min(10, Number(product.stock));
  const qtyOptions = Array.from({ length: maxQty }, (_, i) => i + 1);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>
      <div className="bg-white rounded-2xl shadow p-6 flex flex-col md:flex-row gap-8">
        <div className="md:w-1/2">
          <img
            src={product.image.getDirectURL()}
            alt={product.title}
            className="w-full rounded-xl object-cover aspect-square"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder.png";
            }}
          />
        </div>
        <div className="md:w-1/2 flex flex-col gap-4">
          <h1 className="text-2xl font-bold text-gray-900">{product.title}</h1>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm text-gray-400 ml-1">(24 reviews)</span>
          </div>
          <p className="text-3xl font-bold text-orange-500">
            ₹{(Number(product.price) / 100).toLocaleString()}
          </p>
          <Badge variant="secondary">{product.category}</Badge>
          <p className="text-gray-600">{product.description}</p>
          <p className="text-sm text-green-600 font-medium">
            In Stock: {Number(product.stock)} units
          </p>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Qty:</span>
            <select
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="border rounded px-2 py-1"
            >
              {qtyOptions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <Button
            onClick={handleAddToCart}
            disabled={adding || !identity}
            className="bg-orange-500 hover:bg-orange-600 text-white py-6 text-lg"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            {adding ? "Adding..." : identity ? "Add to Cart" : "Login to Buy"}
          </Button>
        </div>
      </div>
    </div>
  );
}

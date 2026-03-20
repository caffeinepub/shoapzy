import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, Store } from "lucide-react";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function SellerRegister() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [shopName, setShopName] = useState("");
  const [shopDesc, setShopDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile", identity?.getPrincipal().toString()],
    queryFn: () => actor!.getCallerUserProfile(),
    enabled: !!actor && !!identity,
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor || !shopName.trim()) return;
    setLoading(true);
    try {
      await actor.registerAsSeller(shopName, shopDesc || null);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  if (profile?.sellerApproved)
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <Store className="w-16 h-16 mx-auto mb-4 text-green-500" />
        <h2 className="text-2xl font-bold text-green-600">
          You're an approved seller!
        </h2>
        <p className="text-gray-500 mt-2">
          Go to your seller dashboard to manage products.
        </p>
      </div>
    );

  if (done || profile?.role === "seller")
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <Clock className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
        <h2 className="text-2xl font-bold">Registration Submitted!</h2>
        <p className="text-gray-500 mt-2">
          Admin will review and approve your seller account.
        </p>
      </div>
    );

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl shadow p-8">
        <div className="flex justify-center mb-4">
          <Store className="w-12 h-12 text-orange-500" />
        </div>
        <h1 className="text-2xl font-bold text-center mb-6">
          Register as Seller
        </h1>
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            {/* biome-ignore lint/a11y/noLabelWithoutControl: label wraps input */}
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Shop Name *
              <Input
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="My Awesome Shop"
                required
              />
            </label>
          </div>
          <div>
            {/* biome-ignore lint/a11y/noLabelWithoutControl: label wraps textarea */}
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Shop Description
              <textarea
                value={shopDesc}
                onChange={(e) => setShopDesc(e.target.value)}
                placeholder="Tell buyers about your shop..."
                rows={3}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 font-normal"
              />
            </label>
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600"
          >
            {loading ? "Submitting..." : "Submit Registration"}
          </Button>
        </form>
      </div>
    </div>
  );
}

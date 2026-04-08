import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, Clock, ShoppingBag, Store, XCircle } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function SellerRegister() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
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

  if (profile?.sellerApproved) {
    return (
      <div
        style={{ background: "#f1f3f6" }}
        className="min-h-screen flex items-center justify-center p-4"
      >
        <div className="bg-white rounded-lg shadow p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-green-700 mb-2">
            You're an approved seller!
          </h2>
          <p className="text-gray-500 text-sm mb-5">
            Go to your seller dashboard to manage your products and orders.
          </p>
          <Button
            onClick={() => navigate("/seller/dashboard")}
            className="text-white"
            style={{ background: "#2874f0" }}
          >
            Go to Seller Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (done || profile?.role === "seller") {
    return (
      <div
        style={{ background: "#f1f3f6" }}
        className="min-h-screen flex items-center justify-center p-4"
      >
        <div className="bg-white rounded-lg shadow p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Registration Submitted!
          </h2>
          <p className="text-gray-500 text-sm mb-2">
            Your application is under review.
          </p>
          <p className="text-gray-400 text-xs">
            Admin will approve your seller account shortly. You'll be able to
            start listing products once approved.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded border border-yellow-200 bg-yellow-50 text-yellow-700">
            <Clock className="w-3.5 h-3.5" /> Pending Admin Approval
          </div>
        </div>
      </div>
    );
  }

  const isRejected =
    (profile as { sellerStatus?: string } | undefined)?.sellerStatus ===
    "rejected";

  return (
    <div
      style={{ background: "#f1f3f6" }}
      className="min-h-screen flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-lg shadow w-full max-w-md overflow-hidden">
        {/* Blue header */}
        <div
          style={{ background: "#2874f0" }}
          className="px-6 py-5 text-center"
        >
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
            <Store className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-white text-xl font-bold">Become a Seller</h1>
          <p className="text-blue-100 text-xs mt-1">
            Start selling on Shoapzy — reach millions of buyers
          </p>
        </div>

        {isRejected && (
          <div className="mx-6 mt-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
            <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-xs text-red-600">
              Your previous registration was rejected. You may re-apply with
              updated information.
            </p>
          </div>
        )}

        <form onSubmit={handleRegister} className="p-6 space-y-4">
          <div>
            <label
              htmlFor="shop-name"
              className="text-xs font-semibold text-gray-600 block mb-1.5 uppercase tracking-wide"
            >
              Shop Name *
            </label>
            <Input
              id="shop-name"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="e.g. TrendyFashion Store"
              required
              className="border-gray-200 focus:border-[#2874f0]"
            />
          </div>
          <div>
            <label
              htmlFor="shop-desc"
              className="text-xs font-semibold text-gray-600 block mb-1.5 uppercase tracking-wide"
            >
              Shop Description
            </label>
            <textarea
              id="shop-desc"
              value={shopDesc}
              onChange={(e) => setShopDesc(e.target.value)}
              placeholder="Tell buyers about your shop and what you sell..."
              rows={3}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-[#2874f0] font-normal resize-none"
            />
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <ShoppingBag
                className="w-4 h-4 mt-0.5 shrink-0"
                style={{ color: "#2874f0" }}
              />
              <p className="text-xs text-blue-700">
                After submission, your application will be reviewed by the
                admin. You'll be notified once approved and can start listing
                products.
              </p>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading || !shopName.trim()}
            className="w-full text-white font-semibold py-5"
            style={{ background: "#2874f0" }}
            data-ocid="seller_register.submit"
          >
            {loading ? "Submitting..." : "Submit Registration"}
          </Button>
        </form>
      </div>
    </div>
  );
}

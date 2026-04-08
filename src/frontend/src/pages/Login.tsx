import { ShieldCheck, ShoppingBag } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function Login() {
  const { identity, login, isLoggingIn } = useInternetIdentity();
  const navigate = useNavigate();

  useEffect(() => {
    if (identity) navigate("/");
  }, [identity, navigate]);

  return (
    <div
      style={{ background: "#f1f3f6" }}
      className="min-h-screen flex items-center justify-center p-4"
    >
      {/* Shoapzy branding top bar */}
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2">
            <div
              className="w-10 h-10 rounded flex items-center justify-center"
              style={{ background: "#2874f0" }}
            >
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <span
              className="text-2xl font-extrabold tracking-tight"
              style={{ color: "#2874f0" }}
            >
              Shoapzy
            </span>
          </div>
          <p className="text-gray-500 text-xs mt-2">
            India's trusted multi-vendor marketplace
          </p>
        </div>

        {/* Login card */}
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-lg font-bold text-gray-800 mb-1 text-center">
            Login or Sign up
          </h2>
          <p className="text-gray-500 text-sm text-center mb-6">
            Access your account securely with Internet Identity — no password
            needed
          </p>

          <Button
            data-ocid="login.primary_button"
            onClick={login}
            disabled={isLoggingIn}
            className="w-full text-white font-semibold py-5 text-base"
            style={{ background: "#fb641b" }}
          >
            {isLoggingIn ? "Connecting..." : "Continue with Internet Identity"}
          </Button>

          <div className="mt-5 flex items-start gap-2 bg-gray-50 border border-gray-100 rounded-lg p-3">
            <ShieldCheck className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
            <p className="text-xs text-gray-500">
              <span className="font-semibold text-gray-700">
                Secure & Decentralized
              </span>{" "}
              — Internet Identity gives you cryptographic login without storing
              any passwords. Your data stays yours.
            </p>
          </div>

          <div className="mt-6 border-t border-gray-100 pt-5 grid grid-cols-3 gap-3 text-center">
            {["100% Secure", "No Password", "Fast Login"].map((item) => (
              <div key={item} className="text-xs text-gray-400 font-medium">
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Seller CTA */}
        <p className="text-center text-xs text-gray-400 mt-4">
          Want to sell on Shoapzy?{" "}
          <button
            type="button"
            onClick={() => navigate("/seller/register")}
            className="font-semibold underline"
            style={{ color: "#2874f0" }}
          >
            Become a Seller
          </button>
        </p>
      </div>
    </div>
  );
}

import { ShoppingBag } from "lucide-react";
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
    <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-[#1a1a2e] to-[#16213e]">
      <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-orange-100 p-4 rounded-full">
            <ShoppingBag className="w-12 h-12 text-orange-500" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome to Shoapzy
        </h1>
        <p className="text-gray-500 mb-8">
          India's trusted marketplace for buyers & sellers
        </p>
        <Button
          data-ocid="login.primary_button"
          onClick={login}
          disabled={isLoggingIn}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white text-lg py-6"
        >
          {isLoggingIn ? "Connecting..." : "Login with Internet Identity"}
        </Button>
        <p className="text-sm text-gray-400 mt-4">
          Secure, decentralized login — no password needed
        </p>
      </div>
    </div>
  );
}

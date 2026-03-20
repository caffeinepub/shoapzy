import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  LogOut,
  Search,
  ShoppingCart,
  Store,
  User,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserRole } from "../backend";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export default function Navbar() {
  const { identity, login, clear } = useInternetIdentity();
  const { actor } = useActor();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { data: cart } = useQuery({
    queryKey: ["cart", identity?.getPrincipal().toString()],
    queryFn: () => actor!.getCallerCart(),
    enabled: !!actor && !!identity,
  });

  const { data: role } = useQuery({
    queryKey: ["role", identity?.getPrincipal().toString()],
    queryFn: () => actor!.getCallerUserRole(),
    enabled: !!actor && !!identity,
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", identity?.getPrincipal().toString()],
    queryFn: () => actor!.getCallerUserProfile(),
    enabled: !!actor && !!identity,
  });

  const cartCount =
    cart?.reduce((sum, item) => sum + Number(item.quantity), 0) ?? 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/?search=${encodeURIComponent(search)}`);
  };

  return (
    <nav className="bg-[#1a1a2e] text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-4 h-16">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold text-orange-400 shrink-0">
            Shoapzy
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white text-gray-900 h-9"
            />
            <Button
              type="submit"
              size="sm"
              className="bg-orange-500 hover:bg-orange-600 h-9"
            >
              <Search className="w-4 h-4" />
            </Button>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {identity ? (
              <>
                {role === UserRole.admin && (
                  <Link to="/admin">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:text-orange-400"
                    >
                      <LayoutDashboard className="w-4 h-4 mr-1" /> Admin
                    </Button>
                  </Link>
                )}
                {(profile?.role === "seller" || role !== UserRole.admin) && (
                  <Link to="/seller/dashboard">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:text-orange-400"
                    >
                      <Store className="w-4 h-4 mr-1" /> Seller
                    </Button>
                  </Link>
                )}
                <Link to="/orders">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:text-orange-400"
                  >
                    <User className="w-4 h-4 mr-1" /> Orders
                  </Button>
                </Link>
                <Link to="/cart" className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:text-orange-400"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </Button>
                </Link>
                <Button
                  onClick={clear}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:text-red-400"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Button
                onClick={login}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                Login / Sign Up
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

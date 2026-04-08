import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeftRight,
  BookMarked,
  ChevronDown,
  Gift,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  ShoppingCart,
  Store,
  User,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useActor } from "../hooks/useActor";
import { useCompare } from "../hooks/useCompare";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { UserRole } from "../types";

const CATEGORIES = [
  { label: "Electronics", path: "/?category=Electronics" },
  { label: "Fashion", path: "/?category=Fashion" },
  { label: "Home & Furniture", path: "/?category=Home" },
  { label: "Books", path: "/?category=Books" },
  { label: "Sports", path: "/?category=Sports" },
  { label: "Grocery", path: "/?category=Grocery" },
  { label: "Toys", path: "/?category=Toys" },
  { label: "Beauty", path: "/?category=Beauty" },
  { label: "Mobiles", path: "/?category=Mobiles" },
  { label: "Appliances", path: "/?category=Appliances" },
];

export default function Navbar() {
  const { identity, login, clear } = useInternetIdentity();
  const { actor } = useActor();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);

  const { compareCount } = useCompare();

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

  const { data: wishlistIds = [] } = useQuery<string[]>({
    queryKey: ["wishlist", identity?.getPrincipal().toString()],
    queryFn: () => actor!.getCallerWishlist(),
    enabled: !!actor && !!identity,
  });

  const cartCount =
    cart?.reduce((sum, item) => sum + Number(item.quantity), 0) ?? 0;
  const wishlistCount = wishlistIds.length;
  const isAdmin = role === UserRole.admin;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/?search=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <nav className="sticky top-0 z-50 shadow-md" data-ocid="navbar">
      {/* Main bar */}
      <div
        style={{
          background: "linear-gradient(90deg, #2874f0 0%, #1a5fd9 100%)",
        }}
        className="text-white"
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex items-center gap-3 h-14">
            {/* Logo */}
            <Link
              to="/"
              className="shrink-0 flex flex-col leading-none select-none"
              data-ocid="nav-logo"
            >
              <span
                className="text-white font-bold text-xl tracking-tight"
                style={{ fontFamily: "sans-serif" }}
              >
                Shoapzy
                <sup
                  className="text-[10px] font-semibold italic ml-0.5"
                  style={{ color: "#ffe500", verticalAlign: "super" }}
                >
                  Plus
                </sup>
              </span>
              <span className="text-[9px] italic text-blue-200 leading-none mt-px">
                Explore{" "}
                <span className="text-yellow-300 not-italic font-bold">
                  Plus
                </span>
              </span>
            </Link>

            {/* Search bar with category dropdown */}
            <form
              onSubmit={handleSearch}
              className="flex-1 flex h-9 rounded-sm overflow-visible shadow-sm min-w-0"
              data-ocid="nav-search"
            >
              {/* Category dropdown trigger */}
              <div className="relative hidden md:block shrink-0">
                <button
                  type="button"
                  onClick={() => setCatOpen((v) => !v)}
                  onBlur={() => setTimeout(() => setCatOpen(false), 150)}
                  className="h-full flex items-center gap-1 px-3 text-xs font-medium text-gray-700 bg-gray-100 border-r border-gray-300 hover:bg-gray-200 transition-colors whitespace-nowrap"
                  data-ocid="nav-category-dropdown-btn"
                  aria-haspopup="listbox"
                  aria-expanded={catOpen}
                >
                  All Categories
                  <ChevronDown className="w-3 h-3 mt-px" />
                </button>
                {catOpen && (
                  <div
                    className="absolute left-0 top-full mt-0.5 w-52 bg-white rounded shadow-lg border border-gray-100 py-1 z-50 max-h-64 overflow-y-auto"
                    data-ocid="nav-category-dropdown"
                  >
                    {CATEGORIES.map((cat) => (
                      <Link
                        key={cat.label}
                        to={cat.path}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        onClick={() => setCatOpen(false)}
                      >
                        {cat.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <input
                type="text"
                placeholder="Search for products, brands and more"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 px-4 text-sm text-gray-800 placeholder-gray-400 outline-none min-w-0 bg-white"
              />
              <button
                type="submit"
                className="px-4 flex items-center justify-center shrink-0 transition-colors hover:opacity-90"
                style={{ background: "#fb641b" }}
                aria-label="Search"
              >
                <Search className="w-5 h-5 text-white" />
              </button>
            </form>

            {/* Desktop actions */}
            <div className="hidden md:flex items-center gap-1 shrink-0">
              {/* Become a Seller */}
              <Link
                to="/seller/register"
                className="px-3 py-1.5 text-sm font-medium text-white hover:text-yellow-200 whitespace-nowrap transition-colors"
                data-ocid="nav-become-seller"
              >
                Become a Seller
              </Link>

              {/* Compare link with badge */}
              <Link
                to="/compare"
                className="relative flex items-center gap-1.5 px-2 py-1.5 text-sm font-semibold text-white hover:text-yellow-200 transition-colors"
                data-ocid="nav-compare"
                aria-label="Compare products"
              >
                <span className="relative">
                  <ArrowLeftRight className="w-5 h-5" />
                  {compareCount > 0 && (
                    <span
                      className="absolute -top-2 -right-2 text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none"
                      style={{ background: "#fb641b", color: "#fff" }}
                      data-ocid="nav-compare-badge"
                    >
                      {compareCount}
                    </span>
                  )}
                </span>
              </Link>

              {/* Account Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setAccountOpen((v) => !v)}
                  onBlur={() => setTimeout(() => setAccountOpen(false), 150)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-white hover:text-yellow-200 whitespace-nowrap transition-colors"
                  data-ocid="nav-account-btn"
                >
                  <User className="w-4 h-4" />
                  {identity ? "Account" : "Login"}
                  <ChevronDown className="w-3 h-3 mt-px" />
                </button>

                {accountOpen && (
                  <div
                    className="absolute right-0 top-full mt-1 w-56 bg-white rounded shadow-lg border border-gray-100 py-1 z-50"
                    data-ocid="nav-account-dropdown"
                  >
                    {identity ? (
                      <>
                        <div className="px-4 py-2.5 border-b border-gray-100">
                          <p className="text-xs text-gray-500">Signed in</p>
                        </div>
                        <Link
                          to="/orders"
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          data-ocid="nav-my-orders"
                          onClick={() => setAccountOpen(false)}
                        >
                          <ShoppingCart className="w-4 h-4 text-blue-600" />
                          My Orders
                        </Link>
                        <Link
                          to="/wishlist"
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          data-ocid="nav-wishlist-link"
                          onClick={() => setAccountOpen(false)}
                        >
                          <Heart className="w-4 h-4 text-red-500" />
                          Wishlist
                          {wishlistCount > 0 && (
                            <span className="ml-auto text-xs font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                              {wishlistCount}
                            </span>
                          )}
                        </Link>
                        <Link
                          to="/saved-addresses"
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          data-ocid="nav-saved-addresses"
                          onClick={() => setAccountOpen(false)}
                        >
                          <BookMarked className="w-4 h-4 text-blue-600" />
                          Saved Addresses
                        </Link>
                        <Link
                          to="/referral"
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          data-ocid="nav-referral"
                          onClick={() => setAccountOpen(false)}
                        >
                          <Gift className="w-4 h-4 text-purple-500" />
                          Refer &amp; Earn
                        </Link>
                        <Link
                          to="/seller/dashboard"
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          data-ocid="nav-seller-dashboard"
                          onClick={() => setAccountOpen(false)}
                        >
                          <Store className="w-4 h-4 text-blue-600" />
                          Seller Dashboard
                        </Link>
                        {isAdmin && (
                          <Link
                            to="/admin"
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            data-ocid="nav-admin-dashboard"
                            onClick={() => setAccountOpen(false)}
                          >
                            <LayoutDashboard className="w-4 h-4 text-blue-600" />
                            Admin Dashboard
                          </Link>
                        )}
                        <div className="border-t border-gray-100 my-1" />
                        <button
                          type="button"
                          onClick={clear}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          data-ocid="nav-logout"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-xs text-gray-500 mb-2">
                            New customer?
                          </p>
                          <Link
                            to="/login"
                            onClick={() => setAccountOpen(false)}
                            className="text-sm font-semibold text-blue-600 hover:underline"
                            data-ocid="nav-login-link"
                          >
                            Sign Up
                          </Link>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            login();
                            setAccountOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          data-ocid="nav-login-btn"
                        >
                          <User className="w-4 h-4 text-blue-600" />
                          Login
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Wishlist icon (logged in only) */}
              {identity && (
                <Link
                  to="/wishlist"
                  className="relative flex items-center gap-1.5 px-2 py-1.5 text-sm font-semibold text-white hover:text-yellow-200 transition-colors"
                  data-ocid="nav-wishlist"
                  aria-label="Wishlist"
                >
                  <span className="relative">
                    <Heart className="w-5 h-5" />
                    {wishlistCount > 0 && (
                      <span
                        className="absolute -top-2 -right-2 text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none"
                        style={{ background: "#fb641b", color: "#fff" }}
                        data-ocid="nav-wishlist-badge"
                      >
                        {wishlistCount > 99 ? "99+" : wishlistCount}
                      </span>
                    )}
                  </span>
                </Link>
              )}

              {/* Cart */}
              <Link
                to="/cart"
                className="relative flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-white hover:text-yellow-200 transition-colors"
                data-ocid="nav-cart"
              >
                <span className="relative">
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span
                      className="absolute -top-2 -right-2 text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none"
                      style={{ background: "#fb641b", color: "#fff" }}
                      data-ocid="nav-cart-badge"
                    >
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  )}
                </span>
                <span className="hidden sm:inline">Cart</span>
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              type="button"
              className="md:hidden ml-auto p-1 text-white"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              data-ocid="nav-hamburger"
            >
              {mobileOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Category bar */}
      <div
        className="hidden md:block border-b border-blue-200"
        style={{ background: "#2f7af0" }}
        data-ocid="nav-categories"
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-0 overflow-x-auto">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.label}
                to={cat.path}
                className="px-4 py-2.5 text-xs font-medium text-white hover:text-yellow-200 whitespace-nowrap transition-colors border-b-2 border-transparent hover:border-yellow-300"
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden border-t border-blue-400"
          style={{ background: "#1a5fd9" }}
          data-ocid="nav-mobile-menu"
        >
          <div className="px-4 py-3 space-y-1">
            {identity ? (
              <>
                <Link
                  to="/orders"
                  className="flex items-center gap-2 py-2.5 text-sm text-white hover:text-yellow-200 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  <ShoppingCart className="w-4 h-4" /> My Orders
                </Link>
                <Link
                  to="/wishlist"
                  className="flex items-center gap-2 py-2.5 text-sm text-white hover:text-yellow-200 transition-colors"
                  data-ocid="nav-mobile-wishlist"
                  onClick={() => setMobileOpen(false)}
                >
                  <Heart className="w-4 h-4" /> Wishlist
                  {wishlistCount > 0 && (
                    <span
                      className="ml-1 text-xs font-bold rounded-full px-1.5 py-0.5"
                      style={{ background: "#fb641b" }}
                    >
                      {wishlistCount}
                    </span>
                  )}
                </Link>
                <Link
                  to="/compare"
                  className="flex items-center gap-2 py-2.5 text-sm text-white hover:text-yellow-200 transition-colors"
                  data-ocid="nav-mobile-compare"
                  onClick={() => setMobileOpen(false)}
                >
                  <ArrowLeftRight className="w-4 h-4" /> Compare
                  {compareCount > 0 && (
                    <span
                      className="ml-1 text-xs font-bold rounded-full px-1.5 py-0.5"
                      style={{ background: "#fb641b" }}
                    >
                      {compareCount}
                    </span>
                  )}
                </Link>
                <Link
                  to="/saved-addresses"
                  className="flex items-center gap-2 py-2.5 text-sm text-white hover:text-yellow-200 transition-colors"
                  data-ocid="nav-mobile-saved-addresses"
                  onClick={() => setMobileOpen(false)}
                >
                  <BookMarked className="w-4 h-4" /> Saved Addresses
                </Link>
                <Link
                  to="/referral"
                  className="flex items-center gap-2 py-2.5 text-sm text-white hover:text-yellow-200 transition-colors"
                  data-ocid="nav-mobile-referral"
                  onClick={() => setMobileOpen(false)}
                >
                  <Gift className="w-4 h-4" /> Refer &amp; Earn
                </Link>
                <Link
                  to="/seller/dashboard"
                  className="flex items-center gap-2 py-2.5 text-sm text-white hover:text-yellow-200 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  <Store className="w-4 h-4" /> Seller Dashboard
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-2 py-2.5 text-sm text-white hover:text-yellow-200 transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    <LayoutDashboard className="w-4 h-4" /> Admin Dashboard
                  </Link>
                )}
                <Link
                  to="/cart"
                  className="flex items-center gap-2 py-2.5 text-sm text-white hover:text-yellow-200 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  <ShoppingCart className="w-4 h-4" /> Cart
                  {cartCount > 0 && (
                    <span
                      className="ml-1 text-xs font-bold rounded-full px-1.5 py-0.5"
                      style={{ background: "#fb641b" }}
                    >
                      {cartCount}
                    </span>
                  )}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    clear();
                    setMobileOpen(false);
                  }}
                  className="flex items-center gap-2 py-2.5 text-sm text-red-300 hover:text-red-200 transition-colors w-full"
                  data-ocid="nav-mobile-logout"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  login();
                  setMobileOpen(false);
                }}
                className="flex items-center gap-2 py-2.5 text-sm text-white hover:text-yellow-200 transition-colors w-full"
                data-ocid="nav-mobile-login"
              >
                <User className="w-4 h-4" /> Login / Sign Up
              </button>
            )}
            <div className="border-t border-blue-400 pt-2 mt-1">
              <p className="text-xs text-blue-200 mb-1.5 font-medium">
                Categories
              </p>
              <div className="grid grid-cols-2 gap-x-4">
                {CATEGORIES.map((cat) => (
                  <Link
                    key={cat.label}
                    to={cat.path}
                    className="py-1.5 text-sm text-white hover:text-yellow-200 transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    {cat.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="border-t border-blue-400 pt-2 mt-1">
              <Link
                to="/seller/register"
                className="flex items-center gap-2 py-2 text-sm font-medium text-yellow-300 hover:text-yellow-200 transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                <Store className="w-4 h-4" /> Become a Seller
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

import { useQuery } from "@tanstack/react-query";
import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import AdminDashboard from "./pages/AdminDashboard";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Orders from "./pages/Orders";
import ProductDetail from "./pages/ProductDetail";
import SellerDashboard from "./pages/SellerDashboard";
import SellerProfile from "./pages/SellerProfile";
import SellerRegister from "./pages/SellerRegister";
import SetupAdmin from "./pages/SetupAdmin";
import Wishlist from "./pages/Wishlist";
import { UserRole } from "./types";

// Batch 5 pages — lazy loaded
const SavedAddresses = lazy(() => import("./pages/SavedAddresses"));
const Compare = lazy(() => import("./pages/Compare"));
const Referral = lazy(() => import("./pages/Referral"));

function PageLoader() {
  return (
    <div
      className="min-h-[60vh] flex items-center justify-center"
      style={{ background: "#f1f3f6" }}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { identity } = useInternetIdentity();
  const { actor } = useActor();
  const isLoggedIn = !!identity;

  const { data: role } = useQuery({
    queryKey: ["role", identity?.getPrincipal().toString()],
    queryFn: () => actor!.getCallerUserRole(),
    enabled: !!actor && isLoggedIn,
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route
            path="/cart"
            element={isLoggedIn ? <Cart /> : <Navigate to="/login" />}
          />
          <Route
            path="/checkout"
            element={isLoggedIn ? <Checkout /> : <Navigate to="/login" />}
          />
          <Route
            path="/orders"
            element={isLoggedIn ? <Orders /> : <Navigate to="/login" />}
          />
          <Route
            path="/wishlist"
            element={isLoggedIn ? <Wishlist /> : <Navigate to="/login" />}
          />
          <Route
            path="/seller/register"
            element={isLoggedIn ? <SellerRegister /> : <Navigate to="/login" />}
          />
          <Route
            path="/seller/dashboard"
            element={
              isLoggedIn ? <SellerDashboard /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/admin"
            element={
              isLoggedIn && role === UserRole.admin ? (
                <AdminDashboard />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/setup-admin" element={<SetupAdmin />} />
          <Route path="/seller/:principalId" element={<SellerProfile />} />

          {/* Batch 5 routes */}
          <Route
            path="/saved-addresses"
            element={
              isLoggedIn ? (
                <Suspense fallback={<PageLoader />}>
                  <SavedAddresses />
                </Suspense>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/compare"
            element={
              <Suspense fallback={<PageLoader />}>
                <Compare />
              </Suspense>
            }
          />
          <Route
            path="/referral"
            element={
              isLoggedIn ? (
                <Suspense fallback={<PageLoader />}>
                  <Referral />
                </Suspense>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

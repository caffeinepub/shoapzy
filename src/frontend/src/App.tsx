import { useQuery } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { UserRole } from "./backend";
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
import SellerRegister from "./pages/SellerRegister";
import SetupAdmin from "./pages/SetupAdmin";

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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
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
          path="/seller/register"
          element={isLoggedIn ? <SellerRegister /> : <Navigate to="/login" />}
        />
        <Route
          path="/seller/dashboard"
          element={isLoggedIn ? <SellerDashboard /> : <Navigate to="/login" />}
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
      </Routes>
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

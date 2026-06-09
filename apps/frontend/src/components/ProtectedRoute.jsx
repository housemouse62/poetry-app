import { Outlet, Navigate } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";

export const ProtectedRoute = () => {
  let auth = useAuth();
  return auth.token ? <Outlet /> : <Navigate to="/login" />;
};

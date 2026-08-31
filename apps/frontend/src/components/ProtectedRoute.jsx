import { Outlet, Navigate } from "react-router";
import { useAuth } from "../context/useAuth";

export const ProtectedRoute = () => {
  let auth = useAuth();
  return auth.token ? <Outlet /> : <Navigate to="/login" />;
};

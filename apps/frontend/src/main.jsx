import { StrictMode } from "react";
import "./index.css";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import routes from "./routes.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import RouteLoading from "./components/RouteLoading.jsx";

const router = createBrowserRouter(routes);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} fallbackElement={<RouteLoading />} />
    </AuthProvider>
  </StrictMode>,
);

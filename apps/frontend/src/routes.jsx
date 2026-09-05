import ErrorPage from "./errorPage";
import { ProtectedRoute } from "./components/ProtectedRoute.jsx";
import RouteLoading from "./components/RouteLoading.jsx";

const lazyRoute = (loadModule) => async () => {
  const { default: Component } = await loadModule();
  return { Component };
};

const routes = [
  {
    path: "/",
    lazy: lazyRoute(() => import("./pages/Home/Home.jsx")),
    HydrateFallback: RouteLoading,
    errorElement: <ErrorPage />,
  },
  {
    path: "/register",
    lazy: lazyRoute(() => import("./pages/Register/Register.jsx")),
    HydrateFallback: RouteLoading,
    errorElement: <ErrorPage />,
  },
  {
    path: "/login",
    lazy: lazyRoute(() => import("./pages/Login/Login.jsx")),
    HydrateFallback: RouteLoading,
    errorElement: <ErrorPage />,
  },
  {
    path: "/about",
    lazy: lazyRoute(() => import("./pages/About/About.jsx")),
    HydrateFallback: RouteLoading,
    errorElement: <ErrorPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/dashboard",
        lazy: lazyRoute(() => import("./pages/Dashboard/Dashboard.jsx")),
        HydrateFallback: RouteLoading,
        errorElement: <ErrorPage />,
      },
      {
        path: "/profile",
        lazy: lazyRoute(() => import("./pages/Profile/Profile.jsx")),
        HydrateFallback: RouteLoading,
        errorElement: <ErrorPage />,
      },
      {
        path: "/haiku",
        lazy: lazyRoute(() => import("./pages/HaikuApp/HaikuApp.jsx")),
        HydrateFallback: RouteLoading,
        errorElement: <ErrorPage />,
      },
      {
        path: "/limerick",
        lazy: lazyRoute(() => import("./pages/Limerick/LimerickApp.jsx")),
        HydrateFallback: RouteLoading,
        errorElement: <ErrorPage />,
      },
      {
        path: "/poems",
        lazy: lazyRoute(() => import("./pages/Poetry/Poetry.jsx")),
        HydrateFallback: RouteLoading,
        errorElement: <ErrorPage />,
      },
      {
        path: "/favorites",
        lazy: lazyRoute(() => import("./pages/Favorites/Favorites.jsx")),
        HydrateFallback: RouteLoading,
        errorElement: <ErrorPage />,
      },
    ],
  },
];

export default routes;

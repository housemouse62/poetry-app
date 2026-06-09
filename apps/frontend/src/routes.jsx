import Home from "./pages/Home/Home.jsx";
import Dashboard from "./pages/Dashboard/Dashboard.jsx";
import Register from "./pages/Register/Register.jsx";
import Login from "./pages/Login/Login.jsx";
import HaikuApp from "./pages/HaikuApp/HaikuApp";
import LimerickApp from "./pages/Limerick/LimerickApp";
import ErrorPage from "./errorPage";

import { ProtectedRoute } from "./components/ProtectedRoute.jsx";
import Profile from "./pages/Profile/Profile.jsx";

const routes = [
  {
    path: "/",
    element: <Home />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/register",
    element: <Register />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/login",
    element: <Login />,
    errorElement: <ErrorPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/dashboard",
        element: <Dashboard />,
        errorElement: <ErrorPage />,
      },
      {
        path: "/profile",
        element: <Profile />,
        errorElement: <ErrorPage />,
      },
      {
        path: "/haiku",
        element: <HaikuApp />,
        errorElement: <ErrorPage />,
      },
      {
        path: "/limerick",
        element: <LimerickApp />,
        errorElement: <ErrorPage />,
      },
    ],
  },
];

export default routes;

import Root from "./routes/root";
import Register from "./pages/Register/Register.jsx";
import Login from "./pages/Login/Login.jsx";
import HaikuApp from "./pages/HaikuApp/HaikuApp";
import LimerickApp from "./pages/Limerick/LimerickApp";
import ErrorPage from "./errorPage";

import { ProtectedRoute } from "./components/ProtectedRoute.jsx";

const routes = [
  {
    path: "/",
    element: <Root />,
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

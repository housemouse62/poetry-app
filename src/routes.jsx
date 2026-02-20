import Root from "./routes/root";
import HaikuApp from "./pages/HaikuApp/src/HaikuApp";
import LimerickApp from "./pages/Limerick/LimerickApp";
import ErrorPage from "./errorPage";

const routes = [
  {
    path: "/",
    element: <Root />,
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
];

export default routes;

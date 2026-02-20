import Root from "./routes/root";
import HaikuApp from "./pages/HaikuApp/src/HaikuApp";
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
];

export default routes;

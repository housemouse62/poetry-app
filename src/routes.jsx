import Root from "./routes/root";
import HaikuApp from "./pages/HaikuApp/src/HaikuApp";

const routes = [
  {
    path: "/",
    element: <Root />,
  },
  {
    path: "/haiku",
    element: <HaikuApp />,
  },
];

export default routes;

import { useRouteError } from "react-router";

export default function ErrorPage() {
  const error = useRouteError();
  console.error(error);

  return (
    <div id="error-page">
      <h1>Oops!</h1>
      <p>It appears an unexpected error has occured</p>
      <p>
        <i>{error.statusText || error.message}</i>
      </p>
    </div>
  );
}

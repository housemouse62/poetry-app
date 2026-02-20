import { Link } from "react-router";

export default function Root() {
  return (
    <>
      <div id="container">
        <h2>hello world. we do poetry.</h2>
        <Link to="/haiku">haiku</Link>
        <Link to="/limerick">limerick</Link>
      </div>
    </>
  );
}

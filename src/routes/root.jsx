import { Link } from "react-router";
import "./root.css";

export default function Root() {
  return (
    <>
      <div className="root-app">
        <div class="root-container">
          <h2>hello world. we do poetry.</h2>
          <Link to="/haiku">haiku</Link>
          <br />
          <Link to="/limerick">limerick</Link>
        </div>
      </div>
    </>
  );
}

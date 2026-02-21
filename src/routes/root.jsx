import { Link } from "react-router";
import "./root.css";

export default function Root() {
  return (
    <>
      <div className="root-app">
        <div class="root-container">
          <div className="root-title-div">
            <h1 class-Name="root-title">let's make poetry.</h1>
          </div>
          <div className="poem-cards">
            <div className="poem-card haiku">
              <Link to="/haiku" className="link">
                haiku
              </Link>
            </div>
            <div className="poem-card limerick">
              <Link to="/limerick" className="link">
                limerick
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

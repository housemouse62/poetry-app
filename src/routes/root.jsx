import { Link } from "react-router";
import "./root.css";

export default function Root() {
  return (
    <>
      <div className="root-app">
        <div class="root-container">
          <div className="root-title-div">
            <h1 class-Name="root-title">make poetry.</h1>
          </div>
          <div className="poem-cards">
            <Link to="/haiku" className="link">
              <div className="poem-card haiku">
                <h2>🌸</h2>
                <p className="card-title">haiku</p>
                <p className="card-tagline">5 - 7 - 5</p>
                <p className="saved-count">__ saved</p>
              </div>
            </Link>
            <Link to="/limerick" className="link">
              <div className="poem-card limerick">
                <h2>🍀</h2>
                <p className="card-title">limerick</p>
                <p className="card-tagline">playful rhymes</p>
                <p className="saved-count">__ saved</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

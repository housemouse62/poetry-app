import { Link } from "react-router";

import "./Dashboard.css";

export default function Root() {
  return (
    <>
      <div className="root-app">
        <main className="root-container">
          <nav aria-label="Page navigation" className="dashboard-nav">
            <Link className="profile-button-link" to="/profile">
              profile
            </Link>
            <Link className="feed-button" to="/poems">
              read poetry
            </Link>
            <Link
              to="/favorites"
              className="profile-button-link favorites-link"
            >
              <span aria-hidden="true">★</span> favorites
            </Link>
          </nav>
          <div className="root-title-div">
            <h1 className="root-title">make poetry.</h1>
          </div>

          <div className="poem-cards">
            <Link to="/haiku" className="link" aria-label="Open haiku editor">
              <div className="poem-card haiku">
                <span aria-hidden="true" className="card-symbol">
                  🌸
                </span>
                <p className="card-title">haiku</p>
                <p className="card-tagline">5 - 7 - 5</p>
                {/* <p className="saved-count">__ saved</p> */}
              </div>
            </Link>
            <Link
              to="/limerick"
              className="link"
              aria-label="Open limerick editor"
            >
              <div className="poem-card limerick">
                <span aria-hidden="true" className="card-symbol">
                  🍀
                </span>
                <p className="card-title">limerick</p>
                <p className="card-tagline">playful rhymes</p>
                {/* <p className="saved-count">__ saved</p> */}
              </div>
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}

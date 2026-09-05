import { Link } from "react-router";
import { useNavigate, useLocation } from "react-router";
import { useAuth } from "../../context/useAuth";

import "./Home.css";

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const message = location.state?.message;

  return (
    <>
      <div className="root-app">
        <main className="root-container">
          <Link className="about-link" to="/about" aria-label="About make poetry">
            <span aria-hidden="true">?</span>
          </Link>
          <div className="home-title-div">
            <h1 className="home-title">make poetry.</h1>
          </div>
          <nav aria-label="Page navigation">
            <div className="dashboard-link">
              <button
                className="home-link-button feed"
                aria-label="Dashboard"
                onClick={() => {
                  navigate("/poems");
                }}
              >
                read poetry
              </button>
            </div>
            <div className="button-cards">
              {user ? (
                <>
                  <button
                    className="home-link-button login"
                    aria-label="Profile"
                    onClick={() => navigate("/profile")}
                  >
                    profile
                  </button>
                  <button
                    className="home-link-button register"
                    onClick={logout}
                  >
                    log out
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="home-link-button login"
                    onClick={() => navigate("/login")}
                  >
                    log in
                  </button>
                  <button
                    className="home-link-button register"
                    onClick={() => navigate("/register")}
                  >
                    register
                  </button>
                </>
              )}
            </div>
            <div className="dashboard-link">
              <button
                className="home-link-button dashboard"
                aria-label="Dashboard"
                onClick={() => {
                  navigate("/dashboard");
                }}
              >
                make poetry
              </button>
            </div>
          </nav>
          {message && (
            <p role="alert" className="success-message">
              {message}
            </p>
          )}
        </main>
      </div>
    </>
  );
}

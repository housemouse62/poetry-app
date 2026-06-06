import { Link } from "react-router";
import { useWordData } from "../../utils/useWordData";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router";

import "./Dashboard.css";

export default function Root() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  useWordData("");

  return (
    <>
      <div className="root-app">
        <main className="root-container">
          <nav aria-label="Page navigation" className="dashboard-nav">
            <button
              className="logout-button"
              aria-label="Logout"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              Logout
            </button>
            <button
              className="profile-button-link"
              aria-label="Profile"
              onClick={() => {
                navigate("/profile");
              }}
            >
              Profile
            </button>
          </nav>
          <div className="root-title-div">
            <h1 className="root-title">make poetry.</h1>
          </div>
          <div className="poem-cards">
            <Link to="/haiku" className="link">
              <div className="poem-card haiku">
                <span aria-hidden="true" className="card-symbol">
                  🌸
                </span>
                <p className="card-title">haiku</p>
                <p className="card-tagline">5 - 7 - 5</p>
                {/* <p className="saved-count">__ saved</p> */}
              </div>
            </Link>
            <Link to="/limerick" className="link">
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

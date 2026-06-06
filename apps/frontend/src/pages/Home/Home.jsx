import { Link } from "react-router";
import { useNavigate } from "react-router";

import "./Home.css";

export default function Home() {
  const navigate = useNavigate();

  return (
    <>
      <div className="root-app">
        <main className="root-container">
          <div className="home-title-div">
            <h1 className="home-title">make poetry.</h1>
          </div>
          <nav aria-label="Page navigation">
            <div className="button-cards">
              <button
                className="home-link-button login"
                aria-label="Login"
                onClick={() => {
                  navigate("/login");
                }}
              >
                Login
              </button>
              <button
                className="home-link-button register"
                aria-label="Register"
                onClick={() => {
                  navigate("/register");
                }}
              >
                Register
              </button>
            </div>
            <div className="dashboard-link">
              <button
                className="home-link-button dashboard"
                aria-label="Dashboard"
                onClick={() => {
                  navigate("/dashboard");
                }}
              >
                Dashboard
              </button>
            </div>
          </nav>
        </main>
      </div>
    </>
  );
}

import { Link } from "react-router";
import { useNavigate } from "react-router";

import "./Home.css";

export default function Home() {
  const navigate = useNavigate();

  return (
    <>
      <div className="home-app">
        <main className="home-container">
          <div className="home-title-div">
            <h1 className="home-title">make poetry.</h1>
          </div>
          <nav aria-label="Page navigation">
            <button
              className="home-link-button"
              aria-label="Logout"
              onClick={() => {
                navigate("/login");
              }}
            >
              Login
            </button>
            <button
              className="home-link-button"
              aria-label="Logout"
              onClick={() => {
                navigate("/register");
              }}
            >
              Register
            </button>
          </nav>
        </main>
      </div>
    </>
  );
}

import { useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router";

function Login() {
  const [emailState, setEmailState] = useState("");
  const [passwordState, setPasswordState] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();

    const fetchUser = async () => {
      const url = `http://localhost:3000/users/login`;
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-type": "application/json",
          },
          body: JSON.stringify({
            email: emailState,
            password: passwordState,
          }),
        });
        const nextresponse = await response.json();

        if (nextresponse.token) {
          alert("You are logged in");
          login(nextresponse.user, nextresponse.token);
          navigate("/dashboard");
        } else alert("Check your login credentials");
      } catch (error) {
        console.error(error);
      }
    };
    fetchUser();
  }
  return (
    <>
      <div className="login-div">
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-fields">
            <div className="login-user">
              <h1>User Login</h1>
            </div>
            <div className="form-field">
              <label className="form-label">
                <input
                  type="email"
                  name="email"
                  id="email"
                  className="form-input"
                  placeholder=" "
                  value={emailState}
                  onChange={(e) => setEmailState(e.target.value)}
                  autoComplete="email"
                  required
                />
                <span>Email</span>
              </label>
            </div>
            <div className="form-field">
              <label className="form-label">
                <input
                  type="password"
                  name="password"
                  id="password"
                  className="form-input"
                  placeholder=" "
                  value={passwordState}
                  onChange={(e) => setPasswordState(e.target.value)}
                  autoComplete="password"
                  required
                />
                <span>Password</span>
              </label>
            </div>
          </div>
          <button type="submit" className="form-button login-button">
            Log In
          </button>
        </form>
        <p>Not a registered User?</p>
        <Link className="create-link" to="/register">
          Register here!
        </Link>
      </div>
    </>
  );
}

export default Login;

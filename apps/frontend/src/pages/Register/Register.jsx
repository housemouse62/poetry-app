import { useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router";

function Register() {
  const [emailState, setEmailState] = useState("");
  const [confirmEmailState, setConfirmEmailState] = useState("");
  const [passwordState, setPasswordState] = useState("");
  const [confirmPasswordState, setConfirmPasswordState] = useState("");
  const [nameState, setNameState] = useState("");
  const [screennameState, setScreennameState] = useState("");
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();

    const fetchUser = async () => {
      const url = `${import.meta.env.VITE_API_URL}/users/create`;
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-type": "application/json",
          },
          body: JSON.stringify({
            email: emailState,
            confirmEmail: confirmEmailState,
            password: passwordState,
            confirmPassword: confirmPasswordState,
            name: nameState,
            screenname: screennameState,
          }),
        });
        const nextresponse = await response.json();

        if (nextresponse.id) {
          const loginResponse = await fetch(
            `${import.meta.env.VITE_API_URL}/users/login`,
            {
              method: "POST",
              headers: { "Content-type": "application/json" },
              body: JSON.stringify({
                email: emailState,
                password: passwordState,
              }),
            },
          );
          const loginData = await loginResponse.json();
          if (loginData.token) {
            login(loginData.user, loginData.token);
            navigate("/dashboard");
          } else {
            setError(
              "Registration successful but login failed. Please log in manually.",
            );
          }
        } else setError("Registration Failed");
      } catch (error) {
        if (import.meta.env.DEV) console.error(error);
        setError("Something went wrong. Please try again.");
      }
    };
    fetchUser();
  }
  return (
    <>
      <div className="root-app">
        <main className="root-container">
          <div className="register-div">
            <form className="register-form" onSubmit={handleSubmit}>
              <div className="form-fields">
                <div className="register-user">
                  <h1>Register</h1>
                </div>
                <div className="form-field">
                  <label className="form-label">
                    <input
                      type="text"
                      name="name"
                      id="name"
                      className="form-input"
                      placeholder=" "
                      value={nameState}
                      onChange={(e) => setNameState(e.target.value)}
                      autoComplete="name"
                      required
                    />
                    <span>Name</span>
                  </label>
                </div>
                <div className="form-field">
                  <label className="form-label">
                    <input
                      type="text"
                      name="screenname"
                      id="screenname"
                      className="form-input"
                      placeholder=" "
                      value={screennameState}
                      onChange={(e) => setScreennameState(e.target.value)}
                      autoComplete="username"
                    />
                    <span>Screenname</span>
                  </label>
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
                      type="email"
                      name="confirmEmail"
                      id="confirmEmail"
                      className="form-input"
                      placeholder=" "
                      value={confirmEmailState}
                      onChange={(e) => setConfirmEmailState(e.target.value)}
                      autoComplete="email"
                      required
                    />
                    <span>Confirm Email</span>
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
                      autoComplete="new-password"
                      required
                    />
                    <span>Password</span>
                  </label>
                </div>
                <div className="form-field">
                  <label className="form-label">
                    <input
                      type="password"
                      name="confirmPassword"
                      id="confirmPassword"
                      className="form-input"
                      placeholder=" "
                      value={confirmPasswordState}
                      onChange={(e) => setConfirmPasswordState(e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                    <span>Confirm Password</span>
                  </label>
                </div>
              </div>
              <button type="submit" className="form-button login-button">
                Register
              </button>
            </form>
            {error && (
              <p className="error-message" role="alert">
                {error}
              </p>
            )}
            <p>Already a registered User?</p>
            <Link className="login-link" to="/login">
              Login!
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}

export default Register;

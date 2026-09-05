import { useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../../context/useAuth";
import { useNavigate } from "react-router";
import "./Register.css";

const passwordRequirements =
  "Use at least 8 characters, including a lowercase letter, an uppercase letter, a number, and a symbol.";

function passwordIsStrong(password) {
  return (
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[!@#$%^&*(),.?":{}|<>]/.test(password)
  );
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function registrationError(response, data) {
  if (response.status === 429) {
    return "Too many registration attempts. Please wait and try again later.";
  }
  if (Array.isArray(data?.errors)) {
    const messages = [...new Set(data.errors.map((item) => item.msg))].filter(
      (message) => typeof message === "string",
    );
    if (messages.length) return messages.join(" ");
  }
  if (data?.error === "Email already in use") return data.error;
  return "Registration failed. Please check your information and try again.";
}

function Register() {
  const [emailState, setEmailState] = useState("");
  const [passwordState, setPasswordState] = useState("");
  const [confirmPasswordState, setConfirmPasswordState] = useState("");
  const [nameState, setNameState] = useState("");
  const [screennameState, setScreennameState] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    if (!passwordIsStrong(passwordState)) {
      setError(passwordRequirements);
      return;
    }
    if (passwordState !== confirmPasswordState) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    const url = `${import.meta.env.VITE_API_URL}/users/create`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify({
          email: emailState,
          confirmEmail: emailState,
          password: passwordState,
          confirmPassword: confirmPasswordState,
          name: nameState,
          screenname: screennameState,
        }),
      });
      const nextresponse = await readJson(response);

      if (response.ok && nextresponse?.id) {
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
        const loginData = await readJson(loginResponse);
        if (loginResponse.ok && loginData?.token) {
          login(loginData.user, loginData.token);
          navigate("/dashboard");
        } else {
          setError(
            "Registration successful but login failed. Please log in manually.",
          );
        }
      } else {
        setError(registrationError(response, nextresponse));
      }
    } catch (requestError) {
      if (import.meta.env.DEV) console.error(requestError);
      setError("Cannot reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <>
      <div className="root-app">
        <main className="root-container">
          <nav aria-label="Page navigation" className="register-nav">
            <button
              className="home-button"
              aria-label="Go to Homepage"
              onClick={() => {
                navigate("/");
              }}
            >
              home
            </button>
          </nav>
          <div className="register-div">
            <form className="register-form" onSubmit={handleSubmit}>
              <div className="form-fields">
                <div className="register-user">
                  <h1>register</h1>
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
                      type="password"
                      name="password"
                      id="password"
                      className="form-input"
                      placeholder=" "
                      value={passwordState}
                      onChange={(e) => setPasswordState(e.target.value)}
                      autoComplete="new-password"
                      aria-describedby="password-requirements"
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
                <p id="password-requirements" className="password-requirements">
                  {passwordRequirements}
                </p>
              </div>
              {error && (
                <p className="error-message" role="alert">
                  {error}
                </p>
              )}
              <button
                type="submit"
                className="form-button login-button"
                disabled={submitting}
              >
                {submitting ? "Creating account…" : "Register"}
              </button>
            </form>
            <div className="register-user">
              <p>Already a registered user?</p>
              <Link className="login-link" to="/login">
                Login!
              </Link>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

export default Register;

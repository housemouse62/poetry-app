import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router";
import "./Profile.css";

function Profile() {
  const [editingState, setEditingState] = useState("");
  const [emailState, setEmailState] = useState("");
  const [confirmEmailState, setConfirmEmailState] = useState("");
  const [confirmNewPasswordState, setConfirmNewPasswordState] = useState("");
  const [newPasswordState, setNewPasswordState] = useState("");
  const [currentPasswordState, setCurrentPasswordState] = useState("");
  const [nameState, setNameState] = useState("");
  const [screennameState, setScreennameState] = useState("");
  const [error, setError] = useState(null);
  const { login, user, token, logout } = useAuth();
  const navigate = useNavigate();

  function handleUpdateSubmit(e) {
    e.preventDefault();
    updateProfile();
  }

  const updateProfile = async () => {
    const fetchUser = async () => {
      const url = `${import.meta.env.VITE_API_URL}/users/profile`;
      try {
        const response = await fetch(url, {
          method: "PATCH",
          headers: {
            "Content-type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: nameState,
            screenname: screennameState,
            email: emailState,
            confirmEmail: confirmEmailState,
            currentPassword: currentPasswordState,
            newPassword: newPasswordState,
            confirmNewPassword: confirmNewPasswordState,
          }),
        });
        const nextresponse = await response.json();

        if (nextresponse.token) {
          login(nextresponse.user, nextresponse.token);
          setCurrentPasswordState("");
          setNewPasswordState("");
          setConfirmNewPasswordState("");
          setEditingState("");
        } else setError("Update Failed");
      } catch (error) {
        if (import.meta.env.DEV) console.error(error);
        setError("Something went wrong. Please try again.");
      }
    };
    fetchUser();
  };

  function handleDeleteSubmit(e) {
    e.preventDefault();

    if (emailState !== user.email) {
      setError("Email does not match your account email");
      return;
    }
    const fetchUser = async () => {
      const url = `${import.meta.env.VITE_API_URL}/users/`;
      try {
        const response = await fetch(url, {
          method: "DELETE",
          headers: {
            "Content-type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          navigate("/", {
            state: {
              message: "* Your account has been successfully deleted. *",
            },
          });
        } else setError("Profile delete failed");
      } catch (error) {
        if (import.meta.env.DEV) console.error(error);
        setError("Something went wrong. Please try again.");
      }
    };
    fetchUser();
  }

  return (
    <>
      <div className="profile-app">
        <main className="profile-container">
          <nav aria-label="Page navigation" className="profile-nav">
            <button
              className="dashboard-button"
              aria-label="Dashboard"
              onClick={() => {
                navigate("/dashboard");
              }}
            >
              Dashboard
            </button>
          </nav>
          <h1 className="profile-info-title">Profile Info:</h1>
          <div className="profile-page">
            <div className="profile-info">
              <div className="info-div">
                {editingState === "name" ? (
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
                    />
                    <span>Name</span>
                  </label>
                ) : (
                  <p>
                    <b>Name:</b> {user.name}
                  </p>
                )}
                <button
                  aria-label="Edit name"
                  className="profile-button edit"
                  onClick={() => {
                    if (editingState === "name") {
                      updateProfile();
                    } else {
                      setEditingState("name");
                      setNameState(user.name);
                    }
                  }}
                >
                  {editingState === "name" ? "Save" : "Edit"}
                </button>
              </div>

              <div className="info-div">
                {editingState === "email" ? (
                  <div>
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
                      />
                      <span>Email</span>
                    </label>
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
                      />
                      <span>Confirm Email</span>
                    </label>
                  </div>
                ) : (
                  <p>
                    <b>Email:</b> {user.email}
                  </p>
                )}
                <button
                  aria-label="Edit email"
                  className="profile-button edit"
                  onClick={() => {
                    if (editingState === "email") {
                      updateProfile();
                    } else {
                      setEditingState("email");
                      setEmailState(user.email);
                    }
                  }}
                >
                  {editingState === "email" ? "Save" : "Edit"}
                </button>
              </div>
              <div className="info-div">
                {editingState === "screenname" ? (
                  <label className="form-label">
                    <input
                      type="text"
                      name="screenname"
                      id="screenname"
                      className="form-input"
                      placeholder=" "
                      value={screennameState}
                      onChange={(e) => setScreennameState(e.target.value)}
                      autoComplete="name"
                    />
                    <span>Screen Name</span>
                  </label>
                ) : (
                  <p>
                    <b>Screenname:</b> {user.screenname}
                  </p>
                )}
                <button
                  aria-label="Edit screenname"
                  className="profile-button edit"
                  onClick={() => {
                    if (editingState === "screenname") {
                      updateProfile();
                    } else {
                      setEditingState("screenname");
                      setScreennameState(user.screenname);
                    }
                  }}
                >
                  {editingState === "screenname" ? "Save" : "Edit"}
                </button>
              </div>
              <div className="info-div">
                <button
                  className="profile-button password"
                  onClick={() => {
                    if (editingState === "password") {
                      setEditingState("");
                      setCurrentPasswordState("");
                      setNewPasswordState("");
                      setConfirmNewPasswordState("");
                    } else {
                      setEditingState("password");
                    }
                  }}
                >
                  Change Password
                </button>
              </div>
              <div className="change-information">
                {editingState ? (
                  <form
                    className="update-form"
                    onSubmit={
                      editingState === "deleteUser"
                        ? handleDeleteSubmit
                        : handleUpdateSubmit
                    }
                  >
                    <h2 className="update-confirm-h2">
                      {editingState === "deleteUser" &&
                        "Confirm Delete User"}{" "}
                    </h2>
                    <div className="form-fields">
                      {editingState === "password" ? (
                        <>
                          <div className="form-field">
                            <label className="form-label">
                              <input
                                type="password"
                                name="currentPassword"
                                id="currentPassword"
                                className="form-input password"
                                placeholder=" "
                                value={currentPasswordState}
                                onChange={(e) =>
                                  setCurrentPasswordState(e.target.value)
                                }
                                autoComplete="current-password"
                              />
                              <span>Current Password</span>
                            </label>
                          </div>
                          <div className="form-field">
                            <label className="form-label">
                              <input
                                type="password"
                                name="newPassword"
                                id="newPassword"
                                className="form-input password"
                                placeholder=" "
                                value={newPasswordState}
                                onChange={(e) =>
                                  setNewPasswordState(e.target.value)
                                }
                                autoComplete="new-password"
                              />
                              <span>New Password</span>
                            </label>
                          </div>
                          <div className="form-field">
                            <label className="form-label">
                              <input
                                type="password"
                                name="confirmNewPassword"
                                id="confirmNewPassword"
                                className="form-input password"
                                placeholder=" "
                                value={confirmNewPasswordState}
                                onChange={(e) =>
                                  setConfirmNewPasswordState(e.target.value)
                                }
                                autoComplete="new-password"
                              />
                              <span>Confirm New Password</span>
                            </label>
                          </div>
                          <button type="submit" className="form-button">
                            Update Password
                          </button>
                        </>
                      ) : (
                        ""
                      )}
                      {editingState === "deleteUser" ? (
                        <div className="form-field">
                          <label className="form-label">
                            <input
                              type="text"
                              name="name"
                              id="name"
                              className="form-input"
                              placeholder=" "
                              value={emailState}
                              onChange={(e) => setEmailState(e.target.value)}
                              autoComplete="name"
                            />
                            <span>Enter user email to confirm delete user</span>
                          </label>
                        </div>
                      ) : (
                        ""
                      )}
                    </div>
                  </form>
                ) : (
                  ""
                )}
              </div>
              <div className="delete-button">
                <div className="info-div">
                  <button
                    className="profile-button delete"
                    onClick={() => {
                      setEditingState("deleteUser");
                    }}
                  >
                    Delete User
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

export default Profile;

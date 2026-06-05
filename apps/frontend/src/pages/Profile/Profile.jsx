import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router";

function Profile() {
  const [editingState, setEditingState] = useState("");
  const [emailState, setEmailState] = useState("");
  const [confirmEmailState, setConfirmEmailState] = useState("");
  const [confirmNewPasswordState, setConfirmNewPasswordState] = useState("");
  const [newPasswordState, setNewPasswordState] = useState("");
  const [currentPasswordState, setCurrentPasswordState] = useState("");
  const [nameState, setNameState] = useState("");
  const [screennameState, setScreennameState] = useState("");
  const { login, user, token, logout } = useAuth();
  const navigate = useNavigate();

  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  function handleUpdateSubmit(e) {
    e.preventDefault();

    const fetchUser = async () => {
      const url = `http://localhost:3000/users/profile`;
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
          alert("Profile Updated");
          login(nextresponse.user, nextresponse.token);
          navigate("/dashboard");
        } else alert("Update Failed");
      } catch (error) {
        console.error(error);
      }
    };
    fetchUser();
  }

  function handleDeleteSubmit(e) {
    e.preventDefault();

    if (emailState !== user.email) {
      alert("Email does not match your account email");
      return;
    }
    const fetchUser = async () => {
      const url = `http://localhost:3000/users/`;
      try {
        const response = await fetch(url, {
          method: "DELETE",
          headers: {
            "Content-type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          alert("Profile deleted");
          logout();
          navigate("/");
        } else alert("Profile delete failed");
      } catch (error) {
        console.error(error);
      }
    };
    fetchUser();
  }

  return (
    <>
      <h1>Welcome {user.name}</h1>
      <h2>Profile Info:</h2>
      <div className="profile-page">
        <div className="profile-info">
          <div className="info-div">
            <p>
              <b>Name:</b> {user.name}
            </p>
            <button
              className="update-link"
              onClick={() => {
                setEditingState("name");
              }}
            >
              Edit
            </button>
          </div>
          <div className="info-div">
            <p>
              <b>Email:</b> {user.email}
            </p>
            <button
              className="update-link"
              onClick={() => {
                setEditingState("email");
              }}
            >
              Edit
            </button>
          </div>
          <div className="info-div">
            <p>
              <b>Role:</b> {user ? capitalize(user.usertype) : ""}
            </p>
          </div>
          <div className="info-div">
            <p>
              <b>Screenname:</b> {user.screenname}
            </p>
            <button
              className="update-link"
              onClick={() => {
                setEditingState("screenname");
              }}
            >
              Edit
            </button>
          </div>
          <div className="info-div">
            <button
              className="update-link"
              onClick={() => {
                setEditingState("password");
              }}
            >
              Change Password
            </button>
          </div>
          <div className="info-div">
            <button
              className="update-link"
              onClick={() => {
                setEditingState("deleteUser");
              }}
            >
              Delete User
            </button>
          </div>
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
              <legend>
                {editingState !== "deleteUser"
                  ? "Update Personal Info:"
                  : "Confirm Delete User"}{" "}
              </legend>
              <div className="form-fields">
                {editingState === "screenname" ? (
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
                        autoComplete="name"
                      />
                      <span>Screen Name</span>
                    </label>
                  </div>
                ) : (
                  ""
                )}
                {editingState === "name" ? (
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
                      />
                      <span>Name</span>
                    </label>
                  </div>
                ) : (
                  ""
                )}
                {editingState === "email" ? (
                  <>
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
                        />
                        <span>Confirm Email</span>
                      </label>
                    </div>{" "}
                  </>
                ) : (
                  ""
                )}
                {editingState === "password" ? (
                  <>
                    <div className="form-field">
                      <label className="form-label">
                        <input
                          type="password"
                          name="currentPassword"
                          id="currentPassword"
                          className="form-input"
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
                          className="form-input"
                          placeholder=" "
                          value={newPasswordState}
                          onChange={(e) => setNewPasswordState(e.target.value)}
                          autoComplete="current-password"
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
                          className="form-input"
                          placeholder=" "
                          value={confirmNewPasswordState}
                          onChange={(e) =>
                            setConfirmNewPasswordState(e.target.value)
                          }
                          autoComplete="current-password"
                        />
                        <span>Confirm New Password</span>
                      </label>
                    </div>
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
              {editingState ? (
                <button type="submit" className="form-button">
                  {editingState !== "deleteUser"
                    ? "Update Information"
                    : "Confirm Delete User"}
                </button>
              ) : (
                ""
              )}
            </form>
          ) : (
            ""
          )}
        </div>
      </div>
    </>
  );
}

export default Profile;

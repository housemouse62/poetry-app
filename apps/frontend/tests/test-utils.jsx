import {
  render as testingLibraryRender,
  renderHook as testingLibraryRenderHook,
} from "@testing-library/react";
import { RouterProvider } from "react-router";
import { AuthProvider } from "../src/context/AuthContext";

export const authenticatedTestUser = {
  id: 1,
  name: "Test User",
  screenname: "testuser",
};

export const authenticatedTestState = {
  user: authenticatedTestUser,
  token: "test-token",
};

function seedAuth(auth) {
  localStorage.removeItem("user");
  localStorage.removeItem("token");

  if (!auth) return;
  if (auth.user !== undefined && auth.user !== null) {
    localStorage.setItem("user", JSON.stringify(auth.user));
  }
  if (auth.token !== undefined && auth.token !== null) {
    localStorage.setItem("token", auth.token);
  }
}

export function render(
  ui,
  { auth = authenticatedTestState, router, ...renderOptions } = {},
) {
  seedAuth(auth);

  return testingLibraryRender(
    <AuthProvider>
      {router ? <RouterProvider router={router} /> : ui}
    </AuthProvider>,
    renderOptions,
  );
}

export function renderHook(
  callback,
  { auth = authenticatedTestState, wrapper: AdditionalWrapper, ...options } = {},
) {
  seedAuth(auth);

  function Wrapper({ children }) {
    const content = AdditionalWrapper ? (
      <AdditionalWrapper>{children}</AdditionalWrapper>
    ) : (
      children
    );
    return <AuthProvider>{content}</AuthProvider>;
  }

  return testingLibraryRenderHook(callback, { wrapper: Wrapper, ...options });
}

export function renderWithRouter(router, options) {
  return render(null, { ...options, router });
}

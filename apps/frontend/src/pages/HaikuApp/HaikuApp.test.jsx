import { describe, it, expect, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { render } from "../../../tests/test-utils";
import userEvent from "@testing-library/user-event";
import HaikuApp from "./HaikuApp";
import { createMemoryRouter, RouterProvider } from "react-router";
import { vi } from "vitest";

vi.mock("html2canvas", () => ({
  default: vi.fn(() =>
    Promise.resolve({
      toDataURL: () => "data:image/png;base64,mock",
      toBlob: vi.fn((callback) => callback(new Blob())),
    }),
  ),
}));

const renderWithRouter = (component) => {
  const router = createMemoryRouter([{ path: "/", element: component }]);
  return render(<RouterProvider router={router} />);
};

let mockHaikus;

const mockApi = async (url, options = {}) => {
  const method = options.method || "GET";

  if (url.endsWith("/word/")) {
    return { ok: false, status: 404, json: async () => ({}) };
  }
  if (url.endsWith("/haiku") && method === "POST") {
    const haiku = {
      id: mockHaikus.length + 1,
      ...JSON.parse(options.body),
      haikuLikes: [],
      isFavorited: false,
      _count: { comments: 0, haikuLikes: 0 },
    };
    mockHaikus.push(haiku);
    return { ok: true, status: 201, json: async () => haiku };
  }
  if (url.endsWith("/haiku/mine") && method === "GET") {
    return { ok: true, status: 200, json: async () => [...mockHaikus] };
  }
  if (/\/haiku\/\d+$/.test(url) && method === "PATCH") {
    const id = Number(url.split("/").pop());
    const update = JSON.parse(options.body);
    const index = mockHaikus.findIndex((haiku) => haiku.id === id);
    mockHaikus[index] = { ...mockHaikus[index], ...update };
    return { ok: true, status: 200, json: async () => mockHaikus[index] };
  }
  if (/\/haiku\/\d+$/.test(url) && method === "DELETE") {
    const id = Number(url.split("/").pop());
    mockHaikus = mockHaikus.filter((haiku) => haiku.id !== id);
    return { ok: true, status: 200, json: async () => ({ id }) };
  }

  return { ok: false, status: 404, json: async () => ({}) };
};

describe("App Component", () => {
  beforeEach(() => {
    //Clear localStorage before each test
    localStorage.clear();
    mockHaikus = [];
    globalThis.fetch.mockImplementation(mockApi);
  });

  it("save button appears when haiku is complete", async () => {
    const user = userEvent.setup();
    renderWithRouter(<HaikuApp />);

    // Type a complete haiku (5-7-5 syllables)
    const line1 = screen.getByPlaceholderText(/line 1/i);
    const line2 = screen.getByPlaceholderText(/line 2/i);
    const line3 = screen.getByPlaceholderText(/line 3/i);

    await user.type(line1, "Hello World My Dear");
    await user.type(line2, "I hope you are feeling well");
    await user.type(line3, "I am waiting here");
    const buttonNode = screen.getByRole("button", { name: /save draft/i });
    expect(buttonNode).toBeVisible();
  });

  it("displays 'You do Haiku!' when the the syllable requirements are met", async () => {
    const user = userEvent.setup();
    renderWithRouter(<HaikuApp />);
    // Type a complete haiku (5-7-5 syllables)
    const line1 = screen.getByPlaceholderText(/line 1/i);
    const line2 = screen.getByPlaceholderText(/line 2/i);
    const line3 = screen.getByPlaceholderText(/line 3/i);

    await user.type(line1, "Hello World My Dear");
    await user.type(line2, "I hope you are feeling well");
    await user.type(line3, "I am waiting here");

    const wellDone = screen.getByRole("heading", {
      name: /You do haiku/i,
      level: 1,
    });
    expect(wellDone).toBeVisible();
  });
  it("saves a haiku through the API when the save button is clicked", async () => {
    const user = userEvent.setup();
    renderWithRouter(<HaikuApp />);
    // Type a complete haiku (5-7-5 syllables)
    const line1 = screen.getByPlaceholderText(/line 1/i);
    const line2 = screen.getByPlaceholderText(/line 2/i);
    const line3 = screen.getByPlaceholderText(/line 3/i);

    await user.type(line1, "Hello World My Dear");
    await user.type(line2, "I hope you are feeling well");
    await user.type(line3, "I am waiting here");

    expect(mockHaikus).toHaveLength(0);

    const buttonNode = screen.getByRole("button", { name: /save draft/i });
    await user.click(buttonNode);

    await waitFor(() => expect(mockHaikus).toHaveLength(1));
  });

  it("doesn't display 'saved' before the haiku is saved", async () => {
    const user = userEvent.setup();
    renderWithRouter(<HaikuApp />);
    // Type a complete haiku (5-7-5 syllables)
    const line1 = screen.getByPlaceholderText(/line 1/i);
    const line2 = screen.getByPlaceholderText(/line 2/i);
    const line3 = screen.getByPlaceholderText(/line 3/i);

    await user.type(line1, "Hello World My Dear");
    await user.type(line2, "I hope you are feeling well");
    await user.type(line3, "I am waiting here");

    const saved = screen.queryByText(/saved!/i);
    expect(saved).not.toBeInTheDocument;
  });

  it("displays 'saved' after the haiku is saved", async () => {
    const user = userEvent.setup();
    renderWithRouter(<HaikuApp />);
    // Type a complete haiku (5-7-5 syllables)
    const line1 = screen.getByPlaceholderText(/line 1/i);
    const line2 = screen.getByPlaceholderText(/line 2/i);
    const line3 = screen.getByPlaceholderText(/line 3/i);

    await user.type(line1, "Hello World My Dear");
    await user.type(line2, "I hope you are feeling well");
    await user.type(line3, "I am waiting here");

    const buttonNode = screen.getByRole("button", { name: /save draft/i });
    await user.click(buttonNode);

    const saved = screen.getByText(/saved!/i);
    expect(saved).toBeVisible();
  });

  it("keeps the inputs after saving a draft", async () => {
    const user = userEvent.setup();
    renderWithRouter(<HaikuApp />);
    // Type a complete haiku (5-7-5 syllables)
    const line1 = screen.getByPlaceholderText(/line 1/i);
    const line2 = screen.getByPlaceholderText(/line 2/i);
    const line3 = screen.getByPlaceholderText(/line 3/i);

    await user.type(line1, "Do you do haiku");
    await user.type(line2, "I do I haiku for you");
    await user.type(line3, "I haiku for you");

    const buttonNode = screen.getByRole("button", { name: /save draft/i });
    await user.click(buttonNode);

    expect(line1).toHaveValue("Do you do haiku");
  });

  it("clear button appears when the user types into one of the fields", async () => {
    const user = userEvent.setup();
    renderWithRouter(<HaikuApp />);
    // Type a complete haiku (5-7-5 syllables)
    const line1 = screen.getByPlaceholderText(/line 1/i);

    await user.type(line1, "Do you do haiku");

    const buttonNode = screen.getByRole("button", { name: /clear/i });
    expect(buttonNode).toBeVisible();
  });

  it("all fields clear when user clicks clear button", async () => {
    const user = userEvent.setup();
    renderWithRouter(<HaikuApp />);
    // Type a complete haiku (5-7-5 syllables)
    const line1 = screen.getByPlaceholderText(/line 1/i);
    const line2 = screen.getByPlaceholderText(/line 2/i);
    const line3 = screen.getByPlaceholderText(/line 3/i);

    await user.type(line1, "Do you do haiku");
    await user.type(line2, "I do I haiku for you");
    await user.type(line3, "I haiku for you");

    const buttonNode = screen.getByRole("button", { name: /clear/i });
    await user.click(buttonNode);

    expect(line1).toHaveValue("");
    expect(line2).toHaveValue("");
    expect(line3).toHaveValue("");
  });

  it("view haikus button is visible", () => {
    renderWithRouter(<HaikuApp />);
    const buttonNode = screen.getByRole("button", {
      name: /view saved haikus/i,
    });
    expect(buttonNode).toBeVisible();
  });

  it("saved haikus div appears when button is clicked", async () => {
    const user = userEvent.setup();
    renderWithRouter(<HaikuApp />);
    const buttonNode = screen.getByRole("button", {
      name: /view saved haikus/i,
    });

    await user.click(buttonNode);
    const savedHaikus = screen.getByText(/^saved haikus$/i);
    expect(savedHaikus).toBeVisible();
  });

  it("returns a 'no haikus' message when the API returns no haikus", async () => {
    const user = userEvent.setup();
    renderWithRouter(<HaikuApp />);
    const buttonNode = screen.getByRole("button", {
      name: /view saved haikus/i,
    });

    await user.click(buttonNode);
    const noHaikus = screen.getByText(/no saved haikus/i);
    expect(noHaikus).toBeVisible();
  });

  it("displays the saved haiku when the view saved haikus button is pressed", async () => {
    const user = userEvent.setup();
    renderWithRouter(<HaikuApp />);
    // Type a complete haiku (5-7-5 syllables)
    const line1 = screen.getByPlaceholderText(/line 1/i);
    const line2 = screen.getByPlaceholderText(/line 2/i);
    const line3 = screen.getByPlaceholderText(/line 3/i);

    await user.type(line1, "it is me here hi");
    await user.type(line2, "hey you look at that right there");
    await user.type(line3, "hey you hi there hi");

    const saveButtonNode = screen.getByRole("button", { name: /^publish$/i });
    await user.click(saveButtonNode);

    const viewButtonNode = screen.getByRole("button", {
      name: /view saved haikus/i,
    });
    await user.click(viewButtonNode);

    const haikuText = screen.getByText(/it is me here hi/i);
    expect(haikuText).toBeVisible();
  });

  it("show delete button with each haiku", async () => {
    const user = userEvent.setup();
    renderWithRouter(<HaikuApp />);
    // Type a complete haiku (5-7-5 syllables)
    const line1 = screen.getByPlaceholderText(/line 1/i);
    const line2 = screen.getByPlaceholderText(/line 2/i);
    const line3 = screen.getByPlaceholderText(/line 3/i);

    await user.type(line1, "it is me here hi");
    await user.type(line2, "hey you look at that right there");
    await user.type(line3, "hey you hi there hi");

    const saveButtonNode = screen.getByRole("button", { name: /^publish$/i });
    await user.click(saveButtonNode);

    const viewButtonNode = screen.getByRole("button", {
      name: /view saved haikus/i,
    });
    await user.click(viewButtonNode);

    const deleteButton = screen.getByRole("button", { name: /delete/i });
    expect(deleteButton).toBeVisible();
  });

  it("delete button removes a haiku returned by the API", async () => {
    const user = userEvent.setup();
    renderWithRouter(<HaikuApp />);
    // Type a complete haiku (5-7-5 syllables)
    const line1 = screen.getByPlaceholderText(/line 1/i);
    const line2 = screen.getByPlaceholderText(/line 2/i);
    const line3 = screen.getByPlaceholderText(/line 3/i);

    await user.type(line1, "it is me here hi");
    await user.type(line2, "hey you look at that right there");
    await user.type(line3, "hey you hi there hi");

    // Save Haiku
    const saveButtonNode = screen.getByRole("button", { name: /^publish$/i });
    await user.click(saveButtonNode);

    // View all saved haikus
    const viewButtonNode = screen.getByRole("button", {
      name: /view saved haikus/i,
    });
    await user.click(viewButtonNode);

    // Delete saved haiku
    const deleteButton = screen.getByRole("button", { name: /delete/i });
    await user.click(deleteButton);

    const confirmButton = screen.getByRole("button", { name: /confirm/i });
    await user.click(confirmButton);

    // Ensure the haiku is deleted
    await waitFor(() => {
      const haikuText = screen.queryByText(/it is me here hi/i);
      expect(haikuText).not.toBeInTheDocument();
    });
  });

  it("confirm download modal pops up when user clicks download", async () => {
    const user = userEvent.setup();
    renderWithRouter(<HaikuApp />);

    // Type a complete haiku (5-7-5 syllables)
    const line1 = screen.getByPlaceholderText(/line 1/i);
    const line2 = screen.getByPlaceholderText(/line 2/i);
    const line3 = screen.getByPlaceholderText(/line 3/i);

    await user.type(line1, "it is me here hi");
    await user.type(line2, "hey you look at that right there");
    await user.type(line3, "hey you hi there hi");

    // Save Haiku
    const saveButtonNode = screen.getByRole("button", { name: /^publish$/i });
    await user.click(saveButtonNode);

    // View all saved haikus
    const viewButtonNode = screen.getByRole("button", {
      name: /view saved haikus/i,
    });
    await user.click(viewButtonNode);

    //User Clicks Download Button
    const downloadButton = screen.getByRole("button", { name: /download/i });
    await user.click(downloadButton);

    // Confirm Download Modal Pops Up
    await waitFor(() => {
      const downloadModal = screen.getByRole("dialog");
      expect(downloadModal).toBeVisible();
    });
  });

  it("confirm confirm button and cancel button render on modal dialog", async () => {
    const user = userEvent.setup();
    renderWithRouter(<HaikuApp />);
    // Type a complete haiku (5-7-5 syllables)
    const line1 = screen.getByPlaceholderText(/line 1/i);
    const line2 = screen.getByPlaceholderText(/line 2/i);
    const line3 = screen.getByPlaceholderText(/line 3/i);

    await user.type(line1, "it is me here hi");
    await user.type(line2, "hey you look at that right there");
    await user.type(line3, "hey you hi there hi");

    // Save Haiku
    const saveButtonNode = screen.getByRole("button", { name: /^publish$/i });
    await user.click(saveButtonNode);

    // View all saved haikus
    const viewButtonNode = screen.getByRole("button", {
      name: /view saved haikus/i,
    });
    await user.click(viewButtonNode);

    //User Clicks Download Button
    const downloadButton = screen.getByRole("button", { name: /download/i });
    await user.click(downloadButton);

    //Confirm button and cancel button visible
    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    const confirmButton = screen.getByRole("button", { name: /confirm/i });
    expect(cancelButton).toBeVisible();
    expect(confirmButton).toBeVisible();
  });

  it("confirm download modal goes away when user clicks cancel", async () => {
    const user = userEvent.setup();
    renderWithRouter(<HaikuApp />);
    // Type a complete haiku (5-7-5 syllables)
    const line1 = screen.getByPlaceholderText(/line 1/i);
    const line2 = screen.getByPlaceholderText(/line 2/i);
    const line3 = screen.getByPlaceholderText(/line 3/i);

    await user.type(line1, "it is me here hi");
    await user.type(line2, "hey you look at that right there");
    await user.type(line3, "hey you hi there hi");

    // Save Haiku
    const saveButtonNode = screen.getByRole("button", { name: /^publish$/i });
    await user.click(saveButtonNode);

    // View all saved haikus
    const viewButtonNode = screen.getByRole("button", {
      name: /view saved haikus/i,
    });
    await user.click(viewButtonNode);

    //User Clicks Download Button
    const downloadButton = screen.getByRole("button", { name: /download/i });
    await user.click(downloadButton);

    //User Clicks Cancel Button
    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    // Confirm Download Modal Goes Away
    const downloadModal = screen.queryByRole("dialog");
    expect(downloadModal).not.toBeInTheDocument();
  });

  it("confirm download modal goes away when user clicks cancel", async () => {
    const user = userEvent.setup();
    renderWithRouter(<HaikuApp />);
    // Type a complete haiku (5-7-5 syllables)
    const line1 = screen.getByPlaceholderText(/line 1/i);
    const line2 = screen.getByPlaceholderText(/line 2/i);
    const line3 = screen.getByPlaceholderText(/line 3/i);

    await user.type(line1, "it is me here hi");
    await user.type(line2, "hey you look at that right there");
    await user.type(line3, "hey you hi there hi");

    // Save Haiku
    const saveButtonNode = screen.getByRole("button", { name: /^publish$/i });
    await user.click(saveButtonNode);

    // View all saved haikus
    const viewButtonNode = screen.getByRole("button", {
      name: /view saved haikus/i,
    });
    await user.click(viewButtonNode);

    //User Clicks Download Button
    const downloadButton = screen.getByRole("button", { name: /download/i });
    await user.click(downloadButton);

    //User Clicks Confirm Button
    const confirmButton = screen.getByRole("button", { name: /confirm/i });
    await user.click(confirmButton);

    // Confirm Download Modal Goes Away
    const downloadModal = screen.queryByRole("dialog");
    expect(downloadModal).not.toBeInTheDocument();
  });
  it("creates and updates one incomplete draft while retaining content and focus", async () => {
    const user = userEvent.setup();
    renderWithRouter(<HaikuApp />);
    const line = screen.getByPlaceholderText(/line 1/i);
    const save = screen.getByRole("button", { name: /save draft/i });
    expect(save).toBeDisabled();
    await user.type(line, "A beginning");
    await user.click(save);
    await screen.findByText("Draft saved.");
    expect(line).toHaveValue("A beginning");
    expect(save).toHaveFocus();
    await user.type(line, " grows");
    await user.click(save);
    await waitFor(() => expect(globalThis.fetch.mock.calls.some(([url, options]) => /\/haiku\/1$/.test(url) && options.method === "PATCH")).toBe(true));
  });

  it("resumes an untitled draft and restores focus to its title", async () => {
    const user = userEvent.setup();
    mockHaikus.push({ id: 9, title: "", lineOne: "First", lineTwo: "", lineThree: "", published: false });
    renderWithRouter(<HaikuApp />);
    await user.click(screen.getByRole("button", { name: /view saved haikus/i }));
    expect(screen.getByText("Untitled draft")).toBeVisible();
    expect(screen.getByText("Draft")).toBeVisible();
    await user.click(screen.getByRole("button", { name: /resume draft/i }));
    await waitFor(() => expect(screen.getByLabelText("Haiku title")).toHaveFocus());
    expect(screen.getByPlaceholderText(/line 1/i)).toHaveValue("First");
  });

  it("cancels draft discard and restores focus to the initiating control", async () => {
    const user = userEvent.setup();
    mockHaikus.push({ id: 9, title: "Draft name", lineOne: "First", lineTwo: "", lineThree: "", published: false });
    renderWithRouter(<HaikuApp />);
    await user.click(screen.getByRole("button", { name: /view saved haikus/i }));
    const discard = screen.getByRole("button", { name: /discard draft/i });
    await user.click(discard);
    const cancel = screen.getByRole("button", { name: /cancel/i });
    expect(cancel).toHaveFocus();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(discard).toHaveFocus());
  });

  it("preserves content and Save draft focus after a failed request", async () => {
    globalThis.fetch.mockImplementation(async (url, options = {}) => {
      if (url.endsWith("/haiku") && options.method === "POST") {
        return { ok: false, status: 500, json: async () => ({}) };
      }
      return mockApi(url, options);
    });
    const user = userEvent.setup();
    renderWithRouter(<HaikuApp />);
    const line = screen.getByPlaceholderText(/line 1/i);
    await user.type(line, "Keep these words");
    const save = screen.getByRole("button", { name: /save draft/i });
    await user.click(save);
    expect(await screen.findByRole("alert")).toHaveTextContent(/failed to save draft/i);
    expect(line).toHaveValue("Keep these words");
    expect(save).toHaveFocus();
  });

  it("warns only while editor content differs from the saved snapshot", async () => {
    const user = userEvent.setup();
    renderWithRouter(<HaikuApp />);
    await user.type(screen.getByLabelText("Haiku title"), "Work in progress");
    const dirtyEvent = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(dirtyEvent);
    expect(dirtyEvent.defaultPrevented).toBe(true);
    await user.click(screen.getByRole("button", { name: /save draft/i }));
    await screen.findByText("Draft saved.");
    const savedEvent = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(savedEvent);
    expect(savedEvent.defaultPrevented).toBe(false);
  });

  it("edits a published poem without offering or performing an unpublish", async () => {
    const user = userEvent.setup();
    mockHaikus.push({
      id: 12,
      title: "Published haiku",
      lineOne: "it is me here hi",
      lineTwo: "hey you look at that right there",
      lineThree: "hey you hi there hi",
      lineOneSyllables: 5,
      lineTwoSyllables: 7,
      lineThreeSyllables: 5,
      published: true,
      createdAt: new Date().toISOString(),
      haikuLikes: [],
      isFavorited: false,
      _count: { comments: 0, haikuLikes: 0 },
    });
    renderWithRouter(<HaikuApp />);
    await user.click(screen.getByRole("button", { name: /view saved haikus/i }));
    await user.click(screen.getByRole("button", { name: /edit haiku/i }));
    expect(screen.queryByRole("button", { name: /save draft/i })).not.toBeInTheDocument();
    await user.clear(screen.getByLabelText("Haiku title"));
    await user.type(screen.getByLabelText("Haiku title"), "Revised published haiku");
    await user.click(screen.getByRole("button", { name: /update published poem/i }));
    await waitFor(() => {
      const call = globalThis.fetch.mock.calls.find(([url, options]) =>
        /\/haiku\/12$/.test(url) && options.method === "PATCH",
      );
      expect(JSON.parse(call[1].body).published).toBe(true);
    });
  });

  it("locks poem fields during publish so later text cannot be discarded", async () => {
    let finishPublish;
    globalThis.fetch.mockImplementation(async (url, options = {}) => {
      if (url.endsWith("/haiku") && options.method === "POST") {
        return new Promise((resolve) => { finishPublish = resolve; });
      }
      return mockApi(url, options);
    });
    const user = userEvent.setup();
    renderWithRouter(<HaikuApp />);
    const title = screen.getByLabelText("Haiku title");
    await user.type(title, "Submitted title");
    await user.type(screen.getByPlaceholderText(/line 1/i), "it is me here hi");
    await user.type(screen.getByPlaceholderText(/line 2/i), "hey you look at that right there");
    await user.type(screen.getByPlaceholderText(/line 3/i), "hey you hi there hi");
    await user.click(screen.getByRole("button", { name: /^publish$/i }));
    expect(title).toHaveAttribute("readonly");
    expect(screen.getByPlaceholderText(/line 1/i)).toHaveAttribute("readonly");
    await user.type(title, " lost change");
    expect(title).toHaveValue("Submitted title");
    finishPublish({ ok: true, status: 201, json: async () => ({ id: 20 }) });
    await screen.findByText(/haiku published/i);
  });

  it("keeps edits made during Save draft dirty after that request succeeds", async () => {
    let finishSave;
    globalThis.fetch.mockImplementation(async (url, options = {}) => {
      if (url.endsWith("/haiku") && options.method === "POST") {
        const submitted = JSON.parse(options.body);
        return new Promise((resolve) => { finishSave = () => resolve({ ok: true, status: 201, json: async () => ({ id: 21, ...submitted }) }); });
      }
      return mockApi(url, options);
    });
    const user = userEvent.setup();
    renderWithRouter(<HaikuApp />);
    const title = screen.getByLabelText("Haiku title");
    await user.type(title, "Version A");
    await user.click(screen.getByRole("button", { name: /save draft/i }));
    await user.type(title, " plus B");
    finishSave();
    await screen.findByText("Draft saved.");
    expect(title).toHaveValue("Version A plus B");
    const dirtyEvent = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(dirtyEvent);
    expect(dirtyEvent.defaultPrevented).toBe(true);
  });
});

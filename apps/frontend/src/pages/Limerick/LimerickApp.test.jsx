import { describe, it, expect, beforeEach } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { render } from "../../../tests/test-utils";
import userEvent from "@testing-library/user-event";
import LimerickApp from "./LimerickApp";
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
  const router = createMemoryRouter([
    {
      path: "/",
      element: component,
    },
  ]);
  return render(<RouterProvider router={router} />);
};

const fillCompleteLimerick = () => {
  const lines = [
    screen.getByPlaceholderText(/line 1/i),
    screen.getByPlaceholderText(/line 2/i),
    screen.getByPlaceholderText(/line 3/i),
    screen.getByPlaceholderText(/line 4/i),
    screen.getByPlaceholderText(/line 5/i),
  ];
  const values = [
    "There was an Old Man with a beard,",
    'Who said, "It is just as I feared!',
    "Two Owls and a Hen,",
    "Four Larks and a Wren,",
    'Have all built their nests in my beard!"',
  ];

  lines.forEach((line, index) => {
    fireEvent.change(line, { target: { value: values[index] } });
  });

  return lines;
};

let mockLimericks;

const mockApi = async (url, options = {}) => {
  const method = options.method || "GET";

  if (url.endsWith("/word/")) {
    return { ok: false, status: 404, json: async () => ({}) };
  }
  if (url.endsWith("/limerick") && method === "POST") {
    const limerick = {
      id: mockLimericks.length + 1,
      ...JSON.parse(options.body),
      limerickLikes: [],
      isFavorited: false,
      _count: { comments: 0, limerickLikes: 0 },
    };
    mockLimericks.push(limerick);
    return { ok: true, status: 201, json: async () => limerick };
  }
  if (url.endsWith("/limerick/mine") && method === "GET") {
    return { ok: true, status: 200, json: async () => [...mockLimericks] };
  }
  if (/\/limerick\/\d+$/.test(url) && method === "PATCH") {
    const id = Number(url.split("/").pop());
    const update = JSON.parse(options.body);
    const index = mockLimericks.findIndex((limerick) => limerick.id === id);
    mockLimericks[index] = { ...mockLimericks[index], ...update };
    return { ok: true, status: 200, json: async () => mockLimericks[index] };
  }
  if (/\/limerick\/\d+$/.test(url) && method === "DELETE") {
    const id = Number(url.split("/").pop());
    mockLimericks = mockLimericks.filter((limerick) => limerick.id !== id);
    return { ok: true, status: 200, json: async () => ({ id }) };
  }

  return { ok: false, status: 404, json: async () => ({}) };
};

describe("App Component", () => {
  beforeEach(() => {
    //Clear localStorage before each test
    localStorage.clear();
    mockLimericks = [];
    globalThis.fetch.mockImplementation(mockApi);
  });

  it("save button appears when Limerick is complete", async () => {
    renderWithRouter(<LimerickApp />);

    fillCompleteLimerick();

    const buttonNode = screen.getByRole("button", { name: /save draft/i });
    expect(buttonNode).toBeVisible();
  });

  it("displays 'You do Limerick!' when all lines have something typed", async () => {
    renderWithRouter(<LimerickApp />);

    fillCompleteLimerick();

    const wellDone = screen.getByRole("heading", {
      name: /You do limerick/i,
      level: 3,
    });
    expect(wellDone).toBeVisible();
  });

  it("saves a limerick through the API when the save button is clicked", async () => {
    const user = userEvent.setup();
    renderWithRouter(<LimerickApp />);

    fillCompleteLimerick();

    expect(mockLimericks).toHaveLength(0);

    const buttonNode = screen.getByRole("button", { name: /save draft/i });
    await user.click(buttonNode);

    await waitFor(() => expect(mockLimericks).toHaveLength(1));
  });

  it("doesn't display 'saved' before the limerick is saved", async () => {
    renderWithRouter(<LimerickApp />);

    fillCompleteLimerick();

    const saved = screen.queryByText(/saved!/i);
    expect(saved).not.toBeInTheDocument;
  });

  it("displays 'saved' after the limerick is saved", async () => {
    const user = userEvent.setup();
    renderWithRouter(<LimerickApp />);

    fillCompleteLimerick();

    const buttonNode = screen.getByRole("button", { name: /save draft/i });
    await user.click(buttonNode);

    const saved = screen.getByText(/saved!/i);
    expect(saved).toBeVisible();
  });

  it("keeps the inputs after saving a draft", async () => {
    const user = userEvent.setup();
    renderWithRouter(<LimerickApp />);
    const [line1] = fillCompleteLimerick();

    const buttonNode = screen.getByRole("button", { name: /save draft/i });
    await user.click(buttonNode);

    expect(line1).toHaveValue("There was an Old Man with a beard,");
  });

  it("clear button appears when the user types into one of the fields", async () => {
    const user = userEvent.setup();
    renderWithRouter(<LimerickApp />);
    // Type a complete limerick (5-7-5 syllables)
    const line1 = screen.getByPlaceholderText(/line 1/i);

    await user.type(line1, "Do you do limerick");

    const buttonNode = screen.getByRole("button", { name: /clear/i });
    expect(buttonNode).toBeVisible();
  });

  it("all fields clear when user clicks clear button", async () => {
    const user = userEvent.setup();
    renderWithRouter(<LimerickApp />);
    const [line1, line2, line3, line4, line5] = fillCompleteLimerick();

    const buttonNode = screen.getByRole("button", { name: /clear/i });
    await user.click(buttonNode);

    expect(line1).toHaveValue("");
    expect(line2).toHaveValue("");
    expect(line3).toHaveValue("");
    expect(line4).toHaveValue("");
    expect(line5).toHaveValue("");
  });

  it("view limericks button is visible", () => {
    renderWithRouter(<LimerickApp />);
    const buttonNode = screen.getByRole("button", {
      name: /view saved limericks/i,
    });
    expect(buttonNode).toBeVisible();
  });

  it("saved limericks div appears when button is clicked", async () => {
    const user = userEvent.setup();
    renderWithRouter(<LimerickApp />);
    const buttonNode = screen.getByRole("button", {
      name: /view saved limericks/i,
    });

    await user.click(buttonNode);
    const savedLimericks = screen.getByText(/^saved limericks$/i);
    expect(savedLimericks).toBeVisible();
  });

  it("returns a 'no limericks' message when the API returns no limericks", async () => {
    const user = userEvent.setup();
    renderWithRouter(<LimerickApp />);
    const buttonNode = screen.getByRole("button", {
      name: /view saved limericks/i,
    });

    await user.click(buttonNode);
    const noLimericks = screen.getByText(/no saved limericks/i);
    expect(noLimericks).toBeVisible();
  });

  it("displays the saved limericks when the view saved limericks button is pressed", async () => {
    const user = userEvent.setup();
    renderWithRouter(<LimerickApp />);
    fillCompleteLimerick();

    const saveButtonNode = screen.getByRole("button", { name: /^publish$/i });
    await user.click(saveButtonNode);

    const viewButtonNode = screen.getByRole("button", {
      name: /view saved limericks/i,
    });
    await user.click(viewButtonNode);

    const limerickText = screen.getByText(/There was an Old Man/i);
    expect(limerickText).toBeVisible();
  });

  it("show delete button with each limerick", async () => {
    const user = userEvent.setup();
    renderWithRouter(<LimerickApp />);

    fillCompleteLimerick();

    const saveButtonNode = screen.getByRole("button", { name: /^publish$/i });
    await user.click(saveButtonNode);

    const viewButtonNode = screen.getByRole("button", {
      name: /view saved limericks/i,
    });
    await user.click(viewButtonNode);

    const deleteButton = screen.getByRole("button", { name: /delete/i });
    expect(deleteButton).toBeVisible();
  });

  it("delete button removes a limerick returned by the API", async () => {
    const user = userEvent.setup();
    renderWithRouter(<LimerickApp />);

    fillCompleteLimerick();

    // Save Limerick
    const saveButtonNode = screen.getByRole("button", { name: /^publish$/i });
    await user.click(saveButtonNode);

    // View all saved limericks
    const viewButtonNode = screen.getByRole("button", {
      name: /view saved limericks/i,
    });
    await user.click(viewButtonNode);

    // Delete saved limerick
    const deleteButton = screen.getByRole("button", { name: /delete/i });
    await user.click(deleteButton);

    const confirmButton = screen.getByRole("button", { name: /confirm/i });
    await user.click(confirmButton);

    // Ensure the limerick is deleted
    await waitFor(() => {
      const limerickText = screen.queryByText(
        /There was an Old Man with a beard,/i,
      );
      expect(limerickText).not.toBeInTheDocument();
    });
  });

  it("confirm download modal pops up when user clicks download", async () => {
    const user = userEvent.setup();
    renderWithRouter(<LimerickApp />);

    fillCompleteLimerick();

    // Save Limerick
    const saveButtonNode = screen.getByRole("button", { name: /^publish$/i });
    await user.click(saveButtonNode);

    // View all saved limericks
    const viewButtonNode = screen.getByRole("button", {
      name: /view saved limericks/i,
    });
    await user.click(viewButtonNode);

    //User Clicks Download Button
    const downloadButton = screen.getByRole("button", { name: /download/i });
    await user.click(downloadButton);

    // Confirm Download Modal Pops Up
    const downloadModal = screen.getByRole("dialog");
    expect(downloadModal).toBeVisible();
  });

  it("confirm confirm button and cancel button render on modal dialog", async () => {
    const user = userEvent.setup();
    renderWithRouter(<LimerickApp />);

    fillCompleteLimerick();

    // Save Limerick
    const saveButtonNode = screen.getByRole("button", { name: /^publish$/i });
    await user.click(saveButtonNode);

    // View all saved limericks
    const viewButtonNode = screen.getByRole("button", {
      name: /view saved limericks/i,
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
    renderWithRouter(<LimerickApp />);

    fillCompleteLimerick();

    // Save Limerick
    const saveButtonNode = screen.getByRole("button", { name: /^publish$/i });
    await user.click(saveButtonNode);

    // View all saved limericks
    const viewButtonNode = screen.getByRole("button", {
      name: /view saved limericks/i,
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
    renderWithRouter(<LimerickApp />);
    fillCompleteLimerick();

    // Save Limerick
    const saveButtonNode = screen.getByRole("button", { name: /^publish$/i });
    await user.click(saveButtonNode);

    // View all saved limericks
    const viewButtonNode = screen.getByRole("button", {
      name: /view saved limericks/i,
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

  it("example doesn't show before user presses show button", () => {
    renderWithRouter(<LimerickApp />);

    const example = screen.queryByText(/There was an Old Man in a tree/i);
    expect(example).not.toBeInTheDocument();
  });
  it("creates and updates one incomplete draft while retaining content and focus", async () => {
    const user = userEvent.setup();
    renderWithRouter(<LimerickApp />);
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
    await waitFor(() => expect(globalThis.fetch.mock.calls.some(([url, options]) => /\/limerick\/1$/.test(url) && options.method === "PATCH")).toBe(true));
  });

  it("restores every line of an untitled limerick draft", async () => {
    const user = userEvent.setup();
    mockLimericks.push({ id: 8, title: "", lineOne: "One", lineTwo: "Two", lineThree: "Three", lineFour: "Four", lineFive: "Five", published: false });
    renderWithRouter(<LimerickApp />);
    await user.click(screen.getByRole("button", { name: /view saved limericks/i }));
    await user.click(screen.getByRole("button", { name: /resume draft/i }));
    await waitFor(() => expect(screen.getByLabelText("Limerick title")).toHaveFocus());
    ["One", "Two", "Three", "Four", "Five"].forEach((value, index) => {
      expect(screen.getByPlaceholderText(new RegExp(`line ${index + 1}`, "i"))).toHaveValue(value);
    });
  });

  it("publishes a saved draft by PATCHing the same record and resets the editor", async () => {
    const user = userEvent.setup();
    renderWithRouter(<LimerickApp />);
    await user.type(screen.getByLabelText("Limerick title"), "Ready poem");
    const lines = fillCompleteLimerick();
    await user.click(screen.getByRole("button", { name: /save draft/i }));
    await screen.findByText("Draft saved.");
    await user.click(screen.getByRole("button", { name: /^publish$/i }));
    await screen.findByText(/limerick published/i);
    expect(globalThis.fetch.mock.calls.some(([url, options]) => /\/limerick\/1$/.test(url) && options.method === "PATCH" && JSON.parse(options.body).published === true)).toBe(true);
    lines.forEach((line) => expect(line).toHaveValue(""));
  });

  it("edits a published limerick without offering or performing an unpublish", async () => {
    const user = userEvent.setup();
    mockLimericks.push({
      id: 14,
      title: "Published limerick",
      lineOne: "There was an Old Man with a beard,",
      lineTwo: 'Who said, "It is just as I feared!',
      lineThree: "Two Owls and a Hen,",
      lineFour: "Four Larks and a Wren,",
      lineFive: 'Have all built their nests in my beard!"',
      published: true,
      createdAt: new Date().toISOString(),
      limerickLikes: [],
      isFavorited: false,
      _count: { comments: 0, limerickLikes: 0 },
    });
    renderWithRouter(<LimerickApp />);
    await user.click(screen.getByRole("button", { name: /view saved limericks/i }));
    await user.click(screen.getByRole("button", { name: /edit limerick/i }));
    expect(screen.queryByRole("button", { name: /save draft/i })).not.toBeInTheDocument();
    await user.clear(screen.getByLabelText("Limerick title"));
    await user.type(screen.getByLabelText("Limerick title"), "Revised published limerick");
    await user.click(screen.getByRole("button", { name: /update published poem/i }));
    await waitFor(() => {
      const call = globalThis.fetch.mock.calls.find(([url, options]) =>
        /\/limerick\/14$/.test(url) && options.method === "PATCH",
      );
      expect(JSON.parse(call[1].body).published).toBe(true);
    });
  });

  it("makes title and all five lines read-only while publish is pending", async () => {
    let finishPublish;
    globalThis.fetch.mockImplementation(async (url, options = {}) => {
      if (url.endsWith("/limerick") && options.method === "POST") {
        return new Promise((resolve) => { finishPublish = resolve; });
      }
      return mockApi(url, options);
    });
    const user = userEvent.setup();
    renderWithRouter(<LimerickApp />);
    const title = screen.getByLabelText("Limerick title");
    await user.type(title, "Submitted limerick");
    const lines = fillCompleteLimerick();
    await user.click(screen.getByRole("button", { name: /^publish$/i }));
    expect(title).toHaveAttribute("readonly");
    lines.forEach((line) => expect(line).toHaveAttribute("readonly"));
    await user.type(lines[4], " lost change");
    expect(lines[4].value).not.toContain("lost change");
    finishPublish({ ok: true, status: 201, json: async () => ({ id: 22 }) });
    await screen.findByText(/limerick published/i);
  });

  it("keeps Save-draft-pending edits visible and dirty", async () => {
    let finishSave;
    globalThis.fetch.mockImplementation(async (url, options = {}) => {
      if (url.endsWith("/limerick") && options.method === "POST") {
        const submitted = JSON.parse(options.body);
        return new Promise((resolve) => { finishSave = () => resolve({ ok: true, status: 201, json: async () => ({ id: 23, ...submitted }) }); });
      }
      return mockApi(url, options);
    });
    const user = userEvent.setup();
    renderWithRouter(<LimerickApp />);
    const title = screen.getByLabelText("Limerick title");
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

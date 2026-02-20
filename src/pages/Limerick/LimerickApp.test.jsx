import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { getAllLimericks } from "./limericksStorage";
import userEvent from "@testing-library/user-event";
import LimerickApp from "./LimerickApp";
import { createMemoryRouter, RouterProvider } from "react-router";

const renderWithRouter = (component) => {
  const router = createMemoryRouter([
    {
      path: "/",
      element: component,
    },
  ]);
  return render(<RouterProvider router={router} />);
};

describe("App Component", () => {
  beforeEach(() => {
    //Clear localStorage before each test
    localStorage.clear();
  });

  it("save button appears when Limerick is complete", async () => {
    const user = userEvent.setup();
    renderWithRouter(<LimerickApp />);

    // Type a complete limerick
    const line1 = screen.getByPlaceholderText(/line 1/i);
    const line2 = screen.getByPlaceholderText(/line 2/i);
    const line3 = screen.getByPlaceholderText(/line 3/i);
    const line4 = screen.getByPlaceholderText(/line 4/i);
    const line5 = screen.getByPlaceholderText(/line 5/i);

    await user.type(line1, `There was an Old Man with a beard,`);
    await user.type(line2, `Who said, "It is just as I feared!`);
    await user.type(line3, `Two Owls and a Hen,`);
    await user.type(line4, `Four Larks and a Wren,`);
    await user.type(line5, `Have all built their nests in my beard!"`);

    const buttonNode = screen.getByRole("button", { name: /^save$/i });
    expect(buttonNode).toBeVisible();
  });

  it("displays 'You do Limerick!' when all lines have something typed", async () => {
    const user = userEvent.setup();
    renderWithRouter(<LimerickApp />);

    // Type a complete limerick
    const line1 = screen.getByPlaceholderText(/line 1/i);
    const line2 = screen.getByPlaceholderText(/line 2/i);
    const line3 = screen.getByPlaceholderText(/line 3/i);
    const line4 = screen.getByPlaceholderText(/line 4/i);
    const line5 = screen.getByPlaceholderText(/line 5/i);

    await user.type(line1, `There was an Old Man with a beard,`);
    await user.type(line2, `Who said, "It is just as I feared!`);
    await user.type(line3, `Two Owls and a Hen,`);
    await user.type(line4, `Four Larks and a Wren,`);
    await user.type(line5, `Have all built their nests in my beard!"`);

    const wellDone = screen.getByText("✨ You do limerick! ✨");
    expect(wellDone).toBeVisible;
  });

  it("saves a limerick to local storage when the save button is clicked", async () => {
    const user = userEvent.setup();
    renderWithRouter(<LimerickApp />);

    // Type a complete limerick
    const line1 = screen.getByPlaceholderText(/line 1/i);
    const line2 = screen.getByPlaceholderText(/line 2/i);
    const line3 = screen.getByPlaceholderText(/line 3/i);
    const line4 = screen.getByPlaceholderText(/line 4/i);
    const line5 = screen.getByPlaceholderText(/line 5/i);

    await user.type(line1, `There was an Old Man with a beard,`);
    await user.type(line2, `Who said, "It is just as I feared!`);
    await user.type(line3, `Two Owls and a Hen,`);
    await user.type(line4, `Four Larks and a Wren,`);
    await user.type(line5, `Have all built their nests in my beard!"`);

    const beforeSavingLimericks = getAllLimericks();
    expect(beforeSavingLimericks).toHaveLength(0);

    const buttonNode = screen.getByRole("button", { name: /^save$/i });
    await user.click(buttonNode);

    const savedLimericks = getAllLimericks();
    expect(savedLimericks).toHaveLength(1);
  });

  it("doesn't display 'saved' before the limerick is saved", async () => {
    const user = userEvent.setup();
    renderWithRouter(<LimerickApp />);

    // Type a complete limerick
    const line1 = screen.getByPlaceholderText(/line 1/i);
    const line2 = screen.getByPlaceholderText(/line 2/i);
    const line3 = screen.getByPlaceholderText(/line 3/i);
    const line4 = screen.getByPlaceholderText(/line 4/i);
    const line5 = screen.getByPlaceholderText(/line 5/i);

    await user.type(line1, `There was an Old Man with a beard,`);
    await user.type(line2, `Who said, "It is just as I feared!`);
    await user.type(line3, `Two Owls and a Hen,`);
    await user.type(line4, `Four Larks and a Wren,`);
    await user.type(line5, `Have all built their nests in my beard!"`);

    const saved = screen.queryByText(/saved!/i);
    expect(saved).not.toBeInTheDocument;
  });

  it("displays 'saved' after the limerick is saved", async () => {
    const user = userEvent.setup();
    renderWithRouter(<LimerickApp />);

    // Type a complete limerick
    const line1 = screen.getByPlaceholderText(/line 1/i);
    const line2 = screen.getByPlaceholderText(/line 2/i);
    const line3 = screen.getByPlaceholderText(/line 3/i);
    const line4 = screen.getByPlaceholderText(/line 4/i);
    const line5 = screen.getByPlaceholderText(/line 5/i);

    await user.type(line1, `There was an Old Man with a beard,`);
    await user.type(line2, `Who said, "It is just as I feared!`);
    await user.type(line3, `Two Owls and a Hen,`);
    await user.type(line4, `Four Larks and a Wren,`);
    await user.type(line5, `Have all built their nests in my beard!"`);

    const buttonNode = screen.getByRole("button", { name: /^save$/i });
    await user.click(buttonNode);

    const saved = screen.getByText(/saved!/i);
    expect(saved).toBeVisible();
  });

  it("clears the inputs fields after saving", async () => {
    const user = userEvent.setup();
    renderWithRouter(<LimerickApp />);
    // Type a complete limerick
    const line1 = screen.getByPlaceholderText(/line 1/i);
    const line2 = screen.getByPlaceholderText(/line 2/i);
    const line3 = screen.getByPlaceholderText(/line 3/i);
    const line4 = screen.getByPlaceholderText(/line 4/i);
    const line5 = screen.getByPlaceholderText(/line 5/i);

    await user.type(line1, `There was an Old Man with a beard,`);
    await user.type(line2, `Who said, "It is just as I feared!`);
    await user.type(line3, `Two Owls and a Hen,`);
    await user.type(line4, `Four Larks and a Wren,`);
    await user.type(line5, `Have all built their nests in my beard!"`);

    const buttonNode = screen.getByRole("button", { name: /^save$/i });
    await user.click(buttonNode);

    expect(line1).toHaveValue("");
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
    // Type a complete limerick
    const line1 = screen.getByPlaceholderText(/line 1/i);
    const line2 = screen.getByPlaceholderText(/line 2/i);
    const line3 = screen.getByPlaceholderText(/line 3/i);
    const line4 = screen.getByPlaceholderText(/line 4/i);
    const line5 = screen.getByPlaceholderText(/line 5/i);

    await user.type(line1, `There was an Old Man with a beard,`);
    await user.type(line2, `Who said, "It is just as I feared!`);
    await user.type(line3, `Two Owls and a Hen,`);
    await user.type(line4, `Four Larks and a Wren,`);
    await user.type(line5, `Have all built their nests in my beard!"`);

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

  it("returns a 'no limericks' message when the localStorage contains no limericks", async () => {
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
    // Type a complete limerick
    const line1 = screen.getByPlaceholderText(/line 1/i);
    const line2 = screen.getByPlaceholderText(/line 2/i);
    const line3 = screen.getByPlaceholderText(/line 3/i);
    const line4 = screen.getByPlaceholderText(/line 4/i);
    const line5 = screen.getByPlaceholderText(/line 5/i);

    await user.type(line1, `There was an Old Man with a beard,`);
    await user.type(line2, `Who said, "It is just as I feared!`);
    await user.type(line3, `Two Owls and a Hen,`);
    await user.type(line4, `Four Larks and a Wren,`);
    await user.type(line5, `Have all built their nests in my beard!"`);

    const saveButtonNode = screen.getByRole("button", { name: /^save$/i });
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

    // Type a complete limerick
    const line1 = screen.getByPlaceholderText(/line 1/i);
    const line2 = screen.getByPlaceholderText(/line 2/i);
    const line3 = screen.getByPlaceholderText(/line 3/i);
    const line4 = screen.getByPlaceholderText(/line 4/i);
    const line5 = screen.getByPlaceholderText(/line 5/i);

    await user.type(line1, `There was an Old Man with a beard,`);
    await user.type(line2, `Who said, "It is just as I feared!`);
    await user.type(line3, `Two Owls and a Hen,`);
    await user.type(line4, `Four Larks and a Wren,`);
    await user.type(line5, `Have all built their nests in my beard!"`);

    const saveButtonNode = screen.getByRole("button", { name: /^save$/i });
    await user.click(saveButtonNode);

    const viewButtonNode = screen.getByRole("button", {
      name: /view saved limericks/i,
    });
    await user.click(viewButtonNode);

    const deleteButton = screen.getByRole("button", { name: /delete/i });
    expect(deleteButton).toBeVisible();
  });

  it("delete button removes limerick from stored limericks", async () => {
    const user = userEvent.setup();
    renderWithRouter(<LimerickApp />);

    // Type a complete limerick
    const line1 = screen.getByPlaceholderText(/line 1/i);
    const line2 = screen.getByPlaceholderText(/line 2/i);
    const line3 = screen.getByPlaceholderText(/line 3/i);
    const line4 = screen.getByPlaceholderText(/line 4/i);
    const line5 = screen.getByPlaceholderText(/line 5/i);

    await user.type(line1, `There was an Old Man with a beard,`);
    await user.type(line2, `Who said, "It is just as I feared!`);
    await user.type(line3, `Two Owls and a Hen,`);
    await user.type(line4, `Four Larks and a Wren,`);
    await user.type(line5, `Have all built their nests in my beard!"`);

    // Save Limerick
    const saveButtonNode = screen.getByRole("button", { name: /^save$/i });
    await user.click(saveButtonNode);

    // View all saved limericks
    const viewButtonNode = screen.getByRole("button", {
      name: /view saved limericks/i,
    });
    await user.click(viewButtonNode);

    // Delete saved limerick
    const deleteButton = screen.getByRole("button", { name: /delete/i });
    await user.click(deleteButton);

    // Ensure the limerick is deleted
    const limerickText = screen.queryByText(/it is me here hi/i);
    expect(limerickText).not.toBeInTheDocument();
  });

  it("confirm download modal pops up when user clicks download", async () => {
    const user = userEvent.setup();
    renderWithRouter(<LimerickApp />);

    // Type a complete limerick
    const line1 = screen.getByPlaceholderText(/line 1/i);
    const line2 = screen.getByPlaceholderText(/line 2/i);
    const line3 = screen.getByPlaceholderText(/line 3/i);
    const line4 = screen.getByPlaceholderText(/line 4/i);
    const line5 = screen.getByPlaceholderText(/line 5/i);

    await user.type(line1, `There was an Old Man with a beard,`);
    await user.type(line2, `Who said, "It is just as I feared!`);
    await user.type(line3, `Two Owls and a Hen,`);
    await user.type(line4, `Four Larks and a Wren,`);
    await user.type(line5, `Have all built their nests in my beard!"`);

    // Save Limerick
    const saveButtonNode = screen.getByRole("button", { name: /^save$/i });
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

    // Type a complete limerick
    const line1 = screen.getByPlaceholderText(/line 1/i);
    const line2 = screen.getByPlaceholderText(/line 2/i);
    const line3 = screen.getByPlaceholderText(/line 3/i);
    const line4 = screen.getByPlaceholderText(/line 4/i);
    const line5 = screen.getByPlaceholderText(/line 5/i);

    await user.type(line1, `There was an Old Man with a beard,`);
    await user.type(line2, `Who said, "It is just as I feared!`);
    await user.type(line3, `Two Owls and a Hen,`);
    await user.type(line4, `Four Larks and a Wren,`);
    await user.type(line5, `Have all built their nests in my beard!"`);

    // Save Limerick
    const saveButtonNode = screen.getByRole("button", { name: /^save$/i });
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

    // Type a complete limerick
    const line1 = screen.getByPlaceholderText(/line 1/i);
    const line2 = screen.getByPlaceholderText(/line 2/i);
    const line3 = screen.getByPlaceholderText(/line 3/i);
    const line4 = screen.getByPlaceholderText(/line 4/i);
    const line5 = screen.getByPlaceholderText(/line 5/i);

    await user.type(line1, `There was an Old Man with a beard,`);
    await user.type(line2, `Who said, "It is just as I feared!`);
    await user.type(line3, `Two Owls and a Hen,`);
    await user.type(line4, `Four Larks and a Wren,`);
    await user.type(line5, `Have all built their nests in my beard!"`);

    // Save Limerick
    const saveButtonNode = screen.getByRole("button", { name: /^save$/i });
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
    // Type a complete limerick
    const line1 = screen.getByPlaceholderText(/line 1/i);
    const line2 = screen.getByPlaceholderText(/line 2/i);
    const line3 = screen.getByPlaceholderText(/line 3/i);
    const line4 = screen.getByPlaceholderText(/line 4/i);
    const line5 = screen.getByPlaceholderText(/line 5/i);

    await user.type(line1, `There was an Old Man with a beard,`);
    await user.type(line2, `Who said, "It is just as I feared!`);
    await user.type(line3, `Two Owls and a Hen,`);
    await user.type(line4, `Four Larks and a Wren,`);
    await user.type(line5, `Have all built their nests in my beard!"`);

    // Save Limerick
    const saveButtonNode = screen.getByRole("button", { name: /^save$/i });
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
});

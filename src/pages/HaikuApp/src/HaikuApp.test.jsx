import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { getAllHaikus } from "./haikuStorage";
import userEvent from "@testing-library/user-event";
import HaikuApp from "./HaikuApp";

describe.skip("App Component", () => {
  beforeEach(() => {
    //Clear localStorage before each test
    localStorage.clear();
  });

  it("save button appears when haiku is complete", async () => {
    const user = userEvent.setup();
    render(<HaikuApp />);
    // Type a complete haiku (5-7-5 syllables)
    const line1 = screen.getByPlaceholderText(/line 1/i);
    const line2 = screen.getByPlaceholderText(/line 2/i);
    const line3 = screen.getByPlaceholderText(/line 3/i);

    await user.type(line1, "Hello World My Dear");
    await user.type(line2, "I hope you are feeling well");
    await user.type(line3, "I am waiting here");
    const buttonNode = screen.getByRole("button", { name: /^save$/i });
    expect(buttonNode).toBeVisible();
  });

  it("displays 'You do Haiku!' when the the syllable requirements are met", async () => {
    const user = userEvent.setup();
    render(<HaikuApp />);
    // Type a complete haiku (5-7-5 syllables)
    const line1 = screen.getByPlaceholderText(/line 1/i);
    const line2 = screen.getByPlaceholderText(/line 2/i);
    const line3 = screen.getByPlaceholderText(/line 3/i);

    await user.type(line1, "Hello World My Dear");
    await user.type(line2, "I hope you are feeling well");
    await user.type(line3, "I am waiting here");

    const wellDone = screen.getByText(/✨ You do haiku! ✨/i);
    expect(wellDone).toBeVisible;
  });
  it("saves a haiku to local storage when the save button is clicked", async () => {
    const user = userEvent.setup();
    render(<HaikuApp />);
    // Type a complete haiku (5-7-5 syllables)
    const line1 = screen.getByPlaceholderText(/line 1/i);
    const line2 = screen.getByPlaceholderText(/line 2/i);
    const line3 = screen.getByPlaceholderText(/line 3/i);

    await user.type(line1, "Hello World My Dear");
    await user.type(line2, "I hope you are feeling well");
    await user.type(line3, "I am waiting here");

    const beforeSavingHaikus = getAllHaikus();
    expect(beforeSavingHaikus).toHaveLength(0);

    const buttonNode = screen.getByRole("button", { name: /^save$/i });
    await user.click(buttonNode);

    const savedHaikus = getAllHaikus();
    expect(savedHaikus).toHaveLength(1);
  });

  it("doesn't display 'saved' before the haiku is saved", async () => {
    const user = userEvent.setup();
    render(<HaikuApp />);
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
    render(<HaikuApp />);
    // Type a complete haiku (5-7-5 syllables)
    const line1 = screen.getByPlaceholderText(/line 1/i);
    const line2 = screen.getByPlaceholderText(/line 2/i);
    const line3 = screen.getByPlaceholderText(/line 3/i);

    await user.type(line1, "Hello World My Dear");
    await user.type(line2, "I hope you are feeling well");
    await user.type(line3, "I am waiting here");

    const buttonNode = screen.getByRole("button", { name: /^save$/i });
    await user.click(buttonNode);

    const saved = screen.getByText(/saved!/i);
    expect(saved).toBeVisible();
  });

  it("clears the inputs fields after saving", async () => {
    const user = userEvent.setup();
    render(<HaikuApp />);
    // Type a complete haiku (5-7-5 syllables)
    const line1 = screen.getByPlaceholderText(/line 1/i);
    const line2 = screen.getByPlaceholderText(/line 2/i);
    const line3 = screen.getByPlaceholderText(/line 3/i);

    await user.type(line1, "Do you do haiku");
    await user.type(line2, "I do I haiku for you");
    await user.type(line3, "I haiku for you");

    const buttonNode = screen.getByRole("button", { name: /^save$/i });
    await user.click(buttonNode);

    expect(line1).toHaveValue("");
  });

  it("clear button appears when the user types into one of the fields", async () => {
    const user = userEvent.setup();
    render(<HaikuApp />);
    // Type a complete haiku (5-7-5 syllables)
    const line1 = screen.getByPlaceholderText(/line 1/i);

    await user.type(line1, "Do you do haiku");

    const buttonNode = screen.getByRole("button", { name: /clear/i });
    expect(buttonNode).toBeVisible();
  });

  it("all fields clear when user clicks clear button", async () => {
    const user = userEvent.setup();
    render(<HaikuApp />);
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
    render(<HaikuApp />);
    const buttonNode = screen.getByRole("button", {
      name: /view saved haikus/i,
    });
    expect(buttonNode).toBeVisible();
  });

  it("saved haikus div appears when button is clicked", async () => {
    const user = userEvent.setup();
    render(<HaikuApp />);
    const buttonNode = screen.getByRole("button", {
      name: /view saved haikus/i,
    });

    await user.click(buttonNode);
    const savedHaikus = screen.getByText(/^saved haikus$/i);
    expect(savedHaikus).toBeVisible();
  });

  it("returns a 'no haikus' message when the localStorage contains no haikus", async () => {
    const user = userEvent.setup();
    render(<HaikuApp />);
    const buttonNode = screen.getByRole("button", {
      name: /view saved haikus/i,
    });

    await user.click(buttonNode);
    const noHaikus = screen.getByText(/no saved haikus/i);
    expect(noHaikus).toBeVisible();
  });

  it("displays the saved haiku when the view saved haikus button is pressed", async () => {
    const user = userEvent.setup();
    render(<HaikuApp />);
    // Type a complete haiku (5-7-5 syllables)
    const line1 = screen.getByPlaceholderText(/line 1/i);
    const line2 = screen.getByPlaceholderText(/line 2/i);
    const line3 = screen.getByPlaceholderText(/line 3/i);

    await user.type(line1, "it is me here hi");
    await user.type(line2, "hey you look at that right there");
    await user.type(line3, "hey you hi there hi");

    const saveButtonNode = screen.getByRole("button", { name: /^save$/i });
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
    render(<HaikuApp />);
    // Type a complete haiku (5-7-5 syllables)
    const line1 = screen.getByPlaceholderText(/line 1/i);
    const line2 = screen.getByPlaceholderText(/line 2/i);
    const line3 = screen.getByPlaceholderText(/line 3/i);

    await user.type(line1, "it is me here hi");
    await user.type(line2, "hey you look at that right there");
    await user.type(line3, "hey you hi there hi");

    const saveButtonNode = screen.getByRole("button", { name: /^save$/i });
    await user.click(saveButtonNode);

    const viewButtonNode = screen.getByRole("button", {
      name: /view saved haikus/i,
    });
    await user.click(viewButtonNode);

    const deleteButton = screen.getByRole("button", { name: /delete/i });
    expect(deleteButton).toBeVisible();
  });

  it("delete button removes haiku from stored haikus", async () => {
    const user = userEvent.setup();
    render(<HaikuApp />);
    // Type a complete haiku (5-7-5 syllables)
    const line1 = screen.getByPlaceholderText(/line 1/i);
    const line2 = screen.getByPlaceholderText(/line 2/i);
    const line3 = screen.getByPlaceholderText(/line 3/i);

    await user.type(line1, "it is me here hi");
    await user.type(line2, "hey you look at that right there");
    await user.type(line3, "hey you hi there hi");

    // Save Haiku
    const saveButtonNode = screen.getByRole("button", { name: /^save$/i });
    await user.click(saveButtonNode);

    // View all saved haikus
    const viewButtonNode = screen.getByRole("button", {
      name: /view saved haikus/i,
    });
    await user.click(viewButtonNode);

    // Delete saved haiku
    const deleteButton = screen.getByRole("button", { name: /delete/i });
    await user.click(deleteButton);

    // Ensure the haiku is deleted
    const haikuText = screen.queryByText(/it is me here hi/i);
    expect(haikuText).not.toBeInTheDocument();
  });

  it("confirm download modal pops up when user clicks download", async () => {
    const user = userEvent.setup();
    render(<HaikuApp />);
    // Type a complete haiku (5-7-5 syllables)
    const line1 = screen.getByPlaceholderText(/line 1/i);
    const line2 = screen.getByPlaceholderText(/line 2/i);
    const line3 = screen.getByPlaceholderText(/line 3/i);

    await user.type(line1, "it is me here hi");
    await user.type(line2, "hey you look at that right there");
    await user.type(line3, "hey you hi there hi");

    // Save Haiku
    const saveButtonNode = screen.getByRole("button", { name: /^save$/i });
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
    const downloadModal = screen.getByRole("dialog");
    expect(downloadModal).toBeVisible();
  });

  it("confirm confirm button and cancel button render on modal dialog", async () => {
    const user = userEvent.setup();
    render(<HaikuApp />);
    // Type a complete haiku (5-7-5 syllables)
    const line1 = screen.getByPlaceholderText(/line 1/i);
    const line2 = screen.getByPlaceholderText(/line 2/i);
    const line3 = screen.getByPlaceholderText(/line 3/i);

    await user.type(line1, "it is me here hi");
    await user.type(line2, "hey you look at that right there");
    await user.type(line3, "hey you hi there hi");

    // Save Haiku
    const saveButtonNode = screen.getByRole("button", { name: /^save$/i });
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
    render(<HaikuApp />);
    // Type a complete haiku (5-7-5 syllables)
    const line1 = screen.getByPlaceholderText(/line 1/i);
    const line2 = screen.getByPlaceholderText(/line 2/i);
    const line3 = screen.getByPlaceholderText(/line 3/i);

    await user.type(line1, "it is me here hi");
    await user.type(line2, "hey you look at that right there");
    await user.type(line3, "hey you hi there hi");

    // Save Haiku
    const saveButtonNode = screen.getByRole("button", { name: /^save$/i });
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
    render(<HaikuApp />);
    // Type a complete haiku (5-7-5 syllables)
    const line1 = screen.getByPlaceholderText(/line 1/i);
    const line2 = screen.getByPlaceholderText(/line 2/i);
    const line3 = screen.getByPlaceholderText(/line 3/i);

    await user.type(line1, "it is me here hi");
    await user.type(line2, "hey you look at that right there");
    await user.type(line3, "hey you hi there hi");

    // Save Haiku
    const saveButtonNode = screen.getByRole("button", { name: /^save$/i });
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
});

export const poemFieldValidationError = (state, lineFields, countFields) => {
  const textFields = ["title", ...lineFields];
  const published = state.published === true;

  for (const field of textFields) {
    if (typeof state[field] !== "string") return `${field} is required`;
    if (state[field].length > 100) return `${field} cannot exceed 100 characters`;
  }

  for (const field of countFields) {
    const rawCount = state[field];
    const isIntegerInput =
      (typeof rawCount === "number" && Number.isInteger(rawCount)) ||
      (typeof rawCount === "string" && /^[+-]?\d+$/.test(rawCount));
    const count = Number(rawCount);
    if (!isIntegerInput || count < 0 || count > 9) {
      return `${field} must be a number between 0 and 9`;
    }
  }

  if (published && textFields.some((field) => !state[field].trim())) {
    return "Published poems require a title and every line";
  }

  if (!published && textFields.every((field) => !state[field].trim())) {
    return "A draft must include a title or at least one line";
  }

  return null;
};

export const sendPoemValidationError = (res, message) =>
  res.status(400).json({ errors: [{ msg: message }] });

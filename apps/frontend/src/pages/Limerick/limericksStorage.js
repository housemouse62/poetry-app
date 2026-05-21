export function saveLimerick(limerick) {
  // Get existing limericks from localStorage
  const existing = getAllLimericks();

  // Add new limerick with a unique ID and timestamp
  const newLimerick = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...limerick,
  };
  existing.push(newLimerick);
  //Save back to localStorage
  localStorage.setItem("limericks", JSON.stringify(existing));
}

export function deleteLimerick(id) {
  // Get existing limericks from localStorage
  let existing = getAllLimericks();

  // Filter out Limerick with matching ID
  const newLimericks = existing.filter((h) => h.id !== id);
  localStorage.setItem("limericks", JSON.stringify(newLimericks));
}

export function getAllLimericks() {
  const stored = localStorage.getItem("limericks");
  return stored ? JSON.parse(stored) : [];
}

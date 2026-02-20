export function saveLimerick(limerick) {
  // Get existing limericks from localStorage
  const existing = getAllLimericks();

  // Add new limerick with a unique ID and timestamp
  const newLimerick = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...limerick,
  };
  console.log("saving", newLimerick);
  existing.push(newLimerick);
  //Save back to localStorage
  localStorage.setItem("limericks", JSON.stringify(existing));
}

export function deleteLimerick(id) {
  console.log("delete", id);
  // Get existing limericks from localStorage
  let existing = getAllLimericks();
  console.log("existing", existing);
  // Filter out Limerick with matching ID
  const newLimericks = existing.filter((h) => h.id !== id);
  console.log("newLimericks", newLimericks);
  localStorage.setItem("limericks", JSON.stringify(newLimericks));
}

export function getAllLimericks() {
  const stored = localStorage.getItem("limericks");
  return stored ? JSON.parse(stored) : [];
}

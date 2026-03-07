export function saveHaiku(haiku) {
  // Get existing haikus from localStorage
  const existing = getAllHaikus();

  // Add new haiku with a unique ID and timestamp
  const newHaiku = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...haiku,
  };
  existing.push(newHaiku);
  //Save back to localStorage
  localStorage.setItem("haikus", JSON.stringify(existing));
}

export function deleteHaiku(id) {
  // Get existing haikus from localStorage
  let existing = getAllHaikus();
  // Filter out Haiku with matching ID
  const newHaikus = existing.filter((h) => h.id !== id);
  localStorage.setItem("haikus", JSON.stringify(newHaikus));
}

export function getAllHaikus() {
  const stored = localStorage.getItem("haikus");
  return stored ? JSON.parse(stored) : [];
}

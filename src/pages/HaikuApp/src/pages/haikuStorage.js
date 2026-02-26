export function saveHaiku(haiku) {
  // Get existing haikus from localStorage
  const existing = getAllHaikus();

  // Add new haiku with a unique ID and timestamp
  const newHaiku = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...haiku,
  };
  console.log("saving", newHaiku);
  existing.push(newHaiku);
  //Save back to localStorage
  localStorage.setItem("haikus", JSON.stringify(existing));
}

export function deleteHaiku(id) {
  console.log("delete", id);
  // Get existing haikus from localStorage
  let existing = getAllHaikus();
  console.log("existing", existing);
  // Filter out Haiku with matching ID
  const newHaikus = existing.filter((h) => h.id !== id);
  console.log("newHaikus", newHaikus);
  localStorage.setItem("haikus", JSON.stringify(newHaikus));
}

export function getAllHaikus() {
  const stored = localStorage.getItem("haikus");
  return stored ? JSON.parse(stored) : [];
}

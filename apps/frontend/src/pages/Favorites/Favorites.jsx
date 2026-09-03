import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import PoemCard from "../../components/PoemCard/PoemCard.jsx";
import { useAuth } from "../../context/useAuth";
import "./Favorites.css";

function Favorites() {
  const { token } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [privacyPending, setPrivacyPending] = useState({});
  const [privacyErrors, setPrivacyErrors] = useState({});
  const [status, setStatus] = useState("");
  const focusTargetRef = useRef(null);
  const favoriteButtonRefs = useRef(new Map());
  const headingRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    const loadFavorites = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/favorite/mine/hydrated`,
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          },
        );
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Request failed");
        setEntries(result);
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          if (import.meta.env.DEV) console.error(requestError);
          setError("Cannot load your favorites. Please try again.");
          setEntries([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    loadFavorites();
    return () => controller.abort();
  }, [retryCount, token]);

  useEffect(() => {
    const focusTarget = focusTargetRef.current;
    if (!focusTarget) return;
    if (focusTarget === "heading") headingRef.current?.focus();
    else favoriteButtonRefs.current.get(focusTarget)?.focus();
    focusTargetRef.current = null;
  }, [entries]);

  const changePrivacy = async (entry, privacy) => {
    const key = `${entry.poem.poemType}-${entry.poem.id}`;
    setPrivacyPending((current) => ({ ...current, [key]: true }));
    setPrivacyErrors((current) => ({ ...current, [key]: "" }));
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/favorite/${entry.poem.poemType}/${entry.poem.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ privacy }),
        },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Request failed");
      setEntries((current) =>
        current.map((item) =>
          item.favorite.id === entry.favorite.id
            ? { ...item, favorite: { ...item.favorite, privacy } }
            : item,
        ),
      );
      setStatus(`${entry.poem.title} is now ${privacy}.`);
    } catch (requestError) {
      if (import.meta.env.DEV) console.error(requestError);
      setPrivacyErrors((current) => ({
        ...current,
        [key]: `Cannot change visibility for ${entry.poem.title}. Please try again.`,
      }));
    } finally {
      setPrivacyPending((current) => ({ ...current, [key]: false }));
    }
  };

  const removeEntry = (entry) => {
    const index = entries.findIndex(
      (item) => item.favorite.id === entry.favorite.id,
    );
    const nextEntry = entries[index + 1] ?? entries[index - 1];
    focusTargetRef.current =
      nextEntry
        ? `${nextEntry.poem.poemType}-${nextEntry.poem.id}`
        : "heading";
    setEntries((current) =>
      current.filter((item) => item.favorite.id !== entry.favorite.id),
    );
    setStatus(`${entry.poem.title} removed from favorites.`);
  };

  return (
    <main className="favorites-app">
      <section className="favorites-container" aria-labelledby="favorites-title">
        <h1 id="favorites-title" ref={headingRef} tabIndex="-1">
          Your favorites
        </h1>
        <p>
          Private favorites are visible only in your collection. Public favorites
          are eligible for future public-favorites views.
        </p>

        <div aria-live="polite" aria-busy={loading}>
          {loading && <p role="status">Loading favorites…</p>}
          {error && (
            <div>
              <p role="alert">{error}</p>
              <button type="button" onClick={() => setRetryCount((count) => count + 1)}>
                Try again
              </button>
            </div>
          )}
          {!loading && !error && entries.length === 0 && (
            <div className="favorites-empty">
              <p>You have no favorites yet.</p>
              <Link to="/poems">Browse the public poems feed</Link>
            </div>
          )}
        </div>

        {!loading && !error && entries.length > 0 && (
          <div className="favorites-list">
            {entries.map((entry) => {
              const key = `${entry.poem.poemType}-${entry.poem.id}`;
              return (
                <section key={entry.favorite.id} aria-label={`Favorite: ${entry.poem.title}`}>
                  <div className="favorite-privacy">
                    <label htmlFor={`privacy-${key}`}>
                      Visibility for {entry.poem.title}
                    </label>
                    <select
                      id={`privacy-${key}`}
                      value={entry.favorite.privacy}
                      disabled={Boolean(privacyPending[key])}
                      onChange={(event) => changePrivacy(entry, event.target.value)}
                    >
                      <option value="private">Private</option>
                      <option value="public">Public</option>
                    </select>
                    <span className="favorite-privacy-state">
                      {entry.favorite.privacy === "private" ? "Private" : "Public"}
                    </span>
                    {privacyErrors[key] && <p role="alert">{privacyErrors[key]}</p>}
                  </div>
                  <PoemCard
                    poem={entry.poem}
                    poemType={entry.poem.poemType}
                    favoriteButtonRef={(node) => {
                      if (node) favoriteButtonRefs.current.set(key, node);
                      else favoriteButtonRefs.current.delete(key);
                    }}
                    onFavoriteChange={(isFavorited) => {
                      if (!isFavorited) removeEntry(entry);
                    }}
                  />
                </section>
              );
            })}
          </div>
        )}
        <p className="sr-only" role="status">{status}</p>
      </section>
    </main>
  );
}

export default Favorites;

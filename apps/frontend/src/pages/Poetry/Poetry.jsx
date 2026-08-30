import { useEffect, useState } from "react";
import "./Poetry.css";
import { useAuth } from "../../context/AuthContext.jsx";
import PoemCard from "../../components/PoemCard/PoemCard.jsx";

function Poetry() {
  const { token } = useAuth();
  const [savedPoems, setSavedPoems] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [type, setType] = useState("all");
  const [date, setDate] = useState("all");
  const [sort, setSort] = useState("all");
  const [totalPages, setTotalPages] = useState(0);
  const [totalPoems, setTotalPoems] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const fetchPoems = async () => {
      const query = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        type,
        date,
        sort,
      });
      setLoading(true);
      setError(null);
      setSavedPoems([]);

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/feed?${query}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          },
        );
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Cannot show poems");

        setSavedPoems(result.paginated);
        setTotalPages(result.totalPages);
        setTotalPoems(result.totalPoems);
      } catch (fetchError) {
        if (fetchError.name !== "AbortError") {
          if (import.meta.env.DEV) console.error(fetchError);
          setError("Cannot show poems. Please try again.");
          setTotalPages(0);
          setTotalPoems(0);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchPoems();
    return () => controller.abort();
  }, [page, pageSize, type, date, sort, token, retryCount]);

  const updateFilter = (setter) => (event) => {
    setter(event.target.value);
    setPage(1);
  };

  return (
    <main className="poetry-app">
      <section className="poetry-container" aria-labelledby="poetry-title">
        <div className="read-title-div">
          <h1 id="poetry-title" className="poetry-feed-title">
            read poetry.
          </h1>
        </div>

        <div className="drop-downs" aria-label="Filter poems">
          <label>
            <span>Date</span>
            <select onChange={updateFilter(setDate)} value={date}>
              <option value="all">All dates</option>
              <option value="24hours">24 hours</option>
              <option value="3days">3 days</option>
              <option value="7days">7 days</option>
            </select>
          </label>
          <label>
            <span>Type</span>
            <select onChange={updateFilter(setType)} value={type}>
              <option value="all">All types</option>
              <option value="haiku">Haikus</option>
              <option value="limerick">Limericks</option>
            </select>
          </label>
          <label>
            <span>Sort</span>
            <select onChange={updateFilter(setSort)} value={sort}>
              <option value="all">Newest</option>
              <option value="likes">Most liked</option>
            </select>
          </label>
        </div>

        <hr className="poetry-divider" />

        <div aria-live="polite" aria-busy={loading}>
          {loading && <p className="feed-status">Loading poems…</p>}
          {error && (
            <div className="feed-status">
              <p className="error-message" role="alert">
                {error}
              </p>
              <button type="button" onClick={() => setRetryCount((count) => count + 1)}>
                Try again
              </button>
            </div>
          )}
          {!loading && !error && savedPoems.length === 0 && (
            <p className="feed-status">No published poems match these filters.</p>
          )}
        </div>

        {!loading && !error && (
          <div className="poetry-feed">
            {savedPoems.map((poem) => (
              <PoemCard
                poem={poem}
                poemType={poem.poemType}
                key={`${poem.poemType}-${poem.id}`}
              />
            ))}
          </div>
        )}

        {!loading && !error && totalPages > 1 && (
          <nav className="feed-pagination" aria-label="Poem pages">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((current) => current - 1)}
            >
              Previous
            </button>
            <p aria-live="polite">
              Page {page} of {totalPages} · {totalPoems} poems
            </p>
            <button
              type="button"
              disabled={page === totalPages}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </button>
          </nav>
        )}
      </section>
    </main>
  );
}

export default Poetry;

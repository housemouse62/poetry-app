// Poetry.jsx
import { useState, useEffect } from "react";
import "./Poetry.css";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext.jsx";
import formatDate from "../../utils/formatDate.js";
import PoemCard from "../../components/PoemCard/PoemCard.jsx";

function Poetry() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [savedPoems, setSavedPoems] = useState([]);
  const [error, setError] = useState();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [type, setType] = useState("all");
  const [date, setDate] = useState("all");
  const [sort, setSort] = useState("all");
  const [totalPages, setTotalPages] = useState(null);
  const [totalPoems, setTotalPoems] = useState(null);

  useEffect(() => {
    const fetchPoems = async () => {
      const url = `${import.meta.env.VITE_API_URL}/feed?pages=${page}&pageSize=${pageSize}&type=${type}&date=${date}&sort=${sort}`;
      try {
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const nextresponse = await response.json();
        console.log("next response", nextresponse.paginated);
        if (response.ok) {
          setSavedPoems(nextresponse.paginated);
          setTotalPages(nextresponse.totalPages);
          setTotalPoems(nextresponse.totalPoems);
          setError(null);
        } else setError("Cannot show Poems. Please try again.");
      } catch (error) {
        if (import.meta.env.DEV) console.error(error);
        setError("Something went wrong. Please try again.");
      }
    };
    fetchPoems();
  }, [page, pageSize, type, date, sort]);

  return (
    <>
      <div className="poetry-app">
        <div className="poetry-container">
          <h2 className="poetry-feed-title">make poetry</h2>
          <div className="horiz-line-top">
            <hr />
          </div>
          <div className="dropDowns">
            <select onChange={(e) => setDate(e.target.value)} value={date}>
              <option value="all">All dates</option>
              <option value="24hours">24 hours</option>
              <option value="3days">3 days</option>
              <option value="7days">7 days</option>
            </select>
            <select onChange={(e) => setType(e.target.value)} value={type}>
              <option value="all">All</option>
              <option value="haiku">Haikus</option>
              <option value="limerick">Limericks</option>
            </select>
            <select onChange={(e) => setSort(e.target.value)} value={sort}>
              <option value="all">All</option>
              <option value="likes">Likes</option>
            </select>
          </div>
          {savedPoems.map((p) => (
            <div key={p.id + p.poemType}>
              <PoemCard poem={p} poemType={p.poemType} />
            </div>
          ))}
        </div>
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
      </div>
    </>
  );
}

export default Poetry;

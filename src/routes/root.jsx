import { Link } from "react-router";
import { useWordData } from "../pages/HaikuApp/src/pages/WordFind";
import "./root.css";

export default function Root() {
  const { wordData, loading, error } = useWordData("flippant");
  console.log(wordData);
  return (
    <>
      <div className="root-app">
        <div className="root-container">
          <div className="root-title-div">
            <h1 className="root-title">make poetry.</h1>
          </div>
          <div className="poem-cards">
            <Link to="/haiku" className="link">
              <div className="poem-card haiku">
                <h2>🌸</h2>
                <p className="card-title">haiku</p>
                <p className="card-tagline">5 - 7 - 5</p>
                <p className="saved-count">__ saved</p>
              </div>
            </Link>
            <Link to="/limerick" className="link">
              <div className="poem-card limerick">
                <h2>🍀</h2>
                <p className="card-title">limerick</p>
                <p className="card-tagline">playful rhymes</p>
                <p className="saved-count">__ saved</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

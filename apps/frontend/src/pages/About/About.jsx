import { Link } from "react-router";
import "./About.css";

function About() {
  return (
    <main className="about-app">
      <article className="about-card" aria-labelledby="about-title">
        <Link className="about-back-link" to="/">
          home
        </Link>
        <h1 id="about-title">about make poetry.</h1>
        <p>
          <strong>make poetry.</strong> is a place to write, save, and share
          haikus and limericks.
        </p>
        <p>
          Accessibility-first design is a core product goal, shaping keyboard
          access, focus behavior, readable feedback, and screen-reader support.
        </p>
        <p>
          Spoken reading, haptics, native mobile features, and widgets are
          future roadmap work, not features available today.
        </p>
      </article>
    </main>
  );
}

export default About;

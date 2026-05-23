import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/users", (req, res) => {
  return res.send("Received a GET HTTP method on user resource");
});

app.post("/users", (req, res) => {
  return res.send("Received a POST HTTP method on user resource");
});

app.put("/users/:userID", (req, res) => {
  return res.send(
    `Received a PUT HTTP method on users/${req.params.userID} resource`,
  );
});

app.delete("/users", (req, res) => {
  return res.send("Received a DELETE HTTP method on user resource");
});

app.listen(process.env.PORT, () =>
  console.log(`Listening on port ${process.env.PORT}`),
);

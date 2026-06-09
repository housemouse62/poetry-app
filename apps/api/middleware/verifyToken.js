import jwt from "jsonwebtoken";

function verifyToken(req, res, next) {
  // Get auth header value
  const bearerHeader = req.headers["authorization"];
  // Check if bearer is undefined
  if (typeof bearerHeader !== "undefined") {
    // Split at the space
    const bearer = bearerHeader.split(" ");
    // Get token from array
    const bearerToken = bearer[1];
    // Set the token
    req.token = bearerToken;
    //check for validity
    jwt.verify(req.token, process.env.JWT_SECRET, (err, authData) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = authData.tokenUser;
      next();
    });
  } else {
    return res.status(401).json({ error: "No token provided" });
  }
}

export default verifyToken;

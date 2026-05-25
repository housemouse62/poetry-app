function verifyAdmin(req, res, next) {
  if (req.user.usertype !== "admin")
    return res.status(401).json({ error: "Unauthorized user" });
  next();
}

export default verifyAdmin;

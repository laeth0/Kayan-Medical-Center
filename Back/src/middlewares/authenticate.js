
import jwt from "jsonwebtoken";

function authenticate(req, res, next) {
  const auth = req.headers.authorization || "";
  const isBearer = auth.startsWith("Bearer ");
  if (!isBearer) return res.status(401).json({ message: "Missing token" });

  const token = auth.slice(7).trim();
  try {

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: [process.env.JWT_ALGORITHM],
      issuer: process.env.JWT_ISS,
      audience: process.env.JWT_AUD,
      clockTolerance: 5,
    });

    req.user = decoded;

    return next();

  } catch (e) {
    if (e.name === "TokenExpiredError") return res.status(401).json({ message: "Token expired" });
    return res.status(401).json({ message: "Invalid token" });
  }
}

export default authenticate;

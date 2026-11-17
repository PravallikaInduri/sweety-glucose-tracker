
const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;

    // Check JWT configuration
    if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET is missing in environment variables.");

        return res.status(500).json({
            message: "Server authentication configuration error."
        });
    }

    // Check authorization header
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Authentication token required."
        });
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
        return res.status(401).json({
            message: "Authentication token required."
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded.id) {
            return res.status(401).json({
                message: "Invalid authentication token."
            });
        }

        req.user = decoded;
        next();

    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token."
        });
    }
}

module.exports = authenticateToken;


const express = require("express");
const cors = require("cors");
require("dotenv").config();

const redisClient = require("./redis");
const pool = require("./db");

const authRoutes = require("./routes/auth");
const readingRoutes = require("./routes/readings");
const reportRoutes = require("./routes/reports");

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "10kb" }));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/readings", readingRoutes);
app.use("/api/reports", reportRoutes);

// Backend and database health check
app.get("/", async (req, res) => {
    try {
        await pool.query("SELECT 1");

        res.status(200).json({
            success: true,
            message: "Sweety Glucose Tracker Backend is running!",
            database: "Connected successfully",
            redis: redisClient.isReady
                ? "Connected successfully"
                : "Not connected"
        });
    } catch (error) {
        console.error("Database connection error:", error.message);

        res.status(500).json({
            success: false,
            message: "Database connection failed"
        });
    }
});

// Handle unknown routes
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API route not found"
    });
});

// Centralized error handler
app.use((error, req, res, next) => {
    console.error("Server error:", error.message);

    if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
        return res.status(400).json({
            success: false,
            message: "Invalid JSON request body"
        });
    }

    res.status(500).json({
        success: false,
        message: "Internal server error"
    });
});

// Start server only when running this file directly
if (require.main === module) {
    const PORT = process.env.PORT || 5000;

    redisClient.connect()
        .then(() => {
            console.log("Redis connected successfully");

            app.listen(PORT, () => {
                console.log(`Server running at http://localhost:${PORT}`);
            });
        })
        .catch((error) => {
            console.error("Redis connection failed:", error.message);
        });
}

// Export app for testing
module.exports = app;

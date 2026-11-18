
const express = require("express");
const router = express.Router();

const pool = require("../db");
const redisClient = require("../redis");
const authenticateToken = require("../middleware/auth");

router.use(authenticateToken);

// Validate YYYY-MM-DD and actual calendar date
function isValidDate(date) {
    if (
        typeof date !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(date)
    ) {
        return false;
    }

    const parsed = new Date(`${date}T00:00:00.000Z`);

    return (
        !Number.isNaN(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === date
    );
}

// GET /api/reports?period=daily&date=2026-11-13
// GET /api/reports?period=month&date=2026-11-13
// GET /api/reports?period=monthly&date=2026-11-13

router.get("/", async (req, res) => {
    try {
        const userId = req.user.id;
        const requestedPeriod = req.query.period || "daily";
        const selectedDate = req.query.date || null;

        // Support both frontend and assignment period names
        let period;

        if (requestedPeriod === "daily") {
            period = "daily";
        } else if (
            requestedPeriod === "month" ||
            requestedPeriod === "month-to-date"
        ) {
            period = "month";
        } else if (
            requestedPeriod === "monthly" ||
            requestedPeriod === "previous-month"
        ) {
            period = "monthly";
        } else {
            return res.status(400).json({
                message: "Invalid report period."
            });
        }

        // Validate selected date when provided
        if (selectedDate && !isValidDate(selectedDate)) {
            return res.status(400).json({
                message: "Invalid date. Use YYYY-MM-DD format."
            });
        }

        // Create a unique cache key for each user and report request
        const cacheKey = `report:${userId}:${requestedPeriod}:${selectedDate || "today"}`;

        // Check Redis cache
        if (redisClient.isReady) {
            try {
                const cachedReport = await redisClient.get(cacheKey);

                if (cachedReport) {
                    console.log("Report cache hit");

                    return res.status(200).json(JSON.parse(cachedReport));
                }
            } catch (cacheError) {
                console.error("Redis cache read error:", cacheError.message);
            }
        }

        const dateRangeQuery = `
            WITH selected AS (
                SELECT COALESCE($2::date, CURRENT_DATE) AS selected_date
            ),
            date_range AS (
                SELECT
                    CASE
                        WHEN $3 = 'daily'
                            THEN selected_date

                        WHEN $3 = 'month'
                            THEN date_trunc('month', selected_date)::date

                        WHEN $3 = 'monthly'
                            THEN (
                                date_trunc('month', selected_date)
                                - INTERVAL '1 month'
                            )::date
                    END AS start_date,

                    CASE
                        WHEN $3 IN ('daily', 'month')
                            THEN selected_date + 1

                        WHEN $3 = 'monthly'
                            THEN date_trunc('month', selected_date)::date
                    END AS end_date

                FROM selected
            )
        `;

        // Fetch summary
        const summaryQuery = `
            ${dateRangeQuery}
            SELECT
                COUNT(r.id)::INTEGER AS count,
                MAX(r.glucose_value) AS highest,
                MIN(r.glucose_value) AS lowest,
                ROUND(
                    AVG(r.glucose_value)::numeric,
                    1
                )::FLOAT AS average
            FROM date_range d
            LEFT JOIN readings r
                ON r.user_id = $1
                AND r.reading_date >= d.start_date
                AND r.reading_date < d.end_date
        `;

        // Fetch individual readings
        const readingsQuery = `
            ${dateRangeQuery}
            SELECT
                r.id,
                r.reading_date::TEXT AS reading_date,
                r.slot,
                r.glucose_value,
                r.created_at,
                r.updated_at
            FROM readings r
            CROSS JOIN date_range d
            WHERE r.user_id = $1
              AND r.reading_date >= d.start_date
              AND r.reading_date < d.end_date
            ORDER BY r.reading_date DESC, r.id DESC
        `;

        const queryParams = [
            userId,
            selectedDate,
            period
        ];

        const [summaryResult, readingsResult] = await Promise.all([
            pool.query(summaryQuery, queryParams),
            pool.query(readingsQuery, queryParams)
        ]);

        const summary = summaryResult.rows[0];

        const reportData = {
            period: requestedPeriod,
            count: summary.count || 0,
            highest: summary.highest,
            lowest: summary.lowest,
            average: summary.average,
            readings: readingsResult.rows
        };

        // Save report in Redis for 60 seconds
        if (redisClient.isReady) {
            try {
                await redisClient.setEx(
                    cacheKey,
                    60,
                    JSON.stringify(reportData)
                );

                console.log("Report cached successfully");
            } catch (cacheError) {
                console.error("Redis cache write error:", cacheError.message);
            }
        }

        return res.status(200).json(reportData);

    } catch (error) {
        console.error("Report error:", error.message);

        return res.status(500).json({
            message: "Unable to generate report."
        });
    }
});

module.exports = router;

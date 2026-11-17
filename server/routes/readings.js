
const express = require("express");
const pool = require("../db");
const authenticateToken = require("../middleware/auth");

const router = express.Router();

const ALLOWED_SLOTS = [
    "Morning (fasting)",
    "After breakfast",
    "After lunch",
    "After dinner"
];

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

function validateReading(reading_date, slot, glucose_value) {
    if (!isValidDate(reading_date)) {
        return "Please provide a valid date in YYYY-MM-DD format.";
    }

    if (!ALLOWED_SLOTS.includes(slot)) {
        return "Please select a valid reading slot.";
    }

    if (
        glucose_value === undefined ||
        glucose_value === null ||
        glucose_value === ""
    ) {
        return "Please enter a glucose value.";
    }

    const valueString = String(glucose_value);

    if (!/^\d+$/.test(valueString)) {
        return "Value must be between 40 and 600 mg/dl.";
    }

    const value = Number(valueString);

    if (!Number.isInteger(value) || value < 40 || value > 600) {
        return "Value must be between 40 and 600 mg/dl.";
    }

    return null;
}

async function isFutureDate(readingDate) {
    const result = await pool.query(
        `SELECT $1::date > CURRENT_DATE AS is_future`,
        [readingDate]
    );

    return result.rows[0].is_future;
}

router.use(authenticateToken);


// ==========================================
// ADD READING
// ==========================================

router.post("/", async (req, res) => {
    try {
        const { reading_date, slot, glucose_value } = req.body;

        const validationError = validateReading(
            reading_date,
            slot,
            glucose_value
        );

        if (validationError) {
            return res.status(400).json({
                message: validationError
            });
        }

        if (await isFutureDate(reading_date)) {
            return res.status(400).json({
                message: "Date cannot be in the future."
            });
        }

        const duplicateResult = await pool.query(
            `SELECT id
             FROM readings
             WHERE user_id = $1
               AND reading_date = $2::date
               AND slot = $3`,
            [req.user.id, reading_date, slot]
        );

        if (duplicateResult.rows.length > 0) {
            return res.status(409).json({
                message: `You already have an ${slot} reading for this date.`
            });
        }

        const countResult = await pool.query(
            `SELECT COUNT(*)::INTEGER AS total
             FROM readings
             WHERE user_id = $1
               AND reading_date = $2::date`,
            [req.user.id, reading_date]
        );

        if (countResult.rows[0].total >= 4) {
            return res.status(400).json({
                message: "You can add only 4 readings per day."
            });
        }

        const result = await pool.query(
            `INSERT INTO readings
                (user_id, reading_date, slot, glucose_value)
             VALUES ($1, $2::date, $3, $4)
             RETURNING
                id,
                user_id,
                reading_date::TEXT AS reading_date,
                slot,
                glucose_value,
                created_at,
                updated_at`,
            [
                req.user.id,
                reading_date,
                slot,
                Number(glucose_value)
            ]
        );

        return res.status(201).json({
            message: "Glucose reading added successfully.",
            reading: result.rows[0]
        });

    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                message: `You already have an ${req.body.slot} reading for this date.`
            });
        }

        console.error("Add reading error:", error.message);

        return res.status(500).json({
            message: "Unable to add reading."
        });
    }
});


// ==========================================
// GET READINGS WITH PAGINATION
// ==========================================

router.get("/", async (req, res) => {
    try {
        const { date } = req.query;

        const page =
            req.query.page === undefined ? 1 : Number(req.query.page);

        const limit =
            req.query.limit === undefined ? 20 : Number(req.query.limit);

        if (
            !Number.isInteger(page) ||
            page < 1 ||
            !Number.isInteger(limit) ||
            limit < 1 ||
            limit > 100
        ) {
            return res.status(400).json({
                message: "Page must be positive and limit must be between 1 and 100."
            });
        }

        if (date && !isValidDate(date)) {
            return res.status(400).json({
                message: "Please provide a valid date."
            });
        }

        const offset = (page - 1) * limit;

        let countQuery = `
            SELECT COUNT(*)::INTEGER AS total
            FROM readings
            WHERE user_id = $1
        `;

        let readingsQuery = `
            SELECT
                id,
                reading_date::TEXT AS reading_date,
                slot,
                glucose_value,
                created_at,
                updated_at
            FROM readings
            WHERE user_id = $1
        `;

        const values = [req.user.id];

        if (date) {
            countQuery += " AND reading_date = $2::date";
            readingsQuery += " AND reading_date = $2::date";
            values.push(date);
        }

        const countResult = await pool.query(countQuery, values);
        const total = countResult.rows[0].total;

        const result = await pool.query(
            readingsQuery +
            ` ORDER BY reading_date DESC, id DESC
              LIMIT $${values.length + 1}
              OFFSET $${values.length + 2}`,
            [...values, limit, offset]
        );

        return res.status(200).json({
            count: result.rows.length,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            readings: result.rows
        });

    } catch (error) {
        console.error("Get readings error:", error.message);

        return res.status(500).json({
            message: "Unable to fetch readings."
        });
    }
});


// ==========================================
// UPDATE READING
// ==========================================

router.put("/:id", async (req, res) => {
    try {
        const readingId = Number(req.params.id);

        if (!Number.isInteger(readingId) || readingId <= 0) {
            return res.status(400).json({
                message: "Invalid reading ID."
            });
        }

        const { reading_date, slot, glucose_value } = req.body;

        const validationError = validateReading(
            reading_date,
            slot,
            glucose_value
        );

        if (validationError) {
            return res.status(400).json({
                message: validationError
            });
        }

        if (await isFutureDate(reading_date)) {
            return res.status(400).json({
                message: "Date cannot be in the future."
            });
        }

        const existingResult = await pool.query(
            `SELECT id, reading_date::TEXT AS reading_date, slot
             FROM readings
             WHERE id = $1 AND user_id = $2`,
            [readingId, req.user.id]
        );

        if (existingResult.rows.length === 0) {
            return res.status(404).json({
                message: "Reading not found."
            });
        }

        const duplicateResult = await pool.query(
            `SELECT id
             FROM readings
             WHERE user_id = $1
               AND reading_date = $2::date
               AND slot = $3
               AND id <> $4`,
            [req.user.id, reading_date, slot, readingId]
        );

        if (duplicateResult.rows.length > 0) {
            return res.status(409).json({
                message: `You already have an ${slot} reading for this date.`
            });
        }

        const currentReading = existingResult.rows[0];

        if (currentReading.reading_date !== reading_date) {
            const countResult = await pool.query(
                `SELECT COUNT(*)::INTEGER AS total
                 FROM readings
                 WHERE user_id = $1
                   AND reading_date = $2::date`,
                [req.user.id, reading_date]
            );

            if (countResult.rows[0].total >= 4) {
                return res.status(400).json({
                    message: "You can have only 4 readings per day."
                });
            }
        }

        const result = await pool.query(
            `UPDATE readings
             SET
                reading_date = $1::date,
                slot = $2,
                glucose_value = $3,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = $4
               AND user_id = $5
             RETURNING
                id,
                user_id,
                reading_date::TEXT AS reading_date,
                slot,
                glucose_value,
                created_at,
                updated_at`,
            [
                reading_date,
                slot,
                Number(glucose_value),
                readingId,
                req.user.id
            ]
        );

        return res.status(200).json({
            message: "Reading updated successfully.",
            reading: result.rows[0]
        });

    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                message: `You already have an ${req.body.slot} reading for this date.`
            });
        }

        console.error("Update reading error:", error.message);

        return res.status(500).json({
            message: "Unable to update reading."
        });
    }
});


// ==========================================
// DELETE READING
// ==========================================

router.delete("/:id", async (req, res) => {
    try {
        const readingId = Number(req.params.id);

        if (!Number.isInteger(readingId) || readingId <= 0) {
            return res.status(400).json({
                message: "Invalid reading ID."
            });
        }

        const result = await pool.query(
            `DELETE FROM readings
             WHERE id = $1 AND user_id = $2
             RETURNING id`,
            [readingId, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Reading not found."
            });
        }

        return res.status(200).json({
            message: "Reading deleted successfully."
        });

    } catch (error) {
        console.error("Delete reading error:", error.message);

        return res.status(500).json({
            message: "Unable to delete reading."
        });
    }
});

module.exports = router;

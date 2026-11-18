
jest.mock("../db", () => ({
    query: jest.fn(),
    end: jest.fn()
}));

process.env.JWT_SECRET = "test-secret-key";

const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../server");
const pool = require("../db");

const token = jwt.sign(
    { id: 1 },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
);

const sampleReading = {
    id: 1,
    user_id: 1,
    reading_date: "2026-11-18",
    slot: "Morning (fasting)",
    glucose_value: 110
};

describe("Readings API", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("Should reject requests without authentication", async () => {
        const response = await request(app)
            .get("/api/readings");

        expect(response.status).toBe(401);
        expect(response.body.message).toBe(
            "Authentication token required."
        );
    });

    test("Should reject invalid reading dates", async () => {
        const response = await request(app)
            .post("/api/readings")
            .set("Authorization", `Bearer ${token}`)
            .send({
                reading_date: "2026-02-30",
                slot: "Morning (fasting)",
                glucose_value: 110
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe(
            "Please provide a valid date in YYYY-MM-DD format."
        );
        expect(pool.query).not.toHaveBeenCalled();
    });

    test("Should reject glucose values below 40", async () => {
        const response = await request(app)
            .post("/api/readings")
            .set("Authorization", `Bearer ${token}`)
            .send({
                reading_date: "2026-11-18",
                slot: "Morning (fasting)",
                glucose_value: 20
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe(
            "Value must be between 40 and 600 mg/dl."
        );
    });

    test("Should add a reading successfully", async () => {
        pool.query
            .mockResolvedValueOnce({
                rows: [{ is_future: false }]
            })
            .mockResolvedValueOnce({
                rows: []
            })
            .mockResolvedValueOnce({
                rows: [{ total: 0 }]
            })
            .mockResolvedValueOnce({
                rows: [sampleReading]
            });

        const response = await request(app)
            .post("/api/readings")
            .set("Authorization", `Bearer ${token}`)
            .send({
                reading_date: "2026-11-18",
                slot: "Morning (fasting)",
                glucose_value: 110
            });

        expect(response.status).toBe(201);
        expect(response.body.message).toBe(
            "Glucose reading added successfully."
        );
        expect(response.body.reading.glucose_value).toBe(110);
        expect(pool.query).toHaveBeenCalledTimes(4);
    });

    test("Should fetch readings with pagination", async () => {
        pool.query
            .mockResolvedValueOnce({
                rows: [{ total: 1 }]
            })
            .mockResolvedValueOnce({
                rows: [sampleReading]
            });

        const response = await request(app)
            .get("/api/readings?page=1&limit=20")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.total).toBe(1);
        expect(response.body.readings).toHaveLength(1);
        expect(response.body.readings[0].glucose_value).toBe(110);
    });

    test("Should reject invalid pagination values", async () => {
        const response = await request(app)
            .get("/api/readings?page=0&limit=20")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe(
            "Page must be positive and limit must be between 1 and 100."
        );
    });

    test("Should reject an invalid reading ID during update", async () => {
        const response = await request(app)
            .put("/api/readings/abc")
            .set("Authorization", `Bearer ${token}`)
            .send({
                reading_date: "2026-11-18",
                slot: "Morning (fasting)",
                glucose_value: 110
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Invalid reading ID.");
        expect(pool.query).not.toHaveBeenCalled();
    });

    test("Should delete a reading successfully", async () => {
        pool.query.mockResolvedValueOnce({
            rows: [{ id: 1 }]
        });

        const response = await request(app)
            .delete("/api/readings/1")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe(
            "Reading deleted successfully."
        );
    });
});

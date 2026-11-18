
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

describe("Reports API", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("Should reject requests without authentication", async () => {
        const response = await request(app)
            .get("/api/reports");

        expect(response.status).toBe(401);
        expect(response.body.message).toBe(
            "Authentication token required."
        );
    });

    test("Should reject an invalid report period", async () => {
        const response = await request(app)
            .get("/api/reports?period=weekly")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe(
            "Invalid report period."
        );
        expect(pool.query).not.toHaveBeenCalled();
    });

    test("Should reject an invalid date", async () => {
        const response = await request(app)
            .get("/api/reports?period=daily&date=2026-02-30")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe(
            "Invalid date. Use YYYY-MM-DD format."
        );
        expect(pool.query).not.toHaveBeenCalled();
    });

    test("Should generate a daily report successfully", async () => {
        pool.query
            .mockResolvedValueOnce({
                rows: [{
                    count: 2,
                    highest: 150,
                    lowest: 100,
                    average: 125
                }]
            })
            .mockResolvedValueOnce({
                rows: [
                    {
                        id: 1,
                        reading_date: "2026-11-18",
                        slot: "Morning (fasting)",
                        glucose_value: 100
                    },
                    {
                        id: 2,
                        reading_date: "2026-11-18",
                        slot: "After breakfast",
                        glucose_value: 150
                    }
                ]
            });

        const response = await request(app)
            .get("/api/reports?period=daily&date=2026-11-18")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.period).toBe("daily");
        expect(response.body.count).toBe(2);
        expect(response.body.highest).toBe(150);
        expect(response.body.lowest).toBe(100);
        expect(response.body.average).toBe(125);
        expect(response.body.readings).toHaveLength(2);
        expect(pool.query).toHaveBeenCalledTimes(2);
    });

    test("Should generate a month-to-date report", async () => {
        pool.query
            .mockResolvedValueOnce({
                rows: [{
                    count: 3,
                    highest: 180,
                    lowest: 90,
                    average: 130
                }]
            })
            .mockResolvedValueOnce({
                rows: [
                    { id: 1, glucose_value: 90 },
                    { id: 2, glucose_value: 120 },
                    { id: 3, glucose_value: 180 }
                ]
            });

        const response = await request(app)
            .get("/api/reports?period=month&date=2026-11-18")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.period).toBe("month");
        expect(response.body.count).toBe(3);
        expect(response.body.average).toBe(130);
        expect(response.body.readings).toHaveLength(3);
    });

    test("Should support the month-to-date period alias", async () => {
        pool.query
            .mockResolvedValueOnce({
                rows: [{
                    count: 0,
                    highest: null,
                    lowest: null,
                    average: null
                }]
            })
            .mockResolvedValueOnce({
                rows: []
            });

        const response = await request(app)
            .get("/api/reports?period=month-to-date&date=2026-11-18")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.period).toBe("month-to-date");
        expect(response.body.count).toBe(0);
        expect(response.body.readings).toHaveLength(0);
    });

    test("Should generate a previous-month report", async () => {
        pool.query
            .mockResolvedValueOnce({
                rows: [{
                    count: 4,
                    highest: 200,
                    lowest: 80,
                    average: 140
                }]
            })
            .mockResolvedValueOnce({
                rows: [
                    { id: 1, glucose_value: 80 },
                    { id: 2, glucose_value: 120 },
                    { id: 3, glucose_value: 160 },
                    { id: 4, glucose_value: 200 }
                ]
            });

        const response = await request(app)
            .get("/api/reports?period=monthly&date=2026-11-18")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.period).toBe("monthly");
        expect(response.body.count).toBe(4);
        expect(response.body.highest).toBe(200);
        expect(response.body.lowest).toBe(80);
        expect(response.body.readings).toHaveLength(4);
    });

    test("Should support the previous-month period alias", async () => {
        pool.query
            .mockResolvedValueOnce({
                rows: [{
                    count: 0,
                    highest: null,
                    lowest: null,
                    average: null
                }]
            })
            .mockResolvedValueOnce({
                rows: []
            });

        const response = await request(app)
            .get("/api/reports?period=previous-month&date=2026-11-18")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.period).toBe("previous-month");
        expect(response.body.count).toBe(0);
        expect(response.body.readings).toHaveLength(0);
    });
});

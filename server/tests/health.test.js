
const request = require("supertest");
const app = require("../server");
const pool = require("../db");

describe("Backend API", () => {
    afterAll(async () => {
        await pool.end();
    });

    test("GET / should return a successful health response", async () => {
        const response = await request(app).get("/");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.database).toBe("Connected successfully");
    });

    test("Unknown routes should return 404", async () => {
        const response = await request(app).get("/invalid-route");

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe("API route not found");
    });
});


jest.mock("../db", () => ({
    query: jest.fn(),
    end: jest.fn()
}));

const request = require("supertest");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = require("../server");
const pool = require("../db");

describe("Authentication API", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = "test-secret-key";
    });

    test("Register should reject missing fields", async () => {
        const response = await request(app)
            .post("/api/auth/register")
            .send({
                name: "",
                email: "",
                password: ""
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe(
            "Name, email and password are required."
        );
        expect(pool.query).not.toHaveBeenCalled();
    });

    test("Register should reject invalid email", async () => {
        const response = await request(app)
            .post("/api/auth/register")
            .send({
                name: "Test User",
                email: "invalid-email",
                password: "password123"
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe(
            "Enter a valid email address."
        );
        expect(pool.query).not.toHaveBeenCalled();
    });

    test("Register should reject short passwords", async () => {
        const response = await request(app)
            .post("/api/auth/register")
            .send({
                name: "Test User",
                email: "test@example.com",
                password: "123"
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe(
            "Password must contain at least 6 characters."
        );
    });

    test("Register should create a user successfully", async () => {
        pool.query.mockResolvedValueOnce({
            rows: [
                {
                    id: 1,
                    name: "Test User",
                    email: "test@example.com"
                }
            ]
        });

        const response = await request(app)
            .post("/api/auth/register")
            .send({
                name: " Test User ",
                email: "TEST@example.com",
                password: "password123"
            });

        expect(response.status).toBe(201);
        expect(response.body.message).toBe("Registration successful.");
        expect(response.body.user.email).toBe("test@example.com");

        const savedPassword = pool.query.mock.calls[0][1][2];

        expect(savedPassword).not.toBe("password123");
        expect(await bcrypt.compare("password123", savedPassword)).toBe(true);
    });

    test("Register should reject an already registered email", async () => {
        const duplicateError = new Error("Duplicate email");
        duplicateError.code = "23505";

        pool.query.mockRejectedValueOnce(duplicateError);

        const response = await request(app)
            .post("/api/auth/register")
            .send({
                name: "Test User",
                email: "test@example.com",
                password: "password123"
            });

        expect(response.status).toBe(409);
        expect(response.body.message).toBe(
            "Email already registered."
        );
    });

    test("Login should reject missing fields", async () => {
        const response = await request(app)
            .post("/api/auth/login")
            .send({
                email: "",
                password: ""
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe(
            "Email and password are required."
        );
    });

    test("Login should reject an unregistered email", async () => {
        pool.query.mockResolvedValueOnce({
            rows: []
        });

        const response = await request(app)
            .post("/api/auth/login")
            .send({
                email: "unknown@example.com",
                password: "password123"
            });

        expect(response.status).toBe(401);
        expect(response.body.message).toBe(
            "Invalid email or password."
        );
    });

    test("Login should return a JWT for valid credentials", async () => {
        const hashedPassword = await bcrypt.hash("password123", 10);

        pool.query.mockResolvedValueOnce({
            rows: [
                {
                    id: 1,
                    name: "Test User",
                    email: "test@example.com",
                    password_hash: hashedPassword
                }
            ]
        });

        const response = await request(app)
            .post("/api/auth/login")
            .send({
                email: "TEST@example.com",
                password: "password123"
            });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe("Login successful.");
        expect(response.body.token).toBeDefined();
        expect(response.body.user.email).toBe("test@example.com");

        const decodedToken = jwt.verify(
            response.body.token,
            process.env.JWT_SECRET
        );

        expect(decodedToken.id).toBe(1);
    });
});

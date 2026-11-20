# Sweety – Blood Glucose Tracker

A full-stack application for recording and managing blood glucose readings and viewing daily and monthly reports.

## Installation

Clone the repository:

```bash
git clone https://github.com/PravallikaInduri/sweety-glucose-tracker.git
cd sweety-glucose-tracker
```

Install backend dependencies:

```bash
cd server
npm install
```

Install frontend dependencies:

```bash
cd ../client
npm install
```

## Database Setup

1. Create a PostgreSQL database named `sweety_glucose_tracker`.
2. Execute `server/schema.sql` to create the required tables and index.

From the project root, run:

```bash
psql -U postgres -h localhost -p 5434 -d sweety_glucose_tracker -f server/schema.sql
```

Update the port and database credentials according to your PostgreSQL configuration.

## Environment Configuration

Create a `.env` file inside the `server` directory using `server/.env.example` as a reference.

Configure the required database credentials and JWT secret.

## Run the Application

### Start Redis

Make sure Docker Desktop is running.

```bash
docker run --name sweety-redis -p 6379:6379 -d redis
```

If the container already exists:

```bash
docker start sweety-redis
```

### Start the Backend

From the `server` directory:

```bash
npm run dev
```

Backend URL: `http://localhost:5000`

### Start the Frontend

Open another terminal:

```bash
cd client
npm run dev
```

Open the frontend URL displayed in the terminal, usually `http://localhost:5173`.

### Seed Demo Data

From the `server` directory:

```bash
npm run seed
```

**Demo Credentials**

- Email: `demo@sweety.com`
- Password: `Demo@123`

## Run Tests

### Backend Tests

From the `server` directory:

```bash
npm test
```

- 4 test suites passed
- 26 tests passed

### Frontend Tests

From the `client` directory:

```bash
npm run test:run
```

- 1 test file passed
- 6 tests passed

**Total: 32 tests passed.**

## Notes

### Assumptions

- Each user can access and manage only their own glucose readings.
- A maximum of one reading is allowed per slot per day for each user.
- Glucose values must be whole numbers between 40 and 600.
- Future-dated readings are not allowed.

### Improvements with More Time

- Implement the optional Doctor role with doctor-patient assignments.
- Add more integration and end-to-end tests.
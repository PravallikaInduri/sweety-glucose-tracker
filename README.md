# Sweety – Blood Glucose Tracker

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

Create a PostgreSQL database:

```sql
CREATE DATABASE sweety_glucose_tracker;
```

Connect to the `sweety_glucose_tracker` database and execute the following SQL:

```sql
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS readings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reading_date DATE NOT NULL,
    slot VARCHAR(30) NOT NULL CHECK (
        slot IN (
            'Morning (fasting)',
            'After breakfast',
            'After lunch',
            'After dinner'
        )
    ),
    glucose_value INTEGER NOT NULL CHECK (
        glucose_value BETWEEN 40 AND 600
    ),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, reading_date, slot)
);

CREATE INDEX IF NOT EXISTS idx_readings_user_date
ON readings(user_id, reading_date);
```

Create a `.env` file inside the `server` directory using `server/.env.example` as a reference.

Configure your PostgreSQL credentials and JWT secret:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5434
DB_NAME=sweety_glucose_tracker
DB_USER=postgres
DB_PASSWORD=your_postgres_password
JWT_SECRET=your_long_random_secret
```

Update the database port and credentials according to your PostgreSQL configuration.

## Run the Backend Server

From the `server` directory:

```bash
npm run dev
```

Backend URL: `http://localhost:5000`

## Run the Frontend Client

From the `client` directory:

```bash
npm run dev
```

Open the local URL displayed by Vite, usually `http://localhost:5173`.

## Seed Demo Data

From the `server` directory:

```bash
npm run seed
```

Demo login credentials:

- Email: `demo@sweety.com`
- Password: `Demo@123`

## Run Tests

From the `client` directory:

```bash
npm run test:run
```

## Notes

### Assumptions

- Each user can access only their own glucose readings.
- A maximum of four readings can be recorded per day.
- Each reading slot can have only one entry per day.
- The monthly report displays the previous calendar month.

### Improvements With More Time

- Add Docker support for easier setup and deployment.
- Increase backend and frontend test coverage.
- Implement Redis caching for reports.
- Add background reminders using BullMQ.
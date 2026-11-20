
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

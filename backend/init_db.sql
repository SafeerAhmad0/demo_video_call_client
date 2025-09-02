-- VerifyCall Database Initialization Script
-- This script creates the necessary tables and initial data for the application

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS claims (
    id SERIAL PRIMARY KEY,
    claim_number VARCHAR(100) UNIQUE NOT NULL,
    patient_mobile VARCHAR(20),
    hospital_city VARCHAR(100),
    hospital_state VARCHAR(10),
    language VARCHAR(50),
    s3_urls TEXT,
    status VARCHAR(20) DEFAULT 'open',
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS form_submissions (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(255),
    notes TEXT,
    latitude FLOAT,
    longitude FLOAT,
    geo_accuracy_m FLOAT,
    captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    claim_id INTEGER REFERENCES claims(id)
);

CREATE TABLE IF NOT EXISTS meetings (
    id SERIAL PRIMARY KEY,
    room_name VARCHAR(120) UNIQUE NOT NULL,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    claim_id INTEGER REFERENCES claims(id),
    patient_name VARCHAR(120),
    procedure VARCHAR(200),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recordings (
    id SERIAL PRIMARY KEY,
    meeting_id INTEGER REFERENCES meetings(id),
    s3_key VARCHAR(512) NOT NULL,
    s3_url VARCHAR(1024),
    mime_type VARCHAR(120) NOT NULL,
    duration_sec INTEGER,
    latitude FLOAT,
    longitude FLOAT,
    geo_accuracy_m FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS geolocations (
    id SERIAL PRIMARY KEY,
    claim_id INTEGER REFERENCES claims(id) NOT NULL,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    accuracy FLOAT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source VARCHAR(50) DEFAULT 'manual',
    geo_metadata TEXT
);

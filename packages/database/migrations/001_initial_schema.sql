-- maapaap Database Schema
-- Version: 0.1.0
-- Description: Initial schema for users, profiles, measurement sets, and measurement entries

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============= Users Table =============
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255),
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);

-- ============= Profiles Table =============
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    nickname VARCHAR(100),
    age INTEGER CHECK (age > 0 AND age < 150),
    height DECIMAL(5, 2) CHECK (height > 0),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_profiles_user_id ON profiles(user_id);

-- ============= Measurement Sets Table =============
CREATE TABLE measurement_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    garment_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    unit_default VARCHAR(2) NOT NULL CHECK (unit_default IN ('IN', 'CM')),
    fit_preference VARCHAR(20) NOT NULL CHECK (fit_preference IN ('TIGHT', 'REGULAR', 'LOOSE')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT fk_measurement_sets_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_measurement_sets_profile FOREIGN KEY (profile_id) REFERENCES profiles(id)
);

CREATE INDEX idx_measurement_sets_user_id ON measurement_sets(user_id);
CREATE INDEX idx_measurement_sets_profile_id ON measurement_sets(profile_id);
CREATE INDEX idx_measurement_sets_garment_type ON measurement_sets(garment_type);

-- ============= Measurement Entries Table =============
CREATE TABLE measurement_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    measurement_set_id UUID NOT NULL REFERENCES measurement_sets(id) ON DELETE CASCADE,
    key VARCHAR(100) NOT NULL,
    label_gu VARCHAR(255) NOT NULL,
    label_en VARCHAR(255) NOT NULL,
    value DECIMAL(6, 2) NOT NULL CHECK (value >= 0),
    unit VARCHAR(2) NOT NULL CHECK (unit IN ('IN', 'CM')),
    measure_type VARCHAR(20) NOT NULL CHECK (measure_type IN ('ROUND', 'FLAT', 'LENGTH', 'WIDTH')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT fk_measurement_entries_set FOREIGN KEY (measurement_set_id) REFERENCES measurement_sets(id)
);

CREATE INDEX idx_measurement_entries_set_id ON measurement_entries(measurement_set_id);
CREATE INDEX idx_measurement_entries_key ON measurement_entries(key);

-- ============= OTP Table (for email/phone verification) =============
CREATE TABLE otps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identifier VARCHAR(255) NOT NULL, -- email or phone
    otp_code VARCHAR(10) NOT NULL,
    purpose VARCHAR(50) NOT NULL, -- 'login', 'verify_email', 'verify_phone'
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_otps_identifier ON otps(identifier);
CREATE INDEX idx_otps_expires_at ON otps(expires_at);

-- ============= Sessions Table (for JWT token management) =============
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- ============= Triggers for updated_at =============
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_measurement_sets_updated_at BEFORE UPDATE ON measurement_sets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_measurement_entries_updated_at BEFORE UPDATE ON measurement_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============= Views for Common Queries =============

-- View for profile with measurement set count
CREATE VIEW profile_summary AS
SELECT
    p.id,
    p.user_id,
    p.name,
    p.nickname,
    p.age,
    p.height,
    p.notes,
    p.created_at,
    p.updated_at,
    COUNT(ms.id) as measurement_set_count
FROM profiles p
LEFT JOIN measurement_sets ms ON p.id = ms.profile_id
GROUP BY p.id;

-- View for measurement set with entry count
CREATE VIEW measurement_set_summary AS
SELECT
    ms.id,
    ms.user_id,
    ms.profile_id,
    ms.garment_type,
    ms.title,
    ms.unit_default,
    ms.fit_preference,
    ms.notes,
    ms.created_at,
    ms.updated_at,
    p.name as profile_name,
    COUNT(me.id) as entry_count
FROM measurement_sets ms
LEFT JOIN profiles p ON ms.profile_id = p.id
LEFT JOIN measurement_entries me ON ms.id = me.measurement_set_id
GROUP BY ms.id, p.name;

-- ============= Comments =============
COMMENT ON TABLE users IS 'User accounts with authentication info';
COMMENT ON TABLE profiles IS 'Family member profiles for storing measurements';
COMMENT ON TABLE measurement_sets IS 'Collections of measurements for specific garments';
COMMENT ON TABLE measurement_entries IS 'Individual measurement values';
COMMENT ON TABLE otps IS 'One-time passwords for authentication';
COMMENT ON TABLE sessions IS 'Active user sessions';

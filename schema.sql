-- Tourist Safety Platform Database Schema
-- PostgreSQL with PostGIS for spatial data support
-- This schema creates a comprehensive database for real tourist safety data persistence

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'tourist' CHECK (role IN ('tourist', 'admin', 'emergency_responder')),
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    current_location GEOMETRY(POINT, 4326),
    location_updated_at TIMESTAMP,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(50),
    preferred_language VARCHAR(5) DEFAULT 'en',
    notification_preferences JSONB DEFAULT '{"sms": true, "email": true, "push": true}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP
);

-- User locations history
CREATE TABLE IF NOT EXISTS user_locations (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    coordinates GEOMETRY(POINT, 4326) NOT NULL,
    accuracy FLOAT,
    altitude FLOAT,
    speed FLOAT,
    heading FLOAT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('weather', 'crime', 'traffic', 'health', 'emergency', 'civil_unrest', 'natural_disaster', 'terrorist_threat', 'area_closure')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'RESOLVED', 'EXPIRED')),
    location GEOMETRY(POINT, 4326),
    radius_meters INTEGER DEFAULT 1000,
    affected_area GEOMETRY(POLYGON, 4326),
    created_by VARCHAR(255) REFERENCES users(id),
    source VARCHAR(100), -- 'user_report', 'official', 'api', 'sensor'
    verification_status VARCHAR(20) DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'verified', 'false_positive')),
    expires_at TIMESTAMP,
    metadata JSONB, -- Additional data like weather info, traffic details, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- IoT devices table
CREATE TABLE IF NOT EXISTS iot_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(255) UNIQUE NOT NULL,
    device_type VARCHAR(50) NOT NULL CHECK (device_type IN ('panic_button', 'gps_tracker', 'air_quality_sensor', 'noise_sensor', 'camera', 'weather_station')),
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
    location GEOMETRY(POINT, 4326),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'lost')),
    battery_level INTEGER CHECK (battery_level >= 0 AND battery_level <= 100),
    last_heartbeat TIMESTAMP,
    firmware_version VARCHAR(20),
    configuration JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Device data/readings
CREATE TABLE IF NOT EXISTS device_readings (
    id SERIAL PRIMARY KEY,
    device_id UUID NOT NULL REFERENCES iot_devices(id) ON DELETE CASCADE,
    reading_type VARCHAR(50) NOT NULL, -- 'location', 'panic', 'air_quality', 'noise_level', etc.
    value JSONB NOT NULL,
    location GEOMETRY(POINT, 4326),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed BOOLEAN DEFAULT FALSE
);

-- Safe zones
CREATE TABLE IF NOT EXISTS safe_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    coordinates GEOMETRY(POINT, 4326) NOT NULL,
    area GEOMETRY(POLYGON, 4326),
    zone_type VARCHAR(50) NOT NULL CHECK (zone_type IN ('police', 'hospital', 'embassy', 'hotel', 'tourist_attraction', 'commercial', 'residential', 'transport_hub')),
    safety_score DECIMAL(3,1) CHECK (safety_score >= 0 AND safety_score <= 10),
    amenities TEXT[], -- Array of available amenities
    contact_info JSONB,
    operating_hours JSONB,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Emergency contacts by country/region
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id SERIAL PRIMARY KEY,
    country_code VARCHAR(3) NOT NULL,
    region VARCHAR(100),
    service_type VARCHAR(50) NOT NULL CHECK (service_type IN ('police', 'ambulance', 'fire', 'coast_guard', 'tourist_helpline', 'embassy', 'consulate')),
    number VARCHAR(20) NOT NULL,
    description TEXT,
    language VARCHAR(5) DEFAULT 'en',
    available_24_7 BOOLEAN DEFAULT TRUE,
    coordinates GEOMETRY(POINT, 4326),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(country_code, service_type, region)
);

-- Emergency incidents
CREATE TABLE IF NOT EXISTS emergency_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    incident_type VARCHAR(50) NOT NULL CHECK (incident_type IN ('panic_button', 'medical', 'crime', 'accident', 'lost', 'natural_disaster', 'other')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'responding', 'resolved', 'false_alarm')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    location GEOMETRY(POINT, 4326) NOT NULL,
    description TEXT,
    responder_id VARCHAR(255) REFERENCES users(id),
    response_time_minutes INTEGER,
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- User safety scores history
CREATE TABLE IF NOT EXISTS safety_scores (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    location GEOMETRY(POINT, 4326) NOT NULL,
    overall_score DECIMAL(3,1) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 10),
    crime_score DECIMAL(3,1),
    police_presence_score DECIMAL(3,1),
    lighting_score DECIMAL(3,1),
    crowd_density_score DECIMAL(3,1),
    time_of_day_score DECIMAL(3,1),
    weather_score DECIMAL(3,1),
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Travel itinerary
CREATE TABLE IF NOT EXISTS travel_itinerary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    destination_name VARCHAR(255) NOT NULL,
    destination_location GEOMETRY(POINT, 4326),
    planned_arrival TIMESTAMP,
    planned_departure TIMESTAMP,
    actual_arrival TIMESTAMP,
    actual_departure TIMESTAMP,
    status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
    safety_briefing_sent BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Location reviews/ratings
CREATE TABLE IF NOT EXISTS location_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    location GEOMETRY(POINT, 4326) NOT NULL,
    location_name VARCHAR(255),
    safety_rating INTEGER CHECK (safety_rating >= 1 AND safety_rating <= 5),
    overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
    review_text TEXT,
    tags TEXT[], -- Array of tags like 'safe', 'well-lit', 'crowded', etc.
    helpful_votes INTEGER DEFAULT 0,
    verified_visit BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications/messages
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('safety_alert', 'weather_warning', 'emergency', 'system', 'marketing')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    expires_at TIMESTAMP,
    sent_via JSONB, -- Which channels it was sent through
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System configuration
CREATE TABLE IF NOT EXISTS system_config (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_location ON users USING GIST(current_location);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_user_locations_user_id ON user_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_locations_coordinates ON user_locations USING GIST(coordinates);
CREATE INDEX IF NOT EXISTS idx_user_locations_recorded_at ON user_locations(recorded_at);

CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_alerts_location ON alerts USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_alerts_type_severity ON alerts(alert_type, severity);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);

CREATE INDEX IF NOT EXISTS idx_iot_devices_user_id ON iot_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_iot_devices_location ON iot_devices USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_iot_devices_status ON iot_devices(status);

CREATE INDEX IF NOT EXISTS idx_device_readings_device_id ON device_readings(device_id);
CREATE INDEX IF NOT EXISTS idx_device_readings_timestamp ON device_readings(timestamp);
CREATE INDEX IF NOT EXISTS idx_device_readings_location ON device_readings USING GIST(location);

CREATE INDEX IF NOT EXISTS idx_safe_zones_location ON safe_zones USING GIST(coordinates);
CREATE INDEX IF NOT EXISTS idx_safe_zones_area ON safe_zones USING GIST(area);
CREATE INDEX IF NOT EXISTS idx_safe_zones_type ON safe_zones(zone_type);

CREATE INDEX IF NOT EXISTS idx_emergency_contacts_country ON emergency_contacts(country_code);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_service ON emergency_contacts(service_type);

CREATE INDEX IF NOT EXISTS idx_emergency_incidents_user_id ON emergency_incidents(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_incidents_status ON emergency_incidents(status);
CREATE INDEX IF NOT EXISTS idx_emergency_incidents_location ON emergency_incidents USING GIST(location);

CREATE INDEX IF NOT EXISTS idx_safety_scores_user_id ON safety_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_safety_scores_location ON safety_scores USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_safety_scores_calculated_at ON safety_scores(calculated_at);

CREATE INDEX IF NOT EXISTS idx_travel_itinerary_user_id ON travel_itinerary(user_id);
CREATE INDEX IF NOT EXISTS idx_travel_itinerary_status ON travel_itinerary(status);

CREATE INDEX IF NOT EXISTS idx_location_reviews_location ON location_reviews USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_location_reviews_user_id ON location_reviews(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Functions for spatial queries and safety calculations

-- Function to calculate distance between two points
CREATE OR REPLACE FUNCTION calculate_distance(point1 GEOMETRY, point2 GEOMETRY)
RETURNS FLOAT AS $$
BEGIN
    RETURN ST_Distance(point1::geography, point2::geography);
END;
$$ LANGUAGE plpgsql;

-- Function to find nearby alerts
CREATE OR REPLACE FUNCTION get_nearby_alerts(user_location GEOMETRY, radius_meters INTEGER DEFAULT 5000)
RETURNS TABLE(
    alert_id UUID,
    title VARCHAR,
    description TEXT,
    alert_type VARCHAR,
    severity VARCHAR,
    distance_meters FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.title,
        a.description,
        a.alert_type,
        a.severity,
        ST_Distance(a.location::geography, user_location::geography) as distance_meters
    FROM alerts a
    WHERE a.status = 'ACTIVE'
        AND ST_DWithin(a.location::geography, user_location::geography, radius_meters)
        AND (a.expires_at IS NULL OR a.expires_at > CURRENT_TIMESTAMP)
    ORDER BY distance_meters;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate area safety score
CREATE OR REPLACE FUNCTION calculate_area_safety_score(
    check_location GEOMETRY,
    radius_meters INTEGER DEFAULT 2000
)
RETURNS DECIMAL(3,1) AS $$
DECLARE
    crime_incidents INTEGER;
    police_presence INTEGER;
    safe_zones_count INTEGER;
    base_score DECIMAL(3,1) := 8.0;
    final_score DECIMAL(3,1);
BEGIN
    -- Count crime-related alerts in the area (last 30 days)
    SELECT COUNT(*) INTO crime_incidents
    FROM alerts
    WHERE alert_type IN ('crime', 'civil_unrest', 'terrorist_threat')
        AND status = 'ACTIVE'
        AND created_at > CURRENT_DATE - INTERVAL '30 days'
        AND ST_DWithin(location::geography, check_location::geography, radius_meters);
    
    -- Count police presence (police stations, patrols)
    SELECT COUNT(*) INTO police_presence
    FROM safe_zones
    WHERE zone_type = 'police'
        AND ST_DWithin(coordinates::geography, check_location::geography, radius_meters);
    
    -- Count general safe zones
    SELECT COUNT(*) INTO safe_zones_count
    FROM safe_zones
    WHERE zone_type IN ('hospital', 'embassy', 'hotel')
        AND ST_DWithin(coordinates::geography, check_location::geography, radius_meters);
    
    -- Calculate final score
    final_score := base_score 
        - (crime_incidents * 1.5)  -- Reduce score for each crime incident
        + (police_presence * 0.8)  -- Increase score for police presence
        + (safe_zones_count * 0.3); -- Small boost for safe zones
    
    -- Ensure score is within bounds
    final_score := GREATEST(0.0, LEAST(10.0, final_score));
    
    RETURN final_score;
END;
$$ LANGUAGE plpgsql;

-- Function to create geofence trigger
CREATE OR REPLACE FUNCTION check_geofence_alerts()
RETURNS TRIGGER AS $$
DECLARE
    alert_record RECORD;
BEGIN
    -- Check if user entered any alert areas
    FOR alert_record IN 
        SELECT * FROM alerts 
        WHERE status = 'ACTIVE' 
            AND ST_DWithin(location::geography, NEW.coordinates::geography, radius_meters)
    LOOP
        -- Insert notification for user
        INSERT INTO notifications (user_id, title, message, type, priority)
        VALUES (
            NEW.user_id,
            'Safety Alert: ' || alert_record.title,
            'You are near: ' || alert_record.description,
            'safety_alert',
            CASE alert_record.severity
                WHEN 'critical' THEN 'critical'
                WHEN 'high' THEN 'high'
                ELSE 'medium'
            END
        );
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for geofence alerts
DROP TRIGGER IF EXISTS user_location_geofence_trigger ON user_locations;
CREATE TRIGGER user_location_geofence_trigger
    AFTER INSERT ON user_locations
    FOR EACH ROW
    EXECUTE FUNCTION check_geofence_alerts();

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_iot_devices_updated_at BEFORE UPDATE ON iot_devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_safe_zones_updated_at BEFORE UPDATE ON safe_zones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_location_reviews_updated_at BEFORE UPDATE ON location_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default system configuration
INSERT INTO system_config (key, value, description) VALUES
('emergency_numbers', '{"IN": {"police": "100", "ambulance": "108", "fire": "101", "tourist_helpline": "1363"}, "US": {"emergency": "911"}, "UK": {"emergency": "999"}}', 'Emergency contact numbers by country'),
('safety_thresholds', '{"crime_alert": 5, "weather_warning": 3, "crowd_density_warning": 8}', 'Thresholds for various safety alerts'),
('notification_settings', '{"max_alerts_per_hour": 5, "emergency_cooldown_minutes": 2}', 'Notification rate limiting settings')
ON CONFLICT (key) DO NOTHING;

-- Views for common queries

-- Active alerts with location info
CREATE OR REPLACE VIEW active_alerts_view AS
SELECT 
    a.*,
    ST_X(a.location) as longitude,
    ST_Y(a.location) as latitude,
    u.first_name || ' ' || u.last_name as reporter_name
FROM alerts a
LEFT JOIN users u ON a.created_by = u.id
WHERE a.status = 'ACTIVE'
    AND (a.expires_at IS NULL OR a.expires_at > CURRENT_TIMESTAMP);

-- User locations with safety scores
CREATE OR REPLACE VIEW user_current_status AS
SELECT 
    u.id,
    u.first_name,
    u.last_name,
    u.email,
    ST_X(u.current_location) as longitude,
    ST_Y(u.current_location) as latitude,
    u.location_updated_at,
    calculate_area_safety_score(u.current_location) as current_safety_score
FROM users u
WHERE u.is_active = TRUE 
    AND u.current_location IS NOT NULL;

-- Emergency incidents summary
CREATE OR REPLACE VIEW emergency_incidents_summary AS
SELECT 
    ei.*,
    ST_X(ei.location) as longitude,
    ST_Y(ei.location) as latitude,
    u.first_name || ' ' || u.last_name as user_name,
    u.phone as user_phone,
    u.emergency_contact_name,
    u.emergency_contact_phone,
    r.first_name || ' ' || r.last_name as responder_name
FROM emergency_incidents ei
JOIN users u ON ei.user_id = u.id
LEFT JOIN users r ON ei.responder_id = r.id;

-- Performance monitoring
CREATE OR REPLACE VIEW database_performance AS
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE schemaname = 'public'
ORDER BY tablename, attname;

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO tourist_safety_app;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO tourist_safety_app;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO tourist_safety_app;

-- Insert sample data for testing
INSERT INTO users (id, email, password_hash, first_name, last_name, phone, preferred_language, is_verified) VALUES
('user_sample_1', 'tourist@example.com', '$2b$10$samplehashedpassword', 'Tourist', 'User', '+1234567890', 'en', TRUE),
('user_sample_2', 'guide@example.com', '$2b$10$samplehashedpassword', 'Tour', 'Guide', '+1234567891', 'hi', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO emergency_contacts (country_code, service_type, number, description) VALUES
('IN', 'police', '100', 'India Police Emergency'),
('IN', 'ambulance', '108', 'India Ambulance Service'),
('IN', 'fire', '101', 'India Fire Department'),
('IN', 'tourist_helpline', '1363', 'India Tourism Helpline'),
('US', 'emergency', '911', 'US Emergency Services'),
('UK', 'emergency', '999', 'UK Emergency Services'),
('FR', 'emergency', '112', 'France Emergency Services'),
('DE', 'emergency', '112', 'Germany Emergency Services'),
('JP', 'police', '110', 'Japan Police'),
('JP', 'ambulance', '119', 'Japan Ambulance'),
('AU', 'emergency', '000', 'Australia Emergency'),
('CA', 'emergency', '911', 'Canada Emergency Services')
ON CONFLICT (country_code, service_type, region) DO NOTHING;

INSERT INTO safe_zones (name, description, coordinates, zone_type, safety_score) VALUES
('Khan Market Police Station', 'Local police station with 24/7 service', ST_GeomFromText('POINT(77.2296 28.5738)', 4326), 'police', 9.5),
('All India Institute of Medical Sciences', 'Major hospital with emergency services', ST_GeomFromText('POINT(77.2090 28.5672)', 4326), 'hospital', 9.2),
('India Gate', 'Major tourist attraction with security', ST_GeomFromText('POINT(77.2295 28.6129)', 4326), 'tourist_attraction', 8.8),
('Connaught Place', 'Central business district', ST_GeomFromText('POINT(77.2203 28.6304)', 4326), 'commercial', 8.2),
('Red Fort', 'Historical monument with security', ST_GeomFromText('POINT(77.2410 28.6562)', 4326), 'tourist_attraction', 8.9)
ON CONFLICT (name) DO NOTHING;

-- Analysis queries for monitoring
-- These can be used by the application for analytics

-- Daily incident summary
CREATE OR REPLACE VIEW daily_incident_summary AS
SELECT 
    DATE(created_at) as incident_date,
    incident_type,
    COUNT(*) as incident_count,
    AVG(response_time_minutes) as avg_response_time
FROM emergency_incidents
WHERE created_at > CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at), incident_type
ORDER BY incident_date DESC, incident_count DESC;

-- Safety score trends by area
CREATE OR REPLACE VIEW safety_trends AS
SELECT 
    DATE(calculated_at) as score_date,
    ST_X(location) as longitude,
    ST_Y(location) as latitude,
    AVG(overall_score) as avg_safety_score,
    COUNT(*) as calculation_count
FROM safety_scores
WHERE calculated_at > CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(calculated_at), ST_X(location), ST_Y(location)
ORDER BY score_date DESC, avg_safety_score DESC;

-- Commit the schema
COMMIT;

-- Display summary
SELECT 'Tourist Safety Database Schema Created Successfully!' as status;
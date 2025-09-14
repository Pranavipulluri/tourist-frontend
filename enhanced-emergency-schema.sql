-- Enhanced Emergency Response System Database Schema

-- Emergency Alerts Table (Enhanced)
CREATE TABLE IF NOT EXISTS emergency_alerts (
    id VARCHAR(100) PRIMARY KEY,
    tourist_id VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('SOS', 'PANIC', 'MEDICAL', 'ACCIDENT', 'CRIME', 'NATURAL_DISASTER')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')) DEFAULT 'HIGH',
    status VARCHAR(20) NOT NULL CHECK (status IN ('ACTIVE', 'ACKNOWLEDGED', 'DISPATCHED', 'RESOLVED')) DEFAULT 'ACTIVE',
    message TEXT NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    accuracy INTEGER DEFAULT 10,
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP,
    acknowledged_by VARCHAR(100),
    resolved_at TIMESTAMP,
    resolved_by VARCHAR(100),
    resolution TEXT,
    response_time INTEGER, -- milliseconds
    fir_number VARCHAR(50),
    FOREIGN KEY (tourist_id) REFERENCES users(id),
    FOREIGN KEY (acknowledged_by) REFERENCES users(id),
    FOREIGN KEY (resolved_by) REFERENCES users(id)
);

-- Emergency Contacts Table
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id SERIAL PRIMARY KEY,
    alert_id VARCHAR(100),
    user_id VARCHAR(100), -- For global emergency contacts
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    relationship VARCHAR(50),
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (alert_id) REFERENCES emergency_alerts(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Emergency Notifications Table
CREATE TABLE IF NOT EXISTS emergency_notifications (
    id SERIAL PRIMARY KEY,
    alert_id VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('SMS', 'EMAIL', 'CALL', 'PUSH', 'WHATSAPP', 'EMERGENCY_SERVICES')),
    recipient VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'SENT', 'DELIVERED', 'FAILED')) DEFAULT 'PENDING',
    message TEXT,
    message_id VARCHAR(100), -- Twilio SID or other provider ID
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    error_message TEXT,
    retries INTEGER DEFAULT 0,
    FOREIGN KEY (alert_id) REFERENCES emergency_alerts(id)
);

-- Emergency Calls Table (Twilio Integration)
CREATE TABLE IF NOT EXISTS emergency_calls (
    id SERIAL PRIMARY KEY,
    sid VARCHAR(100) UNIQUE NOT NULL, -- Twilio Call SID
    tourist_id VARCHAR(100) NOT NULL,
    admin_id VARCHAR(100),
    alert_id VARCHAR(100),
    reason VARCHAR(100) NOT NULL CHECK (reason IN ('EMERGENCY_RESPONSE', 'FOLLOW_UP', 'MEDICAL_CONSULTATION')),
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')) DEFAULT 'HIGH',
    status VARCHAR(20) NOT NULL CHECK (status IN ('initiated', 'ringing', 'answered', 'completed', 'failed')) DEFAULT 'initiated',
    duration INTEGER, -- seconds
    recording_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tourist_id) REFERENCES users(id),
    FOREIGN KEY (admin_id) REFERENCES users(id),
    FOREIGN KEY (alert_id) REFERENCES emergency_alerts(id)
);

-- FIR (First Information Report) Table
CREATE TABLE IF NOT EXISTS fir_reports (
    id SERIAL PRIMARY KEY,
    fir_number VARCHAR(50) UNIQUE NOT NULL,
    alert_id VARCHAR(100) NOT NULL,
    incident_type VARCHAR(50) NOT NULL,
    tourist_id VARCHAR(100) NOT NULL,
    tourist_name VARCHAR(200) NOT NULL,
    tourist_phone VARCHAR(20),
    incident_location TEXT NOT NULL,
    incident_description TEXT NOT NULL,
    report_time TIMESTAMP NOT NULL,
    filed_by VARCHAR(100), -- Admin who filed the FIR
    police_station VARCHAR(200),
    investigating_officer VARCHAR(200),
    status VARCHAR(20) DEFAULT 'FILED' CHECK (status IN ('FILED', 'UNDER_INVESTIGATION', 'CLOSED', 'TRANSFERRED')),
    closure_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (alert_id) REFERENCES emergency_alerts(id),
    FOREIGN KEY (tourist_id) REFERENCES users(id),
    FOREIGN KEY (filed_by) REFERENCES users(id)
);

-- Dispatched Units Table
CREATE TABLE IF NOT EXISTS dispatched_units (
    id SERIAL PRIMARY KEY,
    alert_id VARCHAR(100) NOT NULL,
    unit_type VARCHAR(20) NOT NULL CHECK (unit_type IN ('POLICE', 'AMBULANCE', 'FIRE', 'RESCUE')),
    unit_id VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('DISPATCHED', 'EN_ROUTE', 'ON_SCENE', 'RETURNING', 'AVAILABLE')) DEFAULT 'DISPATCHED',
    assigned_officer VARCHAR(200),
    contact_number VARCHAR(20),
    dispatched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estimated_arrival TIMESTAMP,
    actual_arrival TIMESTAMP,
    departure_time TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (alert_id) REFERENCES emergency_alerts(id)
);

-- Emergency Response Timeline Table
CREATE TABLE IF NOT EXISTS emergency_timeline (
    id SERIAL PRIMARY KEY,
    alert_id VARCHAR(100) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    event_description TEXT NOT NULL,
    event_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(100), -- Who performed the action
    metadata JSONB, -- Additional event data
    FOREIGN KEY (alert_id) REFERENCES emergency_alerts(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Location Tracking Table (For emergency tracking)
CREATE TABLE IF NOT EXISTS emergency_location_tracking (
    id SERIAL PRIMARY KEY,
    alert_id VARCHAR(100) NOT NULL,
    tourist_id VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    accuracy INTEGER,
    altitude DECIMAL(8, 2),
    speed DECIMAL(8, 2),
    heading DECIMAL(6, 2),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    battery_level INTEGER,
    signal_strength INTEGER,
    FOREIGN KEY (alert_id) REFERENCES emergency_alerts(id),
    FOREIGN KEY (tourist_id) REFERENCES users(id)
);

-- Emergency System Configuration Table
CREATE TABLE IF NOT EXISTS emergency_config (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_tourist_id ON emergency_alerts(tourist_id);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_status ON emergency_alerts(status);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_created_at ON emergency_alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_location ON emergency_alerts(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_emergency_calls_sid ON emergency_calls(sid);
CREATE INDEX IF NOT EXISTS idx_emergency_calls_tourist_id ON emergency_calls(tourist_id);
CREATE INDEX IF NOT EXISTS idx_fir_reports_fir_number ON fir_reports(fir_number);
CREATE INDEX IF NOT EXISTS idx_emergency_timeline_alert_id ON emergency_timeline(alert_id);
CREATE INDEX IF NOT EXISTS idx_location_tracking_alert_id ON emergency_location_tracking(alert_id);

-- Insert default emergency configuration
INSERT INTO emergency_config (key, value, description) VALUES
('emergency_response_radius', '10000', 'Radius in meters to search for nearby admins during emergency'),
('auto_escalation_time', '300', 'Time in seconds before auto-escalation to emergency services'),
('location_tracking_interval', '30', 'Location update interval in seconds during emergency'),
('max_notification_retries', '3', 'Maximum retry attempts for failed notifications'),
('emergency_services_phone', '+911', 'Default emergency services phone number'),
('tourist_helpline_phone', '+1363', 'Tourist helpline phone number')
ON CONFLICT (key) DO NOTHING;

-- Add user role for emergency responders if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'tourist' 
    CHECK (role IN ('tourist', 'admin', 'emergency_responder', 'super_admin'));

-- Add last location column to users if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_location GEOMETRY(Point, 4326);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_safety_check TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing users to have default role
UPDATE users SET role = 'tourist' WHERE role IS NULL;

-- Create spatial index for user locations
CREATE INDEX IF NOT EXISTS idx_users_last_location ON users USING GIST(last_location);

-- Function to calculate response time
CREATE OR REPLACE FUNCTION calculate_response_time()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.acknowledged_at IS NOT NULL AND OLD.acknowledged_at IS NULL THEN
        NEW.response_time = EXTRACT(EPOCH FROM (NEW.acknowledged_at - NEW.created_at)) * 1000;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically calculate response time
DROP TRIGGER IF EXISTS trigger_calculate_response_time ON emergency_alerts;
CREATE TRIGGER trigger_calculate_response_time
    BEFORE UPDATE ON emergency_alerts
    FOR EACH ROW
    EXECUTE FUNCTION calculate_response_time();

-- Function to log emergency timeline events
CREATE OR REPLACE FUNCTION log_emergency_event()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO emergency_timeline (alert_id, event_type, event_description)
        VALUES (NEW.id, 'ALERT_CREATED', 'Emergency alert created: ' || NEW.type || ' - ' || NEW.severity);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != NEW.status THEN
            INSERT INTO emergency_timeline (alert_id, event_type, event_description, user_id)
            VALUES (NEW.id, 'STATUS_CHANGED', 'Status changed from ' || OLD.status || ' to ' || NEW.status, NEW.acknowledged_by);
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically log emergency events
DROP TRIGGER IF EXISTS trigger_log_emergency_event ON emergency_alerts;
CREATE TRIGGER trigger_log_emergency_event
    AFTER INSERT OR UPDATE ON emergency_alerts
    FOR EACH ROW
    EXECUTE FUNCTION log_emergency_event();

-- Create view for emergency dashboard statistics
CREATE OR REPLACE VIEW emergency_dashboard_stats AS
SELECT 
    COUNT(*) as total_alerts,
    COUNT(*) FILTER (WHERE status = 'ACTIVE') as active_alerts,
    COUNT(*) FILTER (WHERE status = 'RESOLVED' AND DATE(resolved_at) = CURRENT_DATE) as resolved_today,
    AVG(response_time) FILTER (WHERE response_time IS NOT NULL) as avg_response_time,
    COUNT(*) FILTER (WHERE severity = 'CRITICAL') as critical_alerts,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as alerts_this_week
FROM emergency_alerts;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
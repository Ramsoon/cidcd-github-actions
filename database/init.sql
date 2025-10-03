-- Initialize NIMC Database
CREATE TABLE IF NOT EXISTS citizens (
    id SERIAL PRIMARY KEY,
    nin VARCHAR(11) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE,
    phone VARCHAR(15),
    date_of_birth DATE NOT NULL,
    state_of_origin VARCHAR(100),
    lga VARCHAR(100),
    address TEXT,
    occupation VARCHAR(100),
    gender VARCHAR(10) CHECK (gender IN ('Male', 'Female', 'Other')),
    marital_status VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'officer',
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin user (password: admin123)
INSERT INTO users (username, password_hash, role, full_name, email) 
VALUES (
    'admin', 
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',  -- bcrypt hash for 'admin123'
    'admin', 
    'System Administrator', 
    'admin@nimc.gov.ng'
) ON CONFLICT (username) DO NOTHING;

-- Insert sample officers
INSERT INTO users (username, password_hash, role, full_name, email) 
VALUES 
(
    'officer1', 
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'officer', 
    'Registration Officer 1', 
    'officer1@nimc.gov.ng'
),
(
    'officer2', 
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'officer', 
    'Registration Officer 2', 
    'officer2@nimc.gov.ng'
) ON CONFLICT (username) DO NOTHING;

-- Insert sample citizens
INSERT INTO citizens (nin, first_name, last_name, email, phone, date_of_birth, state_of_origin, lga, address, occupation, gender, marital_status) 
VALUES 
('12345678901', 'Sadiq', 'Abdulrahaman', 'sadiqabdulrahman00880@gmail.com', '08169966247', '1985-05-15', 'Lagos', 'Ikeja', '123 Main Street, Ikeja', 'DevOps Engineer', 'Male', 'Married'),
('12345678902', 'Chiamaka', 'Okoro', 'chiamaka.okoro@email.com', '08023456789', '1990-08-22', 'Abia', 'Umuahia', '456 Oak Avenue, Umuahia', 'Teacher', 'Female', 'Single'),
('12345678903', 'Emmanuel', 'Adeyemi', 'emmanuel.adeyemi@email.com', '08034567890', '1978-12-03', 'Oyo', 'Ibadan', '789 Palm Road, Ibadan', 'Doctor', 'Male', 'Married'),
('12345678904', 'Fatima', 'Bello', 'fatima.bello@email.com', '08045678901', '1995-03-18', 'Kano', 'Kano Municipal', '321 Cedar Lane, Kano', 'Nurse', 'Female', 'Single'),
('12345678905', 'Gabriel', 'Chukwu', 'gabriel.chukwu@email.com', '08056789012', '1982-07-29', 'Enugu', 'Enugu East', '654 Pine Street, Enugu', 'Business Owner', 'Male', 'Married');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_citizens_nin ON citizens(nin);
CREATE INDEX IF NOT EXISTS idx_citizens_state ON citizens(state_of_origin);
CREATE INDEX IF NOT EXISTS idx_citizens_created_at ON citizens(created_at);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Display initialization summary
SELECT 'Database initialized successfully' as message;
SELECT COUNT(*) as total_citizens FROM citizens;
SELECT COUNT(*) as total_users FROM users;
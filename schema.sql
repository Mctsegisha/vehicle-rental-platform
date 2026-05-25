--- Cleanup ---
DROP TABLE IF EXISTS Reviews;
DROP TABLE IF EXISTS Payments;
DROP TABLE IF EXISTS Bookings;
DROP TABLE IF EXISTS Vehicles;
DROP TABLE IF EXISTS Users;
DROP TYPE IF EXISTS user_role;

--- Types ---
CREATE TYPE user_role AS ENUM ('customer', 'owner', 'admin');

--- Users Table ---
CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'customer',
    phone VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--- Vehicles Table ---
CREATE TABLE Vehicles (
    vehicle_id SERIAL PRIMARY KEY,
    owner_id INTEGER REFERENCES Users(user_id) ON DELETE CASCADE,
    category VARCHAR(255) NOT NULL,
    description TEXT,
    price_per_day DECIMAL(10, 2) NOT NULL,
    availability_status VARCHAR(50) DEFAULT 'available',
    location VARCHAR(255),
    image_url VARCHAR(255),
    plate_number VARCHAR(50),
    ownership_book_url TEXT,
    insurance_cert_url TEXT,
    national_id_url TEXT,
    approval_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--- Bookings Table ---
CREATE TABLE Bookings (
    booking_id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES Users(user_id) ON DELETE CASCADE,
    vehicle_id INTEGER REFERENCES Vehicles(vehicle_id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_amount DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--- Payments Table ---
CREATE TABLE Payments (
    payment_id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES Bookings(booking_id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'pending',
    verified_by_admin BOOLEAN DEFAULT FALSE,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--- Reviews Table ---
CREATE TABLE Reviews (
    review_id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES Vehicles(vehicle_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES Users(user_id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--- Enable RLS ---
ALTER TABLE Users ENABLE ROW LEVEL SECURITY;
ALTER TABLE Vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE Bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE Payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE Reviews ENABLE ROW LEVEL SECURITY;

--- Basic Policies (Public read for vehicles, restricted for others) ---
CREATE POLICY "Public vehicles are viewable by everyone" ON Vehicles FOR SELECT USING (true);
CREATE POLICY "Users can view their own data" ON Users FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can view their own bookings" ON Bookings FOR SELECT USING (auth.uid()::text = customer_id::text);
CREATE POLICY "Public reviews are viewable by everyone" ON Reviews FOR SELECT USING (true);
CREATE POLICY "Users can insert their own reviews" ON Reviews FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

--- Initial Seed ---
INSERT INTO Users (name, email, password, role) VALUES 
('System Admin', 'admin@ethiorent.com', '$2a$10$x6yUf6f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f', 'admin');

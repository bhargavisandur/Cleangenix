CREATE TABLE users(
    id SERIAL PRIMARY KEY, 
    phone_no VARCHAR(10), 
    pincode VARCHAR(6), 
    latitude float, 
    longitude float, 
    user_location geography(point, 4326)
);
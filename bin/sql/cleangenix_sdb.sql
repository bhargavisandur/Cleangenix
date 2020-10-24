
create table users(
	user_id uuid DEFAULT uuid_generate_v4 (), 
	phone_no varchar(10),
	pincode varchar(6),
	password varchar(100),
	lat float,
	long float,
	geolocation geography(point, 4326),
	rewards int,
	PRIMARY KEY (user_id)
	);



CREATE TABLE locations (
  id SERIAL PRIMARY KEY,
  search_query VARCHAR(255),
  formatted_query VARCHAR(255),
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7)
);
 
INSERT INTO locations (search_query, formatted_query, latitude, longitude)
VALUES ('iowa city', 'Iowa City, Johnson County, Iowa, USA', '40.2058183', '-90.2892347234');


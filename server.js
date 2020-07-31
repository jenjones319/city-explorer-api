'use strict';

// Application Dependencies
const express = require('express');
require('dotenv').config();
const cors = require('cors');
const { response } = require('express');
const superagent = require('superagent');

// Application Setup
const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());

// Route Definitions
app.get('/', rootHandler);
app.get('/location', locationHandler);
app.get('/yelp', restaurantHandler);
app.get('/weather', weatherHandler);
app.get('/trails', trailsHandler);
app.use('*', notFoundHandler);
app.use(errorHandler);

// Route Handlers
function rootHandler(request, response){
  response.status(200).send('City Explorer back-end')
}

function locationHandler(request, response){
  const city = request.query.city;
  const url = 'https://us1.locationiq.com/v1/search.php';
  superagent.get(url)
    .query({
      key: process.env.LOCATION_KEY,
      q: city,
      format: 'json'
    })
    .then(locationData => {
      const location = locationData.body[0];
      const newLocation = new Location(city, location);
      response.status(200).send(newLocation);
    })
    .catch(err => {
      console.log(err);
      errorHandler(err, request, response)
    });
}

function restaurantHandler(request, response) {
  const lat = parseFloat(request.query.latitude);
  const lon = parseFloat(request.query.longitude);
  const page = request.query.page;
  const restaurantPerPage = 5;
  const start = ((page - 1) * restaurantPerPage + 1);
  const url = 'https://api.yelp.com/v3/businesses/search';
  superagent.get(url)
    .query({
      latitude: lat,
      longitude: lon,
      limit: restaurantPerPage,
      offset: start
    })
    .set('Authorization', `Bearer ${process.env.YELP_KEY}`)
    .then(yelpResponse => {
      const arrayOfRestaurants = yelpResponse.body.businesses;
      const restaurantsResults = [];
      arrayOfRestaurants.forEach(restaurantObj => {
        restaurantsResults.push(new Restaurant(restaurantObj));
      });
      response.send(restaurantsResults);
    })
    .catch(err => {
      console.log(err);
      errorHandler(err, request, response)
    });
}

function trailsHandler(request, response) {
  const latitude = parseInt(request.query.latitude);
  const longitude = parseInt(request.query.longitude);
  const url = 'https://www.hikingproject.com/data/get-trails';
  superagent.get(url)
    .query({
      key: process.env.TRAIL_KEY,
      lat: latitude,
      lon: longitude,
      maxDistance: 200
    })
    .then(trailResponse => {
      console.log(trailResponse.body);
      const arrayOfTrailData = trailResponse.body.trails;
      const trailResults = [];
      arrayOfTrailData.forEach(trail => {
        trailResults.push(new Trails(trail));
      });
      response.send(trailResults);
    })
}

function weatherHandler(request, response) {
  const latitude = parseFloat(request.query.latitude);
  const longitude = parseFloat(request.query.longitude);
  const url = 'https://api.weatherbit.io/v2.0/forecast/daily';
  superagent.get(url)
    .query({
      key: process.env.WEATHER_API_KEY,
      lat: latitude,
      lon: longitude
    })
    .then(weatherResponse => {
      const arrayOfWeatherData = weatherResponse.body.data;
      const weatherResults = [];
      arrayOfWeatherData.forEach(location => {
        weatherResults.push(new Weather(location));
      });
      response.send(weatherResults)
    })
}

function notFoundHandler(request, response) {
  response.status(404).json({ notFound: true });
}

function errorHandler(error, request, response, next) {
  response.status(500).json({ error: true, message: error.message });
}

// Constructor
function Location(city, locationData) {
  this.search_query = city;
  this.formatted_query = locationData.display_name;
  this.latitude = parseFloat(locationData.lat);
  this.longitude = parseFloat(locationData.lon);
}

function Restaurant(obj) {
  this.name = obj.name;
  this.url = obj.url;
  this.rating = obj.rating;
  this.price = obj.price;
  this.image_url = obj.image_url;
}

function Weather(conditions) {
  this.time = conditions.datetime;
  this.forecast = conditions.weather.description;
}

function Trails(trail) {
  this.name = trail.name;
  this.location = trail.location;
  this.length = trail.length;
  this.stars = trail.stars;
  this.starVotes = trail.starVotes;
  this.summary = trail.summary;
  this.trailUrl = trail.url;
  this.conditions = trail.conditionStatus;
  this.condition_date = trail.conditionDate.slice(0, 10);
  this.condition_time = trail.conditionDate.slice(12);
}

// App listener
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));

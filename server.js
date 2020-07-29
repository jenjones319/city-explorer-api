'use strict';

// Application Dependencies
const express = require('express');
require('dotenv').config();
const cors = require('cors');
const { response } = require('express');
const superagent = require('superagent');

// Application Setup
const app = express();
const PORT = process.env.PORT;
app.use(cors());

// Route Definitions
app.get('/', rootHandler);
app.get('/location', locationHandler);
app.get('/yelp', restaurantHandler);
app.get('/trails',trailsHandler);
app.get('/movies', movieHandler);
app.get('/weather', weatherHandler);
app.use('*', notFoundHandler);
app.use(errorHandler);

// Route Handlers
function rootHandler(request, response) {
  response.status(200).send('City Explorer App');
}

function locationHandler(request, response) {
  const city = request.query.city;
  const url = 'https://us1.locationiq.com/v1/search.php'
  superagent.get(url)
    .query({
      key: process.env.LOCATION_KEY,
      q: city,
      format: 'json'
    })
    .then(locationData => {
      // console.log(request.query.city)
      const rawLocation = locationData.body[0];
      const location = new Location(city,rawLocation);
      response.status(200).send(location);
    })
    .catch( error => {
      console.log(error);
    });
  // const locationData = require('./data/location.json');
  // const location = new Location(city, locationData);
  // response.status(200).send(location);
}

function restaurantHandler(request, response) {
  // const restaurantsData = require('./data/restaurants.json');
  // const arrayOfRestaurants = url.nearby_restaurants;
  // const restaurantsResults = [];
  // arrayOfRestaurants.forEach(restaurantObj => {
  //   restaurantsResults.push(new Restaurant(restaurantObj));
  // });
  const queryString = request.query;
  console.log(queryString);
  const lat = parseFloat(request.query.latitude);
  const lon = parseFloat(request.query.longitude);
  const currentPage = request.query.page;
  const numPerPage = 4;
  const start = ((currentPage - 1) * numPerPage + 1);
  const url = 'https://api.yelp.com/v3/businesses/search';
  superagent.get(url)
    .query({
      latitude: lat,
      longitude: lon,
      limit: numPerPage,
      offset: start
    })
    .set('Authorization', `Bearer ${process.env.YELP_KEY}`)
    .then(yelpResponse => {
      console.log(yelpResponse);
      const arrayOfRestaurants = yelpResponse.body.businesses;
      const restaurantsResults = [];
      arrayOfRestaurants.forEach(restaurantObj => {
        restaurantsResults.push(new Restaurant(restaurantObj));
      });
      response.send(restaurantsResults);
    })
    .catch(err => {
      console.log(err);
      errorHandler(err, request, response);
    });
}

function weatherHandler(request, response) {
  const url = 'https://api.weatherbit.io/v2.0/forecast/daily'
  const lat = parseFloat(request.query.latitude);
  const lon = parseFloat(request.query.longitude);
  console.log(lat,lon)
  superagent.get(url)
    .query({
      key:process.env.WEATHER_KEY,
      lat:lat,
      lon:lon,
    })
    .then( weatherApi => {
      const weatherData = weatherApi.body.data;
      const arrayOfWeatherData = weatherData;
      const weatherResults = [];
      arrayOfWeatherData.forEach(location => {
        weatherResults.push(new Weather(location));
      });
      response.send(weatherResults)
      response.status(200).send(weatherData);
    })
    .catch( error => {
      console.log(error)
    });
}

function trailsHandler(request, response) {
  const latitude = parseFloat(request.query.latitude);
  const longitude = parseFloat(request.query.longitude);
  const url = 'https://www.hikingproject.com/data/get-trails';
  superagent.get(url)
    .query({
      key: process.env.TRAIL_KEY,
      lat: latitude,
      lon: longitude,
      maxDistance: 200
    })
    .then(data => {
      console.log(data.body);
      const arrayOfTrailData = data.body.trails;
      const trailResults = [];
      arrayOfTrailData.forEach(trail => {
        trailResults.push(new Trails(trail));
      })
        .catch( error => {
          console.log(error)
        });
      response.status(200).send(trailResults);
    });
}
function movieHandler() {
}

function notFoundHandler(request, response) {
  response.status(404).json({ notFound: true });
}

function errorHandler(error, request, response, next) {
  response.status(500).json({ error: true, message: error.message });
}

// Constructors
function Location(city, locationData) {
  this.search_query = city;
  this.formatted_query = locationData.display_name;
  this.latitude = locationData.lat;
  this.longitude = locationData.lon;
}

function Restaurant(obj) {
  this.name = obj.name;
  this.url = obj.url;
  this.rating = obj.rating;
  this.price = obj.price;
  this.image_url = obj.image_url;
}

function Weather(data) {
  this.time = data.datetime;
  this.forecast = data.weather.description;
}

function Trails(data) {
  this.name = data.name;
  this.location = data.location;
  this.length = data.length;
  this.stars = data.stars;
  this.star_votes = data.starVotes;
  this.summary = data.summary;
  this.trail_url = data.url
  this.conditions = data.conditionStatus;
  this.condition_date = data.conditionDate.slice(0, 10);
  this.condition_time = data.conditionDate.slice(12);
}

// App listener
app.listen(PORT,() => console.log(`Listening on port ${PORT}`));

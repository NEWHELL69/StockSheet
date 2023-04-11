// There is no hot reloading.
// If you modify the code while the application is running then the changes
// will not be reflected

// There is one big problem in this code.
// The code uses HTTP status code and also status codes created by me.
// This is not consistent. I don't know which to use. Building the frontend will answer this issue.

require('dotenv').config();

const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');

// ---------------------------------------------------------
// mongoose models

const reelModel = require('./schemas/reel');
const FilterModel = require('./schemas/filter');
const shipmentModel = require('./schemas/shipment')
const sheetModel = require("./schemas/sheet")
// const shipmentModel = require("./schemas/shipment")

// ---------------------------------------------------------

const app = express();

// ------------------------------------------------------------
// Middlewares

// The middleware below serves the frontend to the client.
// Basically it serves the index.js file in the
// build folder and executes it
app.use(express.static('build'));

// This middleware converts the data recieved to the server in json format
app.use(express.json());

// This one logs any request made to the server
// One important thing to note. it only logs those request which have a response.
// No response indicates server error.
app.use(morgan((tokens, req, res) => {
  if (tokens.method(req, res) === 'POST') {
    return [
      tokens.method(req, res),
      tokens.url(req, res),
      tokens.status(req, res),
      tokens.res(req, res, 'content-length'), '-',
      tokens['response-time'](req, res), 'ms',
      JSON.stringify(req.body),
    ].join(' ');
  }

  return [
    tokens.method(req, res),
    tokens.url(req, res),
    tokens.status(req, res),
    tokens.res(req, res, 'content-length'), '-',
    tokens['response-time'](req, res), 'ms',
  ].join(' ');
}));

// This middleware responds every request with 503 server error code
// if connection to database is not established
const handleDataBaseConnection = (request, response, next) => {
  if (mongoose.connection.readyState !== 1) {
    response.status(503).json({
      error: 'Database not connected',
    });
  } else {
    // It's important next() is called inside this else block.
    // Because we need to end the request-response cycle.
    next();
  }
};

app.use(handleDataBaseConnection);

/**
 * This is a middleware function in JavaScript that validates the format and length of a query
 * parameter called "ids" and returns an error response if it is invalid.
 */
// Ids validation middleware
const handleIdsValidation = (request, response, next) => {
  const invalidPattern = !request.query.ids.match(/^([0-9a-fA-F]+,)*[0-9a-fA-F]+$/);
  const invalidLength = request.query.ids.length === 0;

  if (invalidPattern || invalidLength) {
    response.status(400).json({
      error: 'Invalid ids',
    });
  } else {
    next();
  }
};
// ------------------------------------------------------------

// ------------------------------------------------------------
// mongoDB code below

const url = process.env.MONGODB_URI;

console.log('Connecting to MongoDB');

mongoose.connect(url).then(() => {
  console.log('Connection successfull');
}).catch((e) => {
  console.log('Error connecting to MongoDB:', e.message);
});

// ------------------------------------------------------------

// ------------------------------------------------------------
// Requests

const requests = require('./requests/requests');

// ------------------------------------------------------------

// ------------------------------------------------------------
// API

// ------------------------------------------------------------
// REEL API
     
requests.getSingle(app, "reel", reelModel)

requests.getMultiple(app, "reel", reelModel, handleIdsValidation)

requests.postSingle(app, "reel", reelModel)

requests.postMultiple(app, "reel", reelModel)

requests.deleteSingle(app, "reel", reelModel)

requests.deleteMultiple(app, "reel", reelModel, handleIdsValidation)

requests.putSingle(app, "reel", reelModel)

// REEL API
// ------------------------------------------------------------

// ------------------------------------------------------------
// FILTER API

requests.getSingle(app, "filter", FilterModel)

requests.getMultiple(app, 'filter', FilterModel, handleIdsValidation)

requests.postSingle(app, 'filter', FilterModel);

requests.postMultiple(app, "filter", FilterModel)

requests.deleteSingle(app, 'filter', FilterModel)

requests.deleteMultiple(app, "filter", FilterModel, handleIdsValidation)

requests.putSingle(app, "filter", FilterModel)

// FILTER API
// ------------------------------------------------------------

// ------------------------------------------------------------
// SHIPMENT API
     
requests.getSingle(app, "shipment", shipmentModel)

requests.getMultiple(app, "shipment", shipmentModel, handleIdsValidation)

requests.postSingle(app, "shipment", shipmentModel)

requests.postMultiple(app, "shipment", shipmentModel)

requests.deleteSingle(app, "shipment", shipmentModel)

requests.deleteMultiple(app, "shipment", shipmentModel, handleIdsValidation)

requests.putSingle(app, "shipment", shipmentModel)

// SHIPMENT API
// ------------------------------------------------------------

// ------------------------------------------------------------
// SHEET API
     
requests.getSingle(app, "sheet", sheetModel)

requests.getMultiple(app, "sheet", sheetModel, handleIdsValidation)

requests.postSingle(app, "sheet", sheetModel)

requests.postMultiple(app, "sheet", sheetModel)

requests.deleteSingle(app, "sheet", sheetModel)

requests.deleteMultiple(app, "sheet", sheetModel, handleIdsValidation)

requests.putSingle(app, "sheet", sheetModel)

// REEL API
// ------------------------------------------------------------

// API
// ------------------------------------------------------------

// ------------------------------------------------------------
// Error handling

const errorHandler = (error, request, response, next) => {
  console.error(error.message);

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' });
  }

  next(error);
};

// this has to be the last loaded middleware.
app.use(errorHandler);

// Error handling
// ------------------------------------------------------------

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Example app listening on port ${port}!`));

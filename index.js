// There is no hot reloading.
// If you modify the code while the application is running then the changes
// will not be reflected

require('dotenv').config();

const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');

// mongoose models
const Reel = require('./models/reel');

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
// API

// Reel API

const responseObj = (id, code, message, reel) => {
  console.log(message);

  if (reel) {
    // JSON.stringify calls the toJSON method defined on the document and does some other imp stuff.
    reel = JSON.stringify(reel);
    reel = JSON.parse(reel);

    return {
      id,
      state: {
        code,
        message,
      },
      reel: {
        ...reel,
      },
    };
  }
  return {
    id,
    state: {
      code,
      message,
    },
    reel: null,
  };
};

app.get('/api/reel/:id', (request, response) => {
  const { id } = request.params;

  // In context of get request, the state codes have following meaning:
  // 1 -> Reel was found (intended behaviour)
  // 2 -> Reel was not found in database (inteded behaviour)
  // 0 -> server error

  Reel.findById(id)
    .then((reel) => {
      if (reel) {
        response.json(responseObj(id, 1, 'Reel was found', reel));
      } else {
        response.status(404).send(responseObj(id, 2, 'Reel was not found', null));
      }
    }).catch((e) => {
      console.log(e);

      response.status(400).send(responseObj(id, 0, e.message, null));
    });
});

app.get('/api/reels', async (request, response) => {
  const { ids } = request.query;
  const idArray = ids.split(',');
  const reels = [];

  // In context of get request, the state codes have following meaning:
  // 1 -> Reel was found (intended behaviour)
  // 2 -> Reel was not found in database (inteded behaviour)
  // 0 -> server error

  let id = '';

  for (id of idArray) {
    try {
      const reel = await Reel.findById(id);

      if (reel) {
        reels.push(responseObj(id, 1, 'Reel was found', reel));
      } else {
        reels.push(responseObj(id, 2, 'Reel was not found', null));
      }
    } catch (e) {
      console.log(e);

      reels.push(responseObj(id, 0, e.message, null));
    }
  }

  response.json(reels);
});

app.post('/api/reel', (request, response) => {
  const { body } = request;

  const reel = new Reel({
    gsm: body.gsm,
    size: body.size,
    shipment: body.shipment,
    shade: body.shade,
    annotations: body.annotations,
    bf: body.bf,
    sold: body.sold,
    soldTo: body.soldTo,
    soldDate: body.soldDate,
  });

  reel.save()
    .then((newReel) => {
      // Unlike findById method which can resolve with null value,
      // save method only resolves with the saved document,
      // when the document is actually saved in database
      if (newReel === reel) {
        response.json(responseObj(newReel.id, 1, 'Reel is saved in database', newReel));
      } else {
        response.json(responseObj(null, 2, 'Reel was not saved in database', null));
      }
    }).catch((e) => {
      console.log(e);

      response.status(400).json(responseObj(null, 0, e.message, null));
    });
});

app.post('/api/reels', async (request, response) => {
  const reels = request.body;
  const acknowledgments = [];

  // In context of post request, the state codes have following meaning:
  // 1 -> Reel was saved (intended behaviour)
  // 2 -> Reel was not saved (inteded behaviour)
  // 0 -> server error

  let reel = {};

  for (reel of reels) {
    try {
      reel = new Reel({
        gsm: reel.gsm,
        size: reel.size,
        shipment: reel.shipment,
        shade: reel.shade,
        annotations: reel.annotations,
        bf: reel.bf,
        sold: reel.sold,
        soldTo: reel.soldTo,
        soldDate: reel.soldDate,
      });

      const newReel = await reel.save(reel);

      if (newReel === reel) {
        acknowledgments.push(responseObj(newReel.id, 1, 'Reel was saved', reel));
      } else {
        acknowledgments.push(responseObj(null, 2, 'Reel was not saved in database', null));
      }
    } catch (e) {
      console.log(e);

      acknowledgments.push(responseObj(null, 0, e.message, null));
    }
  }

  response.json(acknowledgments);
});

app.delete('/api/reel/:id', (request, response) => {
  // This conversion here is necessary
  const id = new mongoose.Types.ObjectId(request.params.id);

  Reel.deleteOne(id).then((res) => {
    if (res.deletedCount === 1) {
      response.json(responseObj(id, 1, 'Reel was deleted from database', null));
    } else if (res.deletedCount === 0) {
      response.json(responseObj(id, 2, 'Reel was not found and hence not deleted', null));
    }
  }).catch((e) => {
    response.json(responseObj(id, 0, e.message, null));
  });
});

app.delete('/api/reels', async (request, response) => {
  const { ids } = request.query;
  const idArray = ids.split(',');
  const acknowledgments = [];

  // In context of delete request for reel, the state codes have following meaning:
  // 1 -> Reel deletion successfull (intended behaviour)
  // 2 -> Reel was not found in database (inteded behaviour)
  // 0 -> server error

  for (id of idArray) {
    try {
      // This conversion here is necessary
      id = new mongoose.Types.ObjectId(id);

      const res = await Reel.deleteOne(id);

      if (res.deletedCount === 1) {
        acknowledgments.push(responseObj(id, 1, 'Reel was deleted', null));
      } else if (res.deletedCount === 0) {
        acknowledgments.push(responseObj(id, 2, 'Reel was not found and hence not deleted', null));
      }
    } catch (error) {
      console.log(error);

      acknowledgments.push(responseObj(id, 0, error.message, null));
    }
  }

  response.json(acknowledgments);
});

app.put('/api/reel/:id', (request, response) => {
  const { body } = request;
  const { id } = request.params;

  const updationToReel = {
    gsm: body.gsm,
    size: body.size,
    shipment: body.shipment,
    shade: body.shade,
    annotations: body.annotations,
    bf: body.bf,
    sold: body.sold,
    soldTo: body.soldTo,
    soldDate: body.soldDate,
  };

  Reel.findByIdAndUpdate(id, updationToReel, { new: true }).then((newReel) => {
    response.json(responseObj(newReel.id, 1, 'Document was found and updated', newReel));
  }).catch((e) => {
    response.status(400).send(responseObj(id, 0, e.message, null));
  });
});

// ------------------------------------------------------------

// ------------------------------------------------------------
// Error handling for reel api

const errorHandler = (error, request, response, next) => {
  console.error(error.message);

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' });
  }

  next(error);
};

// this has to be the last loaded middleware.
app.use(errorHandler);

// ------------------------------------------------------------

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Example app listening on port ${port}!`));

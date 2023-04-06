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
// mongoose
// Reel schema
const reelSchema = require('./schemas/reel');

// Reel model
const { reelModel } = reelSchema;

// Reel document creator
const { reelDocumentCreator } = reelSchema;

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
// API

// Reel API

const responseObj = (id, code, message, reel) => {
  // console.log(message);

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
  console.log('Hello');
  const { id } = request.params;

  // In context of get request, the state codes have following meaning:
  // 1 -> Reel was found (intended behaviour)
  // 2 -> Reel was not found in database (inteded behaviour)
  // 0 -> server error

  reelModel.findById(id)
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

app.get('/api/reels', handleIdsValidation, async (request, response) => {
  const { ids } = request.query;
  const idArray = ids.split(',');

  // In context of get request, the state codes have following meaning:
  // 1 -> Reel was found (intended behaviour)
  // 2 -> Reel was not found in database (inteded behaviour)
  // 0 -> server error

  const acknowledgments = idArray.map((id) => new Promise((resolve, reject) => {
    reelModel.findById(id).then((reel) => {
      if (reel) {
        resolve(responseObj(id, 1, 'Reel was found', reel));
      } else {
        resolve(responseObj(id, 2, 'Reel was not found', null));
      }
    }).catch((error) => {
      resolve(responseObj(id, 0, error.message, null));
    });
  }));

  response.json(await Promise.all(acknowledgments));
});

app.post('/api/reel', (request, response) => {
  const { body } = request;

  const reel = reelDocumentCreator(body);

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
    }).catch((error) => {
      console.log(error);

      response.status(400).json(responseObj(null, 0, error.message, null));
    });
});

app.post('/api/reels', async (request, response, next) => {
  const reels = request.body;

  // In context of post request, the state codes have following meaning:
  // 1 -> Reel was saved (intended behaviour)
  // 2 -> Reel was not saved (inteded behaviour)
  // 0 -> server error

  const acknowledgments = reels.map((reel) => new Promise((resolve, reject) => {
    try {
      const reelToSave = reelDocumentCreator(reel);

      reelToSave.save().then((savedReel) => {
        if (reelToSave === savedReel) {
          resolve(responseObj(savedReel.id, 1, 'Reel was saved', savedReel));
        } else {
          resolve(responseObj(null, 2, 'Reel was not saved in database', null));
        }
      }).catch((error) => {
        resolve(responseObj(null, 0, error.message, null));
      });
    } catch (error) {
      resolve(responseObj(null, 0, error.message, null));
    }
  }));

  response.json(await Promise.all(acknowledgments));
});

app.delete('/api/reel/:id', (request, response) => {
  // This conversion here is necessary
  const id = new mongoose.Types.ObjectId(request.params.id);

  reelModel.deleteOne(id).then((res) => {
    if (res.deletedCount === 1) {
      response.json(responseObj(id, 1, 'Reel was deleted from database', null));
    } else if (res.deletedCount === 0) {
      response.json(responseObj(id, 2, 'Reel was not found and hence not deleted', null));
    }
  }).catch((e) => {
    response.json(responseObj(id, 0, e.message, null));
  });
});

app.delete('/api/reels', handleIdsValidation, async (request, response, next) => {
  const { ids } = request.query;
  const idArray = ids.split(',');

  // In context of delete request for reel, the state codes have following meaning:
  // 1 -> Reel deletion successfull (intended behaviour)
  // 2 -> Reel was not found in database (inteded behaviour)
  // 0 -> server error

  const acknowledgments = idArray.map((id) => new Promise((resolve, reject) => {
    try {
      // This conversion here is necessary
      const objId = new mongoose.Types.ObjectId(id);

      reelModel.deleteOne(objId).then((res) => {
        if (res.deletedCount === 1) {
          resolve(responseObj(id, 1, 'Reel was deleted', null));
        } else {
          resolve(responseObj(id, 2, 'Reel was not found and hence not deleted', null));
        }
      }).catch((error) => {
        resolve(responseObj(id, 0, error.message, null));
      });
    } catch (error) {
      resolve(responseObj(id, 0, error.message, null));
    }
  }));

  response.json(await Promise.all(acknowledgments));
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

  reelModel.findByIdAndUpdate(id, updationToReel, { new: true }).then((newReel) => {
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

// There is no hot reloading. If you modify the code while the application is running then the changes 
// will not be reflected

require('dotenv').config()

const express = require("express");
const morgan = require('morgan')
const mongoose = require('mongoose')

// mongoose models
const Reel = require('./models/reel')


const app = express();

// ------------------------------------------------------------
// Middlewares

// The middleware below serves the frontend to the client. Basically it serves the index.js file in the 
// build folder and executes it
app.use(express.static('build'))

// This middleware converts the data recieved to the server in json format
app.use(express.json())

// This one logs any request made to the server
// One important thing to note. it only logs those request which have a response.
app.use(morgan(function (tokens, req, res) {
  if(tokens.method(req, res) === "POST") {
      return [
          tokens.method(req, res),
          tokens.url(req, res),
          tokens.status(req, res),
          tokens.res(req, res, 'content-length'), '-',
          tokens['response-time'](req, res), 'ms',
          JSON.stringify(req.body)
      ].join(' ');
  }

  return [
    tokens.method(req, res),
    tokens.url(req, res),
    tokens.status(req, res),
    tokens.res(req, res, 'content-length'), '-',
    tokens['response-time'](req, res), 'ms'
  ].join(' ')
}))
// ------------------------------------------------------------

// ------------------------------------------------------------
// mongoDB code below

const url = process.env.MONGODB_URI

console.log("Connecting to MongoDB");

mongoose.connect(url).then((_) => {
    console.log("Connection successfull")
}).catch((e) => {
    console.log("Error connecting to MongoDB:", e.message)
});

// ------------------------------------------------------------


// ------------------------------------------------------------
// API

//Reel API

app.get('/api/reel/:id', (request, response, next) => {

  let id = request.params.id;

  Reel.findById(id)
    .then(reel => {
      if(reel) {
        response.json(reel)
      } else {
        response.status(404).end();
      }
    }).catch((e) => {
      next(e)
    })

})

app.post('/api/reel', (request, response, next) => {

  const body = request.body

  const reel = new Reel({
    gsm: body.gsm,
    size: body.size,
    shipment: body.shipment,
    shade: body.shade,
    annotations: body.annotations,
    bf: body.bf,
    sold: body.sold,
    soldTo: body.soldTo,
    soldDate: body.soldDate
  })

  reel.save()
    .then((newReel) => {
      // Unlike findById method which can resolve with null value, save method only resolves, with the saved document, 
      // when the document is actually saved in database
      if(newReel === reel){
          console.log(`Added new reel`, newReel);
          response.json(newReel)
      }
    }).catch((e) => {
      next(e)
    })

})

app.delete('/api/reel/:id', (request, response, next) => {

  const id = new mongoose.Types.ObjectId(request.params.id)

  Reel.deleteOne(id).then((res) => {
      if(res.deletedCount === 1) {
          console.log("Deletion successfull")
      } else if(res.deletedCount === 0) {
        console.log("Document to be deleted was not in the database")
      }

      response.status(204).end()
  }).catch((e) => {
      next(e)
  })

})

app.put('/api/reel/:id', (request, response, next) => {

  const body = request.body;

  // This conversion in not necessary because mongoose do implicit type casting to match 
  // to the schema.
  const id = new mongoose.Types.ObjectId(request.params.id)

  const updationToReel = {
    gsm: body.gsm,
    size: body.size,
    shipment: body.shipment,
    shade: body.shade,
    annotations: body.annotations,
    bf: body.bf,
    sold: body.sold,
    soldTo: body.soldTo,
    soldDate: body.soldDate
  }

  Reel.updateOne({_id: id}, updationToReel).then((res) => {
    if(res.modifiedCount === 1 && res.matchedCount ===1){
      console.log("Document was found and updated")
    } else {
      console.log("Something's went wrong. check it!")
    }

    response.status(204).end()
  }).catch((e) => {
    next(e)
  })

})

// ------------------------------------------------------------

// ------------------------------------------------------------
// Error handling for reel api

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } 

  next(error)
}

// this has to be the last loaded middleware.
app.use(errorHandler)

// ------------------------------------------------------------

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Example app listening on port ${port}!`));
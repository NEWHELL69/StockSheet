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

app.get('/api/reel/:id', (request, response) => {

  let id = request.params.id;

  Reel.findById(id).then((reel) => {
      response.json(reel)
  }).catch((e) => {
      console.log(e)
  })
})

app.post('/api/reel', (request, response) => {

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

  reel.save().then((newReel) => {
      if(newReel === reel){
          console.log(`Added new reel`, newReel);
          response.json(newReel)
      }    
  })

})

app.delete('/api/reel/:id', (request, response) => {

  const id = new mongoose.Types.ObjectId(request.params.id)

  Reel.deleteOne(id).then((obj) => {
      if(obj.acknowledged) {
          console.log("Deletion successfull")
      }
  }).catch((e) => {
      console.log(e)
  })

  response.status(204).end()
})

app.put('/api/reel/:id', (request, response) => {

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
    if(res.acknowledged){
      response.status(204).end()
    }
  }).catch((e) => {
    console.log(e)
  })

})

// ------------------------------------------------------------

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Example app listening on port ${port}!`));
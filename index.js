require('dotenv').config()

const express = require("express");
const morgan = require('morgan')
const mongoose = require('mongoose')

// mongoose models
const Reel = require('./models/reel')
console.log(Reel)


const app = express();

// If you change the directory, which serves the frontend, below then reloading the running
// application would respond with 404 error and won't reflect the change until aplication is restarted.
app.use(express.static('build'))
app.use(express.json())

// ------------------------------------------------------------
// The code below logs any request made to the server

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

console.log(typeof url)

console.log("Connecting to MongoDB");

mongoose.connect(url).then((_) => {
    console.log("Connection successfull")
}).catch((e) => {
    console.log("Error connecting to MongoDB:", e.message)
});

// ------------------------------------------------------------


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
  })

  reel.save().then((newReel) => {
      if(newReel === reel){
          console.log(`Added new reel`, newReel);
          response.json(newReel)
      }    
  })

})


const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Example app listening on port ${port}!`));
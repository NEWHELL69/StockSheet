const express = require("express");
var morgan = require('morgan')

const app = express();

// If you change the directory, which serves the frontend, below then reloading the running
// application would respond with 404 error and won't reflect the change until aplication is restarted.
app.use(express.static('build'))

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

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Example app listening on port ${port}!`));
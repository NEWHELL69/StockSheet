/* eslint-disable no-param-reassign */
const mongoose = require('mongoose');

// Reel id is created by mongoose when we save a document
const reelSchema = new mongoose.Schema({
  gsm: Number,
  size: Number,
  date: { type: Date, default: Date.now },
  shipment: String,
  shade: String,
  annotations: String,
  bf: Number,
  sold: Boolean,
  soldTo: { type: String, default: null },
  soldDate: { type: Date, default: null },
});

reelSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

const reelModel = mongoose.model('Reel', reelSchema);

// The first argument to the function below dictates the collection to put new documents in.
// This is fragile
module.exports = reelModel;

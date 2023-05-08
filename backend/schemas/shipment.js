/* eslint-disable no-param-reassign */
const mongoose = require('mongoose');

// Reel id is created by mongoose when we save a document
const shipmentSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  filters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Filter' }],
  truckNumber: String,
  billTo: String,
});

shipmentSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

// The first argument to the function below dictates the collection to put new documents in.
// This is fragile
const shipmentModel = mongoose.model('Shipment', shipmentSchema);

module.exports = shipmentModel;

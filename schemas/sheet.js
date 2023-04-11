/* eslint-disable no-param-reassign */
const mongoose = require('mongoose');

// Reel id is created by mongoose when we save a document
const sheetSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  filters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Filter' }],
  shipments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' }],
});

sheetSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

// The first argument to the function below dictates the collection to put new documents in.
// This is fragile
const sheetModel = mongoose.model('Sheet', sheetSchema);

module.exports = sheetModel;

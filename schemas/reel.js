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

const reelDocumentCreator = (ReelPOJO) => new reelModel({
  gsm: ReelPOJO.gsm,
  size: ReelPOJO.size,
  shipment: ReelPOJO.shipment,
  shade: ReelPOJO.shade,
  annotations: ReelPOJO.annotations,
  bf: ReelPOJO.bf,
  sold: ReelPOJO.sold,
  soldTo: ReelPOJO.soldTo,
  soldDate: ReelPOJO.soldDate,
});

// The first argument to the function below dictates the collection to put new documents in.
// This is fragile
exports.reelModel = reelModel;
exports.reelDocumentCreator = reelDocumentCreator;

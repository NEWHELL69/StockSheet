/* eslint-disable no-param-reassign */
const mongoose = require('mongoose');

const filterOptionsSchema = new mongoose.Schema({
  gsm: Number,
  size: Number,
  shade: String,
  bf: Number,
}, { _id : false });

// Reel id is created by mongoose when we save a document
const filterSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  reels: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Reel' }],
  filterOptions: { type: filterOptionsSchema, default: {} },
});

filterSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

// The first argument to the function below dictates the collection to put new documents in.
// This is fragile
const filterModel = mongoose.model('Filter', filterSchema);

module.exports = filterModel;

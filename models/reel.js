const mongoose = require('mongoose')

// Reel id is created by mongoose when we save a document
const ReelSchema = new mongoose.Schema({
    gsm: Number,
    size: Number,
    date: { type: Date, default: Date.now },
    shipment: String,
    shade: String,
    annotations: String,
    bf: Number,
    sold: Boolean,
    soldTo: String,
    soldDate: { type: Date, default: null }
})

ReelSchema.set('toJSON', {
    transform: (document, returnedObject, options) => {
        returnedObject.id = returnedObject._id.toString()
        delete returnedObject._id
        delete returnedObject.__v
    }
})

// The first argument to the function below dictates the collection to put new documents in.
// This is fragile
module.exports = mongoose.model('Reel', ReelSchema)

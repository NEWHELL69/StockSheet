const mongoose = require('mongoose')

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
    soldTo: String,
})

reelSchema.set('toJSON', {
    transform: (document, returnedObject, options) => {
        returnedObject.id = returnedObject._id.toString()
        delete returnedObject._id
        delete returnedObject.__v
    }
})

module.exports = mongoose.model('Reel', reelSchema)

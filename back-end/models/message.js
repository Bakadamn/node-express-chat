const mongoose = require('mongoose');

const messageSchema = mongoose.Schema({
  message: { type: String, required: true },
  user: {type : String, required: true},
  timeStamp: {
    hours: {
        type: Number, required: true, min: 0, max: 23
    },
    minutes: {
        type: Number, required: true, min: 0, max: 59
    },
    seconds: {
        type: Number, required: true, min: 0, max: 59
    }
}
});

module.exports = mongoose.model('message', messageSchema);
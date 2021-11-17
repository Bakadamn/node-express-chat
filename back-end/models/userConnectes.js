const mongoose = require('mongoose');

const userschema = mongoose.Schema({
  login: { type: String, required: true }
});

module.exports = mongoose.model('UserConnectes', userschema);
const mongoose = require('mongoose');

const userschema = mongoose.Schema({
  login: { type: String, required: true },
  mdp: { type: String, requirde: true}
});

module.exports = mongoose.model('User', userschema);
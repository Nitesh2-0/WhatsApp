const mongoose = require('mongoose'); 

const messageShema = mongoose.Schema({
  sender:String, 
  receiver:String,
  data:String,
})

module.exports = mongoose.model('message',messageShema);
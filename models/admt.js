//var moment = require('moment');
var mongoose = require("mongoose");
//var passportLocalMongoose = require("passport-local-mongoose");
 var MEPSchema = new mongoose.Schema({
    from:String,
    image:String,
    text:String,
    createdAt:String
});
 //CNSSchema.plugin(passportLocalMongoose)
 module.exports = mongoose.model("MEPChat", MEPSchema);
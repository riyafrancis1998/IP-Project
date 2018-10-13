var express = require("express");

var fs = require('fs');
var FileReader=require("filereader");
var moment = require("moment");
var te=require ('text-encoding');
//var encoding=te.encoding;
const { StringDecoder } = require('string_decoder');
const decoder = new StringDecoder('utf8');
var bodyParser  = require("body-parser");
var middleware = require("./middleware");
var flash=require("connect-flash");
var http=require("http");
var multer=require("multer");

var uploads = multer({ dest: 'uploads/' })
var app=express();
//const {MongoClient, ObjectID} = require('mongodb');
var mongoose=require("mongoose");
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("Connected");
});
var session = require("express-session");
var passport    = require("passport");
var LocalStrategy = require('passport-local').Strategy;
var User = require("./models/user");
var collection;
const MongoClient = require('mongodb').MongoClient;
app.use(require("express-session")({
  secret: "Once again Rusty wins cutest dog!",
  resave: false,
  saveUninitialized: false
}));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(passport.initialize());
app.use(flash());
app.use(passport.session());

app.use(function(req, res, next){
  res.locals.currentUser = req.user;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});
//passport.use(new LocalStrategy(User.authenticate()));
passport.use('local',new LocalStrategy(
    function(username, password, done) {
        //console.log(username);
        //console.log(password);
      User.findOne({ 'email': username }, function(err, user) {
         // console.log(user);
          //console.log(user.username);
          //console.log(user.password);
        if (err) { return done(err); }
        if (!user) {
          return done(null, false, { message: 'Incorrect username.' });
        }
        if (user.password!=password) {
          return done(null, false, { message: 'Incorrect password.' });
        }
        return done(null, user);
      });
    }
  ));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

/*

));*/
const dbName = 'myproject';
mongoose.connect("mongodb://localhost:27017/ProjectApp", { useNewUrlParser: true });
// Use connect method to connect to the server
//MongoClient.connect(url, function(err, client) {
  //assert.equal(null, err);
  //console.log("Connected successfully to server");
 
  //const db = client.db(dbName);
  //collection = db.collection('documents');
  //client.close();
//});
//var url="mongodb://localhost:27017/ProjectApp";
/*MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    console.log("Reached");
    var userCollection =db= mongo.collection('user');
    dbo = db.db("mydb");
   // console.log(dbo);
    dbo.createCollection("customers", function(err, res) {
        console.log("collection created")
        
      if (err) throw err;
      db.close();
    });
 // });*/
const socketIO=require("socket.io");
var port=process.env.PORT || 3000;
var server=http.createServer(app);
var io=socketIO(server);

const {generateMessage, generateLocationMessage, generateFileMessage} = require('./server/utils/message');
const {isRealString} = require('./server/utils/validation');
const {Users} = require('./server/utils/users');
app.set("view engine","ejs");
//mongoose.connect("mongodb://localhost:27017/ProjectApp");
app.use(express.static(__dirname + '/views'));
 
var User = require("./models/user.js");
var ADMTChat = require("./models/admt");
var IOTChat = require("./models/iot.js")
var IPChat = require("./models/ip.js")
var CNSChat = require("./models/cns.js")
/*app.use(methodOverride("_method"));
*/
app.get("/",function(req,res){
        
    res.render("home")

});
app.get("/login",function(req,res){
    res.render("login");
});
app.get("/chat",function(req,res){
  res.render("chat");
});
app.get("/signup",function(req,res){
    res.render("signup");
});
app.get("/index",middleware.isLoggedIn,function(req,res){
    res.render("index");
});

app.use(multer({ dest:__dirname + '/views/uploads/'}).any('image'));
app.post("/signup",function(req,res){
  User.find({ 'username': req.body.userid,'email':req.body.email }, function(err, user) {

      if (err) {

          console.log('Signup error');
          return done(err);
      }
      //if user found.
      if (user.length!=0) {
          res.redirect("/signup");
      }
  var username = req.body.userid;
  User.findOne({ 'email': username }, function(err, user){
    console.log("Reached");
    if(user)
    {
      req.flash("error","User with this Userid Already exists");
      res.redirect("/signup");
    }
  }
); 
  var email = req.body.email;
  var isAdmin = req.body.isAdmin;
  var imgname = req.files[0].filename;
  if(isAdmin==="Faculty")
  {
    console.log("Facultyy")
    var subject = req.body.subject;
    var password = req.body.pwd;
    var newUser = {username: username, email: email,isAdmin:isAdmin,subject:subject,imgname:imgname,password:password}
  }
  else{
    var password = req.body.pwd;
    var newUser = {username: username, email: email,isAdmin:isAdmin,imgname:imgname,password:password}
  }
  //var age = req.body.age;
 


  User.create(newUser, function(err, user){
      if(err){
          console.log(err);
      } else {
         user.save();
         res.redirect("/");
      }
  });
});
  });
  app.post(
      '/login',
      passport.authenticate('local', {
        failureRedirect: '/login'
      }), (req, res) => {
         // console.log(req.body);
          var email=req.body.username
         // console.log(email);
      User.findOne({ 'email': email }, function(err, user){
        if(user.isAdmin==="Faculty"){
          var subject=user.subject;
          res.render("index2",{
            username:user.username,
            file:`uploads/${user.imgname}`,
            subject:subject.toUpperCase()
        });
        }
        else{
          res.render("index",{
            username:user.username,
            file:`uploads/${user.imgname}`
        })
        }
         
      });
      });
        var users = new Users();

       // app.use(express.static(publicPath));
        
        io.on('connection', (socket) => {
          console.log('New user connected');
          
          socket.on('join', (params, callback) => {
             
            if (!isRealString(params.name) || !isRealString(params.room)) {
              return callback('Name and room name are required.');
            }
            //console.log(params);
            socket.join(params.room);
            users.removeUser(socket.id);

            users.addUser(socket.id, params.name,params.image, params.room);
        
            io.to(params.room).emit('updateUserList', users.getUserList(params.room));
            if(params.room==="CNS"){
              CNSChat.find({}.toArray,function(err,docs){
                if (err)
                    console.log('error occured in the database');
                io.to("CNS").emit("chatHistory",docs)
                //console.log("Event emmited")
            });
            }
            else if(params.room==="IOT"){
              IOTChat.find({}.toArray,function(err,docs){
                if (err)
                    console.log('error occured in the database');
                io.to("IOT").emit("chatHistory",docs)
                //console.log("Event emmited")
            });
            }
            else if(params.room==="ADMT"){
              ADMTChat.find({}.toArray,function(err,docs){
                if (err)
                    console.log('error occured in the database');
                io.to("ADMT").emit("chatHistory",docs)
                //console.log("Event emmited")
            });
            }
            else {
              IPChat.find({}.toArray,function(err,docs){
                if (err)
                    console.log('error occured in the database');
                io.to("IP").emit("chatHistory",docs)
                //console.log("Event emmited")
            });
            }
            socket.emit('newMessage', generateMessage('Admin', 'uploads/1cc462d02afc62a23915bb4b407b0895','Welcome to the chat app'));
            socket.broadcast.to(params.room).emit('newMessage', generateMessage('Admin','uploads/1cc462d02afc62a23915bb4b407b0895', `${params.name} has joined.`));
            callback();
          });
        
          socket.on('createMessage', (message, callback) => {
            var user = users.getUser(socket.id);
            console.log(user)
            if (user && isRealString(message.text)) {
              
              io.to(user.room).emit('newMessage', generateMessage(user.name,user.image, message.text));
            }
            if(user.room==="CNS"){
              var newMessage = {from:user.name,image:user.image,text:message.text,createdAt:moment(message.createdAt).format('h:mm a')}  
            CNSChat.create(newMessage, function(err,msg){
                if(err){
                    console.log(err);
                } else {
                   msg.save();
                   //res.redirect("/");
                }
            });
            }
            else if(user.room==="IOT"){
              var newMessage1 = {from:user.name,image:user.image,text:message.text,createdAt:moment(message.createdAt).format('h:mm a')}  
            IOTChat.create(newMessage1, function(err,msg1){
                if(err){
                    console.log(err);
                } else {
                  console.log(msg1);
                   msg1.save();
                   //res.redirect("/");
                }
            });
            }
            else if(user.room==="ADMT")
            {
              var newMessage2 = {from:user.name,image:user.image,text:message.text,createdAt:moment(message.createdAt).format('h:mm a')};  
           //   console.log(newMessage2)
            ADMTChat.create(newMessage2, function(err,msg2){
                if(err){
                    console.log(err);
                } else {
                  console.log(msg2)
                   msg2.save();
                   //res.redirect("/");
                }
            });
            }
            else{
              var newMessage3 = {from:user.name,image:user.image,text:message.text,createdAt:moment(message.createdAt).format('h:mm a')}  
            IPChat.create(newMessage3, function(err,msg3){
                if(err){
                    console.log(err);
                } else {
                   msg3.save();
                   //res.redirect("/");
                }
            });
            }
            callback();
          });
        
          socket.on('createLocationMessage', (coords) => {
            var user = users.getUser(socket.id);
        
            if (user) {
              io.to(user.room).emit('newLocationMessage', generateLocationMessage(user.name,user.image,coords.latitude, coords.longitude));  
            }
          });var app=express();
        
          //socket.on('createFileMessage', (message) => {
            socket.on('base64 file', function (msg) {
              var user = users.getUser(socket.id);
             // console.log('received base64 file from' + msg.username);
              //socket.username = msg.username;
              // socket.broadcast.emit('base64 image', //exclude sender
              //io.sockets.emit('newFileMessage',  //include sender
            if (user) {
                    io.to(user.room).emit('newFileMessage', generateFileMessage(user.name,user.image,msg.file,msg.fileName));  
                  
                };
              
            });
            
           // var reader = new FileReader();
            //console.log(file)
            //const buf2 = Buffer.from('file', 'hex');
              // This tells that the first argument is encoded as a hexadecimal string

            //let str = decoder.write(message)
            //console.log(str)
            //var fileName = decoder.write(message.fileName);
           // console.log(new_file)
           //var user = users.getUser(socket.id);
           //nameF=`${fileName}.txt`
           //fs.writeFile('file.txt',str, function (err) {
            //if (err) throw err;
            //console.log('Saved!');
         // });
           
           socket.on('disconnect', () => {
            var user = users.removeUser(socket.id);
        
            if (user) {
              io.to(user.room).emit('updateUserList', users.getUserList(user.room));
              io.to(user.room).emit('newMessage', generateMessage('Admin',`${user.image}`,`${user.name} has left.`));
            }
          });
        });

  
  app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/login");
       });
        
server.listen(port,function(req,res){
    console.log("Server is listening!");
});
require('express-async-errors');
const express = require('express');
const winston = require('winston');
require('winston-mongodb');
const mongoose = require('mongoose');
const database = require('./database/connection');
const config = require('config');
const logErrors = require('./middlewares/log-errors');
const cors = require('cors');
const users = require('./routes/users');
const story = require('./routes/story');


const app = express();
app.use(cors());
app.use(express.json())

if(!config.get('jwtPrivateKey')){
    console.log('JwtPrivateKey is not set');
    process.exit(1);
}

// winston.add(winston.transports.Console,{});
winston.add(winston.transports.File,{filename:'logfile.log'})
winston.add(winston.transports.MongoDB,{db:'mongodb://localhost:27017/babystep'});

app.use('/api/users/',users);
app.use(logErrors);
app.use('/api/admin/story',story);
const forgot_password = require('./forgotpassword/forgotpassword.route');
app.use('/api/forgot-password',forgot_password);



mongoose.connect(database.connectionString, { useNewUrlParser: true },(error)=>{
    if(!error){
        console.log('Connected to mongodb..');
    }else{
        console.log('Mongo Error: ',error);
    }
})

var port = process.env.PORT || 3000;
app.listen(port,(err)=>{
    if(!err){
        console.log(`Listening on port ${port}`);
    }
})
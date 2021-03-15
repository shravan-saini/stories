const winston = require('winston');


module.exports = function(error,req,res,next){
    //TODO:: log the exceptions
    winston.log('error',error.message,error);
    res.status(500).send({success:false,message:'Something faild.async'})
} 
const jwt = require('jsonwebtoken');
const config = require('config');
module.exports = function(req,res,next){
    var token = req.header('x_auth_token');
    if(token){
       
        try{
            var user =  jwt.verify(token,config.get('jwtPrivateKey'),{maxAge:24*60*60})
            if(user){
                req.user = user;
                jwt.verify
                console.log('payload',user);
                next();
            }
        }catch(error){
            res.send({success:false,message:'Token Invalid'})
        }
        
        
      
    }else{
        res.send({success:false,message:'Token Not provided.'})
    }
}
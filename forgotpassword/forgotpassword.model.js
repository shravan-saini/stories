const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwtToken = require('jsonwebtoken');
const config = require('config');
var ObjectId = require('mongodb').ObjectID;
const nodeMailer = require('nodemailer');
const { reject } = require('lodash');


var forgotPasswordSchema = new mongoose.Schema({
    userId:{
        type:String,
        required:true
    },
    token:{
        type:String,
        required:true
    },
    createdAt:{
        type:Date,
        required :true,
        default:new Date(),
    },

})

const forgotPassword = mongoose.model('forgot_password',forgotPasswordSchema);

module.exports.createJWT = (userName,UserEmail,UserId)=>{
    return jwtToken.sign({UserEmail:UserEmail,userId:UserId,userName:userName},config.get('jwtPrivateKey'),{
        expiresIn:'1h'
    });
}
module.exports.sendResetPasswordMail = (token,email,username,requestHeaders,userId)=>{
    var passwordResetLink = 'localhost:4200/reset-password/'+token;
    console.log('token',token)
    var smtpTransport = nodeMailer.createTransport({  
        service: 'gmail', 
        secure:false,
         
        auth: {  
          user: 'shravansaini94@gmail.com',  
          pass: 'googlegmail32%'  
        }  
      });
    console.log('token2',smtpTransport)
      
      const mailOptions = {  
        to: email,  
        from: 'shravansaini94@gmail.com',  
        subject: 'Romantic Stories Password Reset',  
        text: 'Hi '+username+',\n\n'+'You are receiving this because you  have requested the reset of the password for your account.\n\n' +  
            'Please click on the following link, or paste this into your browser to complete the process:\n\n' +  
            'http://' + requestHeaders.host + '/reset-password/' + token + '\n\n' +  
            'If you did not request this, please ignore this email and your password will remain unchanged.\n'  
    };  
    console.log('token3',mailOptions)
    let newForgotPassword = new forgotPassword({
        userId:userId,
        token:token

    })
    return new Promise((resolve,reject)=>{

        newForgotPassword.save()
        .then((result)=>{
                smtpTransport.sendMail(mailOptions, function(err) {                 
                    console.log("HI:",err);  
                    resolve({status : 'success', message : 'An e-mail has been sent to ' + email + ' with further instructions.'});              
                });  
        })
        .catch(error=>{
            reject({error:true,message:'Something went wrong.',errorObj:error})
        })
    })
   
    
      
}

module.exports.validateToken = (token)=>{
    if(token){
       console.log('token--',token);
        try{
            var user =  jwtToken.verify(token,config.get('jwtPrivateKey'))
            if(user){
               return user;
            }
        }catch(error){
           return {error:true,message:'This link has been expired.'}
        }
        
        
      
    }else{
        return {success:false,message:'You are not autherized to change password.'}
    }
}
module.exports.deleteExistingForgotPasswordRequests = function(userId){
    return new Promise((resolve,reject)=>{
        return forgotPassword.remove({userId:userId},(error,response)=>{
            resolve(response);  
        })
    })
   
    
}
module.exports.checkIfForgotPasswordRequestExists =  function(userId,token){
    return new Promise((resolve,reject)=>{
        return forgotPassword.find({userId:userId,token:token},(error,response)=>{
            resolve(response);  
        })
    })
   
    
}





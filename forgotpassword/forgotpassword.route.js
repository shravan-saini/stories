const Router = require('express').Router()
const { request, response } = require('express');
const User = require('../models/users')
const ForgotPassword = require('./forgotpassword.model');

Router.get('/:userEmail', (request,response)=>{
    var userEmail = request.params.userEmail;
    if(!userEmail){
        response.send({
            error:true,
            message:'Email Id required.'
        })
        return;
    }
    User.getUserByEmail(userEmail)
    .then(async(user)=>{
        console.log('get User',user);
        ForgotPassword.deleteExistingForgotPasswordRequests(user._id)
        .then(existingRequestsDeleted=>{
            const jwtToken = ForgotPassword.createJWT(user.user_name,user.user_email,user._id);
            ForgotPassword.sendResetPasswordMail(jwtToken,user.user_email,user.user_name,request.headers,user._id)
            .then(resp=>{
                   response.send({
                       error:false,
                       message:'Password reset link has been sent.'
                   })
    
            })
            .catch(error=>{
                
                response.send(error)
            })      
        })
        .catch(error=>{
            response.send({error:true,message:'Something went wrong',errorObj:error})
        })
      

    })
    .catch(error=>{
        console.log('errorrrr',error)
        response.send({
            error:true,
            message:'Your are not registered with this email id.'
        })
    })
})
Router.post('/reset',async (request,response)=>{
    let jwtToken = request.body.token;
    let password = request.body.password;
    if(!jwtToken){
        response.send({
            error:true,
            message:'You are not autherized to change the password.'
        })
    }
    if(!password){
        response.send({
            error:true,
            message:'Password is required.'
        })
    }
   
    let user =  ForgotPassword.validateToken(jwtToken);
    console.log('token user',user);
    if(user.error){
        response.send(user);
        return;
    }
    ForgotPassword.checkIfForgotPasswordRequestExists(user.userId,jwtToken)
    .then(existingRequest=>{
        if(existingRequest.length>0){
            User.changePassword(user, password)
            .then(resp=>{
                ForgotPassword.deleteExistingForgotPasswordRequests(user.userId)

                response.send({
                    error:false,
                    message:'Password Changed. Please login with new password.'
                })
            })
            .catch(error=>{
                response.send({
                    error:true,
                    message:'Something went wrong'
                })
            })
        }else{
            response.send({error:true,message:'This link is expired. Please send forgot password request again.'})
        }
        
    })
    .catch(error=>{
        response.send({error:true,message:'This link is expired. Please send forgot password request again.'})
    })
    
})




module.exports = Router;
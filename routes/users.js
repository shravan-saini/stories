const express = require('express');
const Users = require('../models/users');
const router = express.Router();
const bcrypt = require('bcrypt');
const lodash = require('lodash');
const auth = require('../middlewares/auth');
const questions = require('../models/story')

const _ = require('lodash')

router.post('/register',(req,res)=>{
    Users.getUserByEmail(req.body.user_email)
    .then(user=>{
        console.log('register user-',user)
        if(user){
            res.send({error:true,message:'Your are already registered with. Please login.'})
            return;
        }else{
            Users.saveUser(req.body)
            .then((user)=>{
                res.send({success:true,data:lodash.pick(user,['_id','user_name','user_email'])});
            })
            .catch((error)=>{
                res.send(error);
            })
        }
    })
    .catch(error=>{
        console.log('register user-',error)
        res.send({error:true,message:'Something went wrong.'})

    })
    
})

router.post('/login',(req,res)=>{
    console.log('xxxxxxxxxxxxxxxxxxxxxxxxxx')
   const valid =  Users.validateLogin(req.body);
   if(!valid){
       res.status(200).send({success:false,message:"Invalid email or password1"})
   }else{
       Users.getUserByEmail(req.body.user_email)
       .then((user)=>{
            bcrypt.compare(req.body.password,user.password)
            .then((matched)=>{
                if(matched){
                    res.send({
                        'success':true,
                        email:user.user_email,
                        name:user.user_name,
                        userId:user._id,
                        token:user.createJwtToken(),
                        phoneNumber:user.user_number,
                        favourites:user.favourites,
                        viewed:user.viewed
                    })
                }else{
                    res.status(200).send({success:false,message:"invalid email or password"})
                }
            })
            
       })
       .catch((error)=>{
            res.status(400).send({success:false,message:"You are not registered with us.",error:error})
       })
   }
})

router.get('/me',auth,(req,res)=>{
    Users.getUserByEmail(req.user.user_email)
       .then((user)=>{
         
            res.send(user)
       })
       .catch((error)=>{
            res.send({success:false,msg:'error',error:error})
       })
})

router.get('/getPreparedQuiz',auth,(req,res)=>{
    console.log(req.query)
    if(!req.query.language){
        res.send({success:false,message:'Provide quiz language'})
    }
    if(!req.query.category){
        res.send({success:false,message:'Provide quiz category'})
    }
    questions.getquiz(req.query)
    .then(response=>{
        res.send(response);
    })
    .catch(error=>{
        res.send({success:false,error:error,message:'Something went wrong'})
    })
}) 



module.exports = router;
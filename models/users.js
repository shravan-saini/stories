const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwtToken = require('jsonwebtoken');
const config = require('config');
var ObjectId = require('mongodb').ObjectID;
const { response } = require('express');

const userSchema = new mongoose.Schema({
    user_name:{
        type:String,
        minlength:3,
        maxlength:50,
        required:true
    },
    user_email:{
        type:String,
        minlength:3,
        maxlength:50,
        required:true,
        validate:function(){
            var isValid=true;
            return isValid;
        }
    },
    user_number:{
        type:Number,
        minlength:10,
        maxlength:10,
        required:true,
    },
    password:{
        type:String,
        minlength:10,
        maxlength:255,
        required:true,
    },
    favourites:{
        type:Array,
        required:false,
        default:[]
    },
    viewed:{
        type:Array,
        required:false,
        default:[]
    }
    // gender:{
    //     type:String,
    //     trim:true,
    //     enum:["Male","Female"],
    //     default:null
    // }
})
userSchema.methods.createJwtToken = function(){
    return jwtToken.sign({user_email:this.user_email,userId:this._id,user_name:this.user_name},config.get('jwtPrivateKey'));
}

const Users = mongoose.model('users',userSchema);


module.exports.saveUser = function(user){
    return new Promise((resolve,reject)=>{
        if(user.password){
            bcrypt.genSalt(10,(error,salt)=>{
                if(!error){
                    bcrypt.hash(user.password,salt)
                    .then((hash)=>{
                        user.password = hash;
                        let newUser = new Users(user);
                        console.log('new user',newUser)
                        resolve(newUser.save());
                    })
                    .catch((error)=>{
                        reject({success:false,message:"Unable to generate hash",error:error})
                    })
                }
            })
        }else{
            reject({success:false,message:"Provide password"})
        }
        
    })
}
module.exports.validateLogin = function(login){
    if(!login.user_email || login.user_email.length<5){
        return false;
    }
    if(!login.password || login.password.length<6){
        return false;
    }
    return true;
}
module.exports.getUserByEmail = function(email){
    return new Promise((resolve,reject)=>{
        if(!email){
            reject({success:false,message:"Invalid email"});
        }
        Users.findOne({user_email:email},(error,user)=>{
            if(error){
                reject(error);
            }else{
                resolve(user);
            }
        })
        // .select({password:0})

    })
}
module.exports.getUsersFavourites = function(userId){
    return new Promise((resolve,reject)=>{
        
        Users.findOne({_id:ObjectId(userId)},(error,user)=>{
            if(error){
                reject(error);
            }else{
                resolve(user);
            }
        })
        .select({favourites:1})
    })
}
module.exports.checkLoggedInSession =function(user){
    let currentDate = new Date();
    let createdAt = new Date(user.iat);
    var diff = currentDate.getTime() - createdAt.getTime();
    console.log('diff',createdAt);
    
}
module.exports.addStoryToFavourites = function(storyId,userId){
    console.log('fav-1',storyId,userId)
    return new Promise((resolve, reject)=>{
        Users.updateOne({_id:ObjectId(userId)},{$addToSet:{favourites:storyId}},(error,response)=>{
            console.log('fav-2',error,response)
            if(error){
                reject(error);
            }else{
                resolve(response)
            }
        })
    })
}
module.exports.removeStoryFromFavourites = function(storyId,userId){
    console.log('fav-1',storyId,userId)
    return new Promise((resolve, reject)=>{
        Users.updateOne({_id:ObjectId(userId)},{$pull:{favourites:storyId}},(error,response)=>{
            console.log('fav-2',error,response)
            if(error){
                reject(error);
            }else{
                resolve(response)
            }
        })
    })
}
module.exports.addStoryToViewed = function(storyId,userId){
    console.log('fav-1',storyId,userId)
    return new Promise((resolve, reject)=>{
        Users.updateOne({_id:ObjectId(userId)},{$addToSet:{viewed:storyId}},(error,response)=>{
            console.log('viewed-2',error,response)
            if(error){
                reject(error);
            }else{
                resolve(response)
            }
        })
    })
}
module.exports.getRecentViewesOfUser = function(userId){
    return new Promise((resolve, reject)=>{

        var projection = {
            viewed:1
        };
        Users.findOne({_id:ObjectId(userId)},projection,(error,response)=>{
            console.log('fav-2',error,response) 
            if(error){
                reject(error);
            }else{
                resolve(response.viewed);
            }
        })
        
    })
}
module.exports.changePassword = (user,password)=>{
    return new Promise((resolve, reject)=>{
        bcrypt.genSalt(10,(error,salt)=>{
            if(!error){
                bcrypt.hash(password,salt)
                .then((hash)=>{
                    Users.findOneAndUpdate({_id:ObjectId(user.userId)},{password:hash},(error,response)=>{
                        if(error){
                            reject(error)
                        }else{
                            resolve(response);
                        }
                    })
                })
                .catch((error)=>{
                    reject({success:false,message:"Unable to generate hash",error:error})
                })
            }
        })
    })
    
}
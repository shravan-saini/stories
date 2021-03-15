const express = require('express');
const router = express.Router();
const lodash = require('lodash');

const storyModel = require('../models/story');
const usersModel = require('../models/users');
const auth = require('../middlewares/auth');
const { result } = require('lodash');


router.post('/',auth,(req,res)=>{
    var addedBy = {
        email:req.user.user_email,
        name:req.user.user_name,
        userId:req.user.userId
    }
    req.body.addedBy = addedBy;
    console.log('valid q',req.body)
    let valid = storyModel.validateStory(req.body);
    console.log('valid q',valid)
    
    if(valid==true){
        storyModel.saveStory(req.body,(result,error)=>{
            if(error){
                res.send({success:false,error:error})
            }else{
                res.send({success:true})
            }
        })
        
    }else{

    }
})
router.get('/',(req,res)=>{
    
   console.log('story,query',req.query)
   if(req.query.favourites){
       if(!req.query.userId){
            res.send({error:true,message:'User Id is required'});
            return;
       }
       usersModel.getUsersFavourites(req.query.userId)
       .then(favourites=>{
           console.log('favourites',favourites)
            req.query.storyIds = favourites.favourites;
            storyModel.getStories(req.query)
            .then((result)=>{
                if(result.length>0){
                
                    res.send(result);
                }
                
                
            })
            .catch(error=>{
                res.send({error:true,error:error})
            })
       })
       .catch(error=>{
        res.send({error:error,message:"Can't retrieve user's favourites."});
       })    
   }else{
        storyModel.getStories(req.query)
        .then((result)=>{
            if(result.length>0){
            
                res.send(result);
            }
            
            
        })
        .catch(error=>{
            res.send({error:true,error:error})
        })
   }
    
        
        
        
        
    
})
router.post('/vote/:storyId',auth,(req,res)=>{
    
   
   if(req.params.storyId){
        if(req.body.type && req.body.type=='upvote'){
            storyModel.upvoteStory(req.params.storyId,req.user.userId)
            .then(result=>{
                res.send(result)
               
            })
            .catch(error=>{
                res.send({error:true,error:error})
            })

        }
        if(req.body.type && req.body.type=='remove-upvote'){
            storyModel.downVoteStory(req.params.storyId,req.user.userId)
            .then(result=>{
               
                res.send(result)
            })
            .catch(error=>{
                res.send({error:true,error:error})
            })

        }
   }
    
    
        
    
})

 router.get('/favourite/',auth,(req,res)=>{
    var userId = req.user.userId;
    var favouriteIds = req.query.favouriteIds;
    if(userId ){
        storyModel.getUserFavourites(userId,favouriteIds)
        .then(result=>{
            console.log('result-fav',result)
            // res.send(result)
            res.send(result)
            // if(result && result.nModified == 0){
            //     usersModel.removeStoryFromFavourites(storyId,userId)
            //     .then(result=>{
            //         res.send({success:true})
            //     })
            //     .catch(error=>{
            //         res.send({error:true,error:error})
            //     })
            // }else{
            //     res.send({success:true})
            // }
        })
        .catch(error=>{
            res.send({error:true,error:error})
        })
    }
 })
 router.post('/favourite/:storyId/:userId',auth,(req,res)=>{
    var userId = req.user.userId;
    var storyId = req.params.storyId;
    if(storyId && userId ){
        storyModel.addStoryToFavourites(storyId,userId)
        .then(result=>{
            console.log('result-fav',result)
            // res.send(result)
            res.send({success:true})
           
        })
        .catch(error=>{
            res.send({error:true,error:error})
        })
    }
 })
 router.post('/unFavourite/:storyId/:userId',auth,(req,res)=>{
    var userId = req.user.userId;
    var storyId = req.params.storyId;
    if(storyId && userId ){
        storyModel.removeStoryFromFavourites(storyId,userId)
        .then(result=>{
            console.log('result-unfav',result)
            // res.send(result)
            res.send({success:true})
           
        })
        .catch(error=>{
            res.send({error:true,error:error})
        })
    }
 })
 router.get('/viewed/:storyId',(req,res)=>{
    var userId = req.query.userId;
    var storyId = req.params.storyId;
    if(userId && userId !=null && userId !='null'){
        usersModel.addStoryToViewed(storyId,userId)
        .then(result=>{
            console.log('result-fav',result)
            // res.send(result)
            if(result && result.nModified == 1){
                storyModel.incrementViewCounter(storyId)
                .then(result=>{
                    res.send({success:true})
                })
                .catch(error=>{
                    res.send({error:true,error:error})
                })
            }else{
                res.send({success:true})
            }
        })
        .catch(error=>{
            res.send({error:true,error:error})
        })
    }else{
        storyModel.incrementViewCounter(storyId)
        .then(result=>{
            res.send({success:true})
        })
        .catch(error=>{
            res.send({error:true,error:error})
        })
    }
 })
 router.get('/recentViewed/',auth,(req,res)=>{
    var userId = req.user.userId;
    if(userId ){
        usersModel.getRecentViewesOfUser(userId)
        .then(recentStoryIds=>{
            console.log('recentStoryIds-recent-viewed',recentStoryIds)
            // res.send(result)

            var recentStories = [];
            var loop = function(i){
                if(i<recentStoryIds.length){
                    console.log('story -i',i)
                    storyModel.getStoryById(recentStoryIds[i])
                    .then(story=>{
                        recentStories.push(story);
                        loop(++i);
                        return;
                    })
                    .catch(error=>{
                        loop(++i);
                        return;
                    })

                }
                if(i==recentStoryIds.length){
                    res.send(recentStories)
                }
            }
            if(recentStoryIds && recentStoryIds.length>0){
                recentStoryIds = recentStoryIds.reverse();
             
                loop(0)    
            }else{
                res.send({error:true,message:'No Recent Views'});

            }


            
           
        })
        .catch(error=>{
            res.send({error:true,error:error})
        })
    }
 })
module.exports = router;
const mongoose = require('mongoose');
var ObjectId = require('mongodb').ObjectID;
const storySchema = new mongoose.Schema({
    heading:{
        required:true,
        minlength:10,
        maxlength:350,
        type:String
    },
    story: {
        required:true,
        minlength:100,
        maxlength:50000,
        type:String
    } ,
    
   
    category: {
        required:true,
        
        maxlength:100,
        type:Array
    } ,
    language: {
        required:true,
        minlength:5,
        maxlength:100,
        type:String
    } ,
    images:{
        required:false,
        type:Array,
        default:[]
    },
    addedBy:{
        email:{
            required:true,
            type:String
        },
        name:{
            type:String
        },
        userId:{
            type:String
        }
    },

    createdAt:{
        required:false,
        type:Date,
        default:(new Date()),
        once:true,
    },

    upvotedBy:{
        type:Array,
        required:false,
        default:[],

    },
    downVotedBy:{
        type:Array,
        required:false,
        default:[],
    },
    viewsCounter:{
        type:Number,
        required:true,
        default:0
    }
})
const favouritesSchema = new mongoose.Schema({
    userId:{
        type:String, 
        required:true,

    },
    favourites:{
        type:Array,
        required:true,
        default:[]
    }
    
})
storySchema.methods.getTotalUpvotes = function(){
    return this.upvotedBy.length;
}
storySchema.methods.getTotalDownvotes = function(){
    return this.downVotedBy.length;
}
storySchema.methods.checkIfUpvotedByCurrentUser = function(userId){
    return this.upvotedBy.indexOf(userId)>=0;
}
storySchema.methods.checkIfDownvotedByCurrentUser = function(userId){
    return this.downVotedBy.indexOf(userId)>=0;
}

const storyModel = mongoose.model('stories',storySchema);
const favouritesModel = mongoose.model('favourites',favouritesSchema);

exports.validateStory = (story)=>{
    try{
        let newStory = new storyModel(story)
        return true;
    }catch(e){
        return e;
    }
}
exports.saveStory = (story,callback)=>{
    let newStory = new storyModel(story);
    callback(newStory.save());
}
exports.getStories = (story)=>{
    var where = {
    
    }

    if(story.storyIds && story.storyIds.length>0){
        if(typeof(story.storyIds)=='string'){
            story.storyIds = [story.storyIds]
        }
        let objectIds = [];
        console.log('story.storyIds',story.storyIds);
        story.storyIds.forEach(id=>{
            objectIds.push(ObjectId(id));
        })
        console.log('objectIds',objectIds);
        where._id = {
            '$in':objectIds
        }
    }

    story.page = story.page || 1;
    story.limit =  20
    //  todo  create filters for language, category,story type



    return new Promise((resolve,reject)=>{
        console.log('where',where)
        storyModel.find(where,(error,response)=>{
            // console.log('qqqqqqqqqqqq',error,response)
            if(error){
                reject(error);

            }else{
                if(response){
                    // var newResult =    [];
                    response.forEach((story)=>{
                        story.xyxxx= true;
                    })
                    resolve(response);
                }
               
            }
        })
        .skip((story.page-1)* story.limit)
        .limit(story.limit)
        .select({addedBy:0});
    })
}
exports.getStoryById = (storyId)=>{
    return new Promise((resolve, reject)=>{
        console.log('story ---', storyId)
        storyModel.findOne({_id:ObjectId(storyId)},(error,response)=>{
            if(error){
                reject(error);
            }else{
                resolve(response)
            }
        })
    })
}
exports.upvoteStory = (storyId,userId)=>{
    return new Promise((resolve, reject)=>{
        console.log('story ---', storyId,userId)
        storyModel.findOneAndUpdate({_id:ObjectId(storyId)},{$addToSet:{upvotedBy:userId}},{ new: true },(error,response)=>{
            if(error){
                reject(error);
            }else{
                resolve(response)
            }
        })
    })
}
exports.downVoteStory = (storyId,userId)=>{
    return new Promise((resolve, reject)=>{
        console.log('story ---', storyId,userId)
        storyModel.findOneAndUpdate({_id:ObjectId(storyId)},{$pull:{upvotedBy:userId}},{ new: true },(error,response)=>{
            if(error){
                reject(error);
            }else{
                resolve(response)
            }
        })
    })
}
exports.incrementViewCounter = (storyId)=>{
    return new Promise((resolve, reject)=>{
        storyModel.findOneAndUpdate({_id:ObjectId(storyId)},{$inc:{viewsCounter:1}},(error,response)=>{
            if(error){
                reject(error);
            }else{
                resolve(response)
            }
        })
    })
}
module.exports.addStoryToFavourites = function(storyId,userId){
    console.log('fav-1',storyId,userId)
    return new Promise((resolve, reject)=>{

        // let newFavourites = {
        //     userId:userId,
        //     story

        // )
        storyModel.findById({_id:ObjectId(storyId)},(error,response)=>{
            console.log('fav-2',error,response)
            if(error){
                reject(error);
            }else{
                favouritesModel.findOneAndUpdate({userId:userId},{userId:userId,$addToSet:{favourites:response}},{upsert:true},(error,response)=>{
                    console.log('fav-2',error,response)
                    if(error){
                        reject(error);
                    }else{
                        resolve(response)
                    }
                })
            }
        })
        
    })
}
module.exports.removeStoryFromFavourites = function(storyId,userId){
    console.log('fav-1',storyId,userId)
    return new Promise((resolve, reject)=>{

        favouritesModel.findOneAndUpdate({userId:userId},{userId:userId,$pull:{favourites:{_id:ObjectId(storyId)}}},{upsert:true},(error,response)=>{
            console.log('fav-2',error,response)
            if(error){
                reject(error);
            }else{
                resolve(response)
            }
        })
        
    })
}
module.exports.getUserFavourites = function(userId,favouriteIds){
    console.log('fav-1',userId,favouriteIds)
    return new Promise((resolve, reject)=>{

        // let newFavourites = {
        //     userId:userId,
        //     story

        // )
        var projection = {};
        if(favouriteIds){
            projection["favourites._id"] = 1
        }
        favouritesModel.findOne({userId:userId},projection,(error,response)=>{
            console.log('fav-2',error,response) 
            if(error){
                reject(error);
            }else{
                resolve(response);
            }
        })
        
    })
}




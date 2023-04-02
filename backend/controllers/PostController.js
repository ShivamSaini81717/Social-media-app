
const Post =require("../Models/Post");
const User =require("../Models/User");
const cloudinary=require("cloudinary");

exports.createPost =async(req,res)=>{
try{
  const mycloud =await cloudinary.v2.uploader.upload(req.body.image,{
    folder:"myposts"
  });
 const newPostData ={
    caption:req.body.caption,
    image:{
        public_id:mycloud.public_id,
        url:mycloud.secure_url,
    },
    owner:req.user._id
  };

const post=await Post.create(newPostData);
const user =await User.findById(req.user._id);

 user.posts.unshift(post._id);

await user.save();
res.status(201).json({
   success:true,
   message:"Post created",
});

}catch (error){
    res.status(500).json({
        success:false,
        message:error.message
    })
}
}
// -------------------------------------------------like and Dislike------------------------------
exports.likeAndDislikepost =async(req,res)=>{
try{
    const post =await Post.findById(req.params.id);
// -----------agar id galat ho-------------------
    if(!post){
        return res.status(404).json({
            success:false,
            message:"Post not Found"
        });
    }

    if(post.likes.includes(req.user._id)){
        const index =post.likes.indexOf(req.user._id);
        post.likes.splice(index, 1);
        await post.save();
        return res.status(200).json({
            success:true,
            message:"Post Unliked",
        })
    }else{
        // -------like added-----------
        post.likes.push(req.user._id);
        await post.save();
        return res.status(200).json({
            success:true,
            message:"Post Liked"
        });
    }
}catch(error){
   res.status(500).json({
    success:false,
    message:error.message,
   }) 
}



}


//------------------------------- delete post-------------------------
 exports.deletePost=async(req,res)=>{
    try{
        const post =await Post.findById(req.params.id);
if(!post){
    return res.status(404).json({
        success:false,
        message:"Post not Found"
    })
}
// ---------bs Apni he post delete kr sake-----------
if(post.owner.toString() !==req.user._id.toString()){
    return res.status(401).json({
        success:false,
        message:"Unauthorized"
    })
   }
// -----------cloudinary se image delete krne ke liye-----------
   await cloudinary.v2.uploader.destroy(post.image.public_id);

await post.remove();
//-------- user me se b to delete krnaa hoga ----------
const user=await User.findById(req.user._id);
const index=user.posts.indexOf(req.params.id);
user.posts.splice(index, 1);
await user.save();

res.status(200).json({
    success:true,
    message:"Post Deleted"
})

    }catch(error){
    res.status(500).json({
    success:false,
    message:error.message,
})
    }
   } 

// ------------------get postv follwing ----------------
 exports.getPostOfFollowing =async (req,res)=>{
try{
 const user =await User.findById(req.user._id);
 
 const posts =await Post.find({
   owner:{
    $in:user.following,
   } 
 }).populate("owner likes comments.user");

res.status(200).json({
    success:true,
 posts:posts.reverse(),
})
}catch(error){
    res.status(500).json({
        success:false,
        message:error.message,
    })
}


}

// ---------------------------------update post-----------------------------
 exports.updateCaption=async(req,res)=>{
    try{
const post =await Post.findById(req.params.id);

 if(!post){
     return res.status(404).json({
    success:false,
    message:"Post Not Found"
});
}
if(post.owner.toString() !==req.user._id.toString()){
    return res.status(401).json({
        success:false,
        message:"UnAuthorized",
    })
}
post.caption =req.body.caption;
await post.save();
res.status(200).json({
    success:true,
    message:"Post updated"
})
    }catch(error){
        res.status(500).json({
            success:false,
            message:error.message,
        })
    }
 }

//  -----------------------------------------------Comment-----------------------------------------------------------
 exports.addComment =async(req,res)=>{
    try{
        const post= await Post.findById(req.params.id);
        if(!post){
            return res.status(404).json({
                success:false,
                message:"Post Not Found"
            });

        }

        let commentIndex =-1;
 // CHECKING IF COMMENTS ALREADY EXISTS 
 post.comments.forEach((item,index)=>{
              if(item.user.toString() == req.user._id.toString()){
                commentIndex=index;
              }
 })
   if(commentIndex!== -1){
   post.comments[commentIndex].comment =req.body.comment;
await post.save();
return res.status(200).json({
    success:true,
    message:"comments updated"
})

}else{
    post.comments.push({
        user:req.user._id,
        comment:req.body.comment,
});
await post.save();
return res.status(200).json({
    success:true,
    message:"comments added"
})
}
    }
    catch(error){
        res.status(500).json({
            success:false,
            message:error.message,
        })
    }
    
 }


//  ---------------------------------------delete comment--------------------------------------------------------------
// exports.deleteComment=async(req,res)=>{
//     try{
//         const post =await Post.findById(req.params.id);
        
//     if(!post){
//         return res.status(404).json({
//             success:false,
//             message:"Post not found",
//         });
//         };
// // checking if owner wants to delete 
// if(post.owner.toString()===req.user._id.toString()){
// // ----------------prodlem-------------------------
//     if(req.body.commentId == undefined) {
//     return res.status(400).json({
//     success:false,
//     message:"Comment Id is requied",
//             });
//     };

//     post.comments.forEach((item, index)=>{
//         if(item._id.toString() === req.body.commentId.toString()){
//         return post.comments.splice(index, 1);
//         }
//    });
// // -------------------------------------------------
//    await post.save();

//    return res.status(200).json({
//     success:true,
//     message:"selected Comment has Deleted"
//    });

//   }else{
//     post.comments.forEach((item,index)=>{
//         if(item.user.toString() === req.user._id.toString()){
//         return post.comments.splice(index,1);
//         }
//    });
//   }
//   await post.save();
//   return res.status(200).json({
//     success:true,
//     message:"your comment deleted"
//   });
//     } catch(error){
//         res.status(500).json({
//             success:false,
//             message:error.message,
//         });
//     }
// }
// ----------------------------------------------comment deleted------------------------------------------------
exports.deleteComment = async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
  
      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }
  
      // Checking If owner wants to delete
  
      if (post.owner.toString() === req.user._id.toString()) {
        if (req.body.commentId === undefined) {
          return res.status(400).json({
            success: false,
            message: "Comment Id is required",
          });
        }
  
        post.comments.forEach((item, index) => {
          if (item._id.toString() === req.body.commentId.toString()) {
            return post.comments.splice(index, 1);
          }
        });
  
        await post.save();
  
        return res.status(200).json({
          success: true,
          message: "Selected Comment has deleted",
        });
      } else {
        post.comments.forEach((item, index) => {
          if (item.user.toString() === req.user._id.toString()) {
            return post.comments.splice(index, 1);
          }
        });
  
        await post.save();
  
        return res.status(200).json({
          success: true,
          message: "Your Comment has deleted",
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

const Post = require("../Models/Post");
const User =require("../Models/User");
const {sendEmail} =require("../middleware/sendEmail");
const crypto =require("crypto");
const cloudinary=require("cloudinary");
// ----------------------------------------------------------------Register--------------------------------------------------
 exports.register =async (req,res)=>{
    try{
   
      const { name, email, password, avatar } = req.body;
        let user =await User.findOne({email});
        if(user)
        { 
        return res.status(400).json({
            success:false,
            message:"user already exists"})
        }
        const myCloud = await cloudinary.v2.uploader.upload(avatar, {
          folder: "avatars",
        });
    
        user = await User.create({
          name,
          email,
          password,
          avatar: { public_id: myCloud.public_id, url: myCloud.secure_url },
        });

  //--------------- register hone pr login 
        const token =await user.generateToken();

        res.status(200)
        .cookie("token",token,{expires:new Date(Date.now()+90*24*60*60*1000),
          httpOnly:true
        }).json({
         success:true,
         user,
         token,
        });
// -------------------------------
    }catch(error)
    {
 res.status(500).json({
   success:false,
   message:error.message,
 })
    }
  }

  // -----------------------------------------------------------------Login-----------------------------------------------
exports.login=async(req,res)=>{
    try{
const {email,password}=req.body;

//================ select;false hai module me 
const user =await User.findOne({email}).select("+password").populate("posts followers following");
//  ----------email check exists and donot exists --------------------
  if(!user){
    return res.status(400).json({
      success:false,
      message:"User does not exist"
    });
  }
// -----------------password check------------------
  const isMatch =await user.matchPassword(password);
  if(!isMatch){
    return res.status(400).json({
      success:false,
      message:"Incorrect Password"
    })
  }

  // -------------------------Token-Generate-----------------
 const token =await user.generateToken();

  res.status(200)
  .cookie("token",token,{expires:new Date(Date.now()+90*24*60*60*1000),
    httpOnly:true
  }).json({
   success:true,
   user,
   token,
  });
    }catch(error){
res.status(500).json({
  success:false,
  message:error.message
})
    }
  }

  // -----------logout---------------------------------------------------

  exports.logout=async(req,res)=>{

    try{
  res.status(200).cookie("token",null,{expires:new Date(Date.now()),httpOnly:true}).json({
    success:true,
    message:"Logout"
  })
    }catch(error){
      res.status(500).json({
        success:false,
        message:error.message
      })
    }
  }


  // ==============================updatePassword----------------------------
  exports.updatePassword=async(req,res)=>{
    try{
      const user =await User.findById(req.user._id).select("+password");
      const { oldPassword, newPassword } =req.body;

      if(!oldPassword || !newPassword){
        return res.status(400).json({
          success:false,
          message:"Please provide old and new Password"
        });
      }

      const isMatch =await user.matchPassword(oldPassword);

      if(!isMatch){
        return res.status(400).json({
          success:false,
          message:"Incorrect old Password"
        });
      }

       user.password = newPassword;
       await user.save();

       res.status(200).json({
        success:true,
        message:"Password Updated"
       })

    }catch(error){
      res.status(500).json({
        success:false,
        message:error.message,
      })
    }
  }


  // ----------------update profile-----------------
  exports.updateProfile =async(req,res)=>{
    try{
   const user =await User.findById(req.user._id);
   const { name, email, avatar } = req.body;

   if(name){
    user.name = name;
   }
   if(email){
    user.email= email;
   }

   if (avatar) {
    await cloudinary.v2.uploader.destroy(user.avatar.public_id);

    const myCloud = await cloudinary.v2.uploader.upload(avatar, {
      folder: "avatars",
    });
    user.avatar.public_id = myCloud.public_id;
    user.avatar.url = myCloud.secure_url;
  }
   await user.save();
   res.status(200).json({
    success:true,
    message:"Profile updated"
   })
    }
    catch(error){
      res.status(500).json({
        success:false,
        message:error.message,
      })
    }
  }

  // -----------------------------------------------------------------------Delete Account -----------------------------------

   exports.deleteMyAccount =async (req,res)=>{
    try{
      const user=await User.findById(req.user._id);
// ---post ki array lene ke liye-----------------------------
      const posts =user.posts;
// followERS ki array lene ke liye-
   const followers =user.followers;
  const userId =user._id;
  // followING ki array lene ke liye-
  const following =user.following;
// removing cloudinary data 
   await cloudinary.v2.uploader.destroy(user.avatar.public_id);

await user.remove();

 // logout after delecting account------------------------------
  res.cookie("token",null,{expires:new Date(Date.now()),httpOnly:true})

// post b delete krna hai - delete all posts of the user-
  for(let i=0; i < posts.length; i++){
    const post =await Post.findById(posts[i]);
    await cloudinary.v2.uploader.destroy(post.image.public_id);
    await post.remove();
  }

  //---- Removing user from followers following-------------------------
  for(let i=0; i < followers.length; i++){

    const follower =await User.findById(followers[i]);

    const index =follower.following.indexOf(userId);
    follower.following.splice(index,1);
   await follower.save();
  }

 //---- Removing user from followING followERS-------------------------
   for(let i=0; i < following.length; i++){

    const follows =await User.findById(following[i]);

    const index =follows.followers.indexOf(userId);
    follows.followers.splice(index,1);
   await follows.save();
  }

  // -----------------removing comments----------------------
  const allposts = await Post.find();

  for(let i=0; i < allposts.length; i++){
    const post =await Post.findById(allposts[i]._id);

    for(let j=0; j<post.comments.length; j++){
      if(post.comments[j].user===userId){
        post.comments.splice(j,1);
       
      }
    }

    await post.save();
  }

   // -----------------removing Linkes----------------------


   for(let i=0; i < allposts.length; i++){
     const post =await Post.findById(allposts[i]._id);
 
     for(let j=0; j<post.likes.length; j++){
       if(post.likes[j]===userId){
         post.likes.splice(j,1);
        
       }
     }
 
     await post.save();
   }


      res.status(200).json({
        success:true,
        message:"Account delected"
      })

    }catch(error){
      res.status(500).json({
        success:false,
        message:error.message,
      })
    }
   }

// ------------------------------------this.myProfile--------------------------------------------------------

  exports.myProfile=async(req,res)=>{
    try{
   const user =await User.findById(req.user._id).populate("posts followers following");

   res.status(200).json({
    success:true,
    user,
   });

    }catch(error){
res.status(500).json({
  success:false,
  message:error.message,

})
    }
  }





// --------------------------------------------------FOLLOW---------------------------------------------------------------
 exports.followUser=async(req,res)=>{
  try{
    const userToFollow =await User.findById(req.params.id);
    const loggedInUser =await User.findById(req.user.id);
    
    if(!userToFollow){
      return res.status(404).json({
        success:false,
        message:"User not found"
      });
    }
    //---- bar--bar--follow na kree CSSConditionRule.----
    if(loggedInUser.following.includes(userToFollow._id)){
      const indexfollowing =loggedInUser.following.indexOf(userToFollow._id);
       loggedInUser.following.splice(indexfollowing,1);

      const indexfollowers =userToFollow.followers.indexOf(loggedInUser._id);
       userToFollow.followers.splice(indexfollowers,1);

await loggedInUser.save();
await userToFollow.save();

res.status(200).json({
  success:true,
  message:"User Unfollowed",
 })
    }else{
      loggedInUser.following.push(userToFollow._id);
    userToFollow.followers.push(loggedInUser._id);

 await loggedInUser.save();
 await userToFollow.save();
 res.status(200).json({
  success:true,
  message:"User followed",
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


 exports.getUserProfile =async(req,res)=>{
  try{
   const user =await User.findById(req.params.id).populate("posts followers following");
   if(!user){
    return res.status(404).json({
      success:false,
      message:"User not found"
    });
   }
   res.status(200).json({
    success:true,
    user,
   })


  }catch(error){
    res.status(500).json({
      success:false,
      message:error.message,
    })
  }
}
// -------------------------------------all useers-------------------
 exports.getAllUsers =async(req,res)=>{
  try{
  const users =await User.find({
   name:{ $regex: req.query.name, $options:"i"} ,
  });
  
  res.status(200).json({
    success:true,
    users,

  })

  }catch(error){
    res.status(500).json({
      success:false,
      message:error.message
    })
  }
}




// ----------------------------------------------------------------------forget password-------------------------------------------------------
exports.forgetPassword =async (req,res)=>{
  try{
    const user =await User.findOne({email:req.body.email});

    if(!user){
      return res.status(404).json({
        success:false,
        message:"User not found"
      })
    }
const resetPasswordToken =user.getResetPasswordToken();
await user.save();
const resetUrl=`${req.protocol}://${req.get("host")}/password/reset/${resetPasswordToken}`;
// const resetUrl=`${req.protocol}://${req.get("host")}/api/v1/password/reset/${resetPasswordToken}`;
const message =`Reset Your Password by clicking on the link below: \n\n ${resetUrl}`
// ---------------email send krne ke liye thisn token---------------------
try{
await sendEmail({email:user.email, subject:"Reset Password",message});;
res.status(200).json({
  success:true,
  message:`Email Sent to ${user.email}`,
})

}catch(error){
user.resetPasswordToken=undefined;
user.resetPasswordExpire=undefined;
await user.save();
res.status(500).json({
  success:false,
  message:error.message,
})
}


// -----------------------------------------------
  }catch(error){
    res.status(500).json({
      success:false,
      message:error.message
    })
  }
}

//------------------------- resetpassword verify your token -----------------
exports.resetPasword=async(req,res)=>{
  try{
    // unhashed krege-
    const resetPasswordToken =crypto.createHash("sha256").update(req.params.token).digest("hex");
    const user=await User.findOne({
      resetPasswordToken,
      resetPasswordExpire:{$gt:Date.now()},
    });
if(!user){
  return res.status(401).json({
    success:false,
    message:"Token is invalid or has Expired",
  })
}

user.password=req.body.password;
user.resetPasswordToken=undefined;
user.resetPasswordExpire=undefined;
await user.save();
res.status(200).json({
  success:true,
  message:"Password Updated"
})
  }catch(error){
    res.status(500).json({
      success:false,
      message:error.message,
    })
  }
}

exports.getMyPosts =async(req,res)=>{
  try{
  const user =await User.findById(req.user._id);
   const posts=[];
   for(let i=0; i<user.posts.length; i++){
    const post =await Post.findById(user.posts[i]).populate("likes comments.user owner");
    posts.push(post);
   }
  res.status(200).json({
    success:true,
    posts,
  })
  }catch(error){
    res.status(500).json({
      success:false,
      message:error.message
    })
  }
}

exports.getUserPosts = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    const posts = [];

    for (let i = 0; i < user.posts.length; i++) {
      const post = await Post.findById(user.posts[i]).populate(
        "likes comments.user owner"
      );
      posts.push(post);
    }

    res.status(200).json({
      success: true,
      posts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

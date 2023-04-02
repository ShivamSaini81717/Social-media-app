const express= require("express");
const { createPost, likeAndDislikepost,
     deletePost, getPostOfFollowing,
      updateCaption, addComment, deleteComment } = require("../controllers/PostController");

const { isAuthenticated } = require("../middleware/auth");
const router=express.Router();

router.route("/post/create").post( isAuthenticated,createPost);
router.route("/post/:id").get(isAuthenticated,likeAndDislikepost);
router.route("/post/:id").delete(isAuthenticated,deletePost);
router.route("/post/:id").put(isAuthenticated,updateCaption);
router.route("/posts").get(isAuthenticated,getPostOfFollowing);
router.route("/post/comment/:id").put(isAuthenticated,addComment).delete(isAuthenticated,deleteComment);
module.exports =router;
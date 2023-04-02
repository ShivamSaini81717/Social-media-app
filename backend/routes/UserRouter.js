const express= require("express");
const { register, login,
     followUser, logout, updatePassword,
      updateProfile, deleteMyAccount, 
      myProfile, getAllUsers,
       getUserProfile, 
       forgetPassword,
       resetPasword,
       getMyPosts,
       getUserPosts} = require("../controllers/UserController");
const { isAuthenticated } = require("../middleware/auth");
const router=express.Router();

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/logout").get(logout);
router.route("/follow/:id").get(isAuthenticated,followUser);
router.route("/update/password").put(isAuthenticated, updatePassword);
router.route("/update/profile").put(isAuthenticated, updateProfile);
router.route("/delete/me").delete(isAuthenticated, deleteMyAccount);
router.route("/my/posts").get(isAuthenticated,getMyPosts);
router.route("/userposts/:id").get(isAuthenticated, getUserPosts);
router.route("/me").get(isAuthenticated,myProfile);
router.route("/users").get(isAuthenticated,getAllUsers);
router.route("/user/:id").get(isAuthenticated,getUserProfile);
router.route("/forgot/password").post(forgetPassword);
router.route("/password/reset/:token").put(resetPasword);
module.exports =router;
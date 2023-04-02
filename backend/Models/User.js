const mongoose =require("mongoose");
const bcrypt =require("bcrypt");
const jwt =require("jsonwebtoken");
const crypto =require("crypto")
const userSchema = new mongoose.Schema({

    name:{
        type:String,
        required:[true,"Please Enter a Name"]
    },
    avatar:{
        public_id:String,
        url:String,
    },
    email:{
        type:String,
        required:[true,"Please Enter a email"],
        unique:[true, "Email Already Exists"]
    },
    password:{
        type:String,
        required:[true,"Please Enter a Password"],
        minlength:[6,"Password must be at least 6 characters"],
        select:false,
    },
    posts:[
     {
        type:mongoose.Schema.Types.ObjectId,
        ref:"Post",
     }
    ],
    followers:[
    {
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
    }
    ],
    following:[
    {
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
    }
    ],
    resetPasswordToken:String,
    resetPasswordExpire:Date,
});
// --------------------------password---------hash bcrypt---------------
userSchema.pre("save",async function(next){
    if(this.isModified("password")){
        this.password=await bcrypt.hash(this.password,10);

    }
    next();
 
});

// --------------password check-------------------
userSchema.methods.matchPassword =async function(password){
return await bcrypt.compare(password, this.password);
};

// ------------------generateToken function controllers se ---------------
userSchema.methods.generateToken =function(){
return jwt.sign({_id:this._id},process.env.JWT_SECRET);
}


// ----------------------password forget ke liye ------------
userSchema.methods.getResetPasswordToken =function(){

const resetToken =crypto.randomBytes(20).toString("hex");
// console.log(resetToken);
this.resetPasswordToken =crypto
.createHash("sha256")
.update(resetToken)
.digest("hex");
this.resetPasswordExpire=Date.now() +10*60*1000;
//----------------- 10 min  expire ------------------------
return resetToken;
}

module.exports =mongoose.model("User",userSchema);
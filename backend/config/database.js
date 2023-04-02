const mongoose =require("mongoose");
mongoose.set('strictQuery', false);
exports.connectDatabase=()=>{
    mongoose.connect(process.env.DB,{
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      .then((data) => {
        console.log(`Mongodb connected with server: ${data.connection.host}`);
      }).catch((err)=>{
        console.log(err)
      })
}
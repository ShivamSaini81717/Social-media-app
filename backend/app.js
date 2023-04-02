const express =require("express");
const path = require('path');
const app =express();
const cors =require("cors");

const cookieParser =require("cookie-parser");

if(process.env.NODE_ENV !== "production"){
    require("dotenv").config({path:"backend/config/config.env"});
}


__dirname = path.resolve();
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '/frontend/build')))

    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, "/frontend/build/index.html"))
    });
} else {
    app.get('/', (req, res) => {
        console.log(`Server is running on PORT ${process.env.PORT}`);
    });
}

// using middleware
app.use(express.json({limit:"50mb"}));
app.use(express.urlencoded({limit:"50mb",extended:true}));
app.use(cookieParser());
app.use(cors());

// import routes 
const post =require("./routes/PostRouter");
const user =require("./routes/UserRouter");

// using routes
app.use("/api/v1",post);
app.use("/api/v1",user);

module.exports =app;
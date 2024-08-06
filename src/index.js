// require('dotenv').config({path:'./env'});
import dotenv from "dotenv"
import connectDB from "./db/index.js";
import { app } from "./app.js";


dotenv.config({path:"./env"})

connectDB()
.then(()=>{
      app.listen(process.env.PORT || 5000,()=>{
            console.log("server is running");
            
      })
})
.catch((error)=>{
      console.log(("mongoo db connect failed !!",error));
      
})


/*

import express from "express";
const app=express()

(async ()=>{
      try {
            await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
            app.on("error",(error)=>{
                  console.log("error:",error);
                  throw error
            })
            app.listen(process.env.PORT,()=>{
                  console.log("APP is listening");
                  
            })
            
      } catch (error) {
            console.error("error",error)
            
      }
})()
      
*/
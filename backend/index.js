import express from "express"
import dotenv from 'dotenv'
import dbConnect from "./DB/dbConnect.js";
import authRouter from './Route/authUser.js'
import messageRouter from './Route/messageroute.js'
import userRouter from './Route/userroute.js'
import cookieParser from "cookie-parser";
import { app, server } from "./socket/socket.js";

dotenv.config();
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth',authRouter)
app.use('/api/message',messageRouter)
app.use('/api/user',userRouter)

app.get('/',(req,res)=>{
  res.send("server is working");
})
const PORT=process.env.PORT || 3000
server.listen(PORT,()=>{
  dbConnect();
  console.log(`working at ${PORT}`)
});
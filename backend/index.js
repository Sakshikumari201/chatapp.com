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

import path from "path";

const __dirname = path.resolve();

app.use('/api/auth',authRouter)
app.use('/api/message',messageRouter)
app.use('/api/user',userRouter)

app.use(express.static(path.join(__dirname, "/frontend/dist")));

app.get("*", (req, res) => {
	res.sendFile(path.join(__dirname, "frontend", "dist", "index.html"));
});
const PORT=process.env.PORT || 3000
server.listen(PORT,()=>{
  dbConnect();
  console.log(`working at ${PORT}`)
});
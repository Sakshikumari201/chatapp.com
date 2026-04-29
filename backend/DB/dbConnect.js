import mongoose from "mongoose";
const dbConnect=async()=>{
  try{
    await mongoose.connect(process.env.MONGODB_CONNECT),
    console.log("Db connected sucess")


  }catch(error){
    console.error("Database connection error:", error);
  }
}
export default dbConnect
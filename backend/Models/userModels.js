import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    fullname:{
        type: String,
        required: true
    },
    username:{
        type: String,
        required: true,
        unique:true
    },
    email:{
        type: String,
        required: true,
        unique:true
    },
    gender:{
        type: String,
        required: true,
        enum:["male","female"]
    },
    password:{
        type: String,
        required: true,
        minlength:6,
    },
    profilepic:{
        type: String,
        required: true,
        default:""
    },
    bio:{
        type: String,
        default: "Hello there! I am using ChatApp."
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    fcmToken: {
        type: String,
        default: ""
    }
},{timestamps:true});

const User = mongoose.model("User",userSchema)

export default User;
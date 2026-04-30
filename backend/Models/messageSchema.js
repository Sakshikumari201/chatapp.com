import mongoose from "mongoose"

const messageSchema = mongoose.Schema({
    senderId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    reciverId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    message:{
        type:String,
        default:""
    },
    imageUrl:{
        type:String,
        default:""
    },
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        default:[]
    },
    isRead: {
        type: Boolean,
        default: false
    }
},{timestamps:true})

const Message = mongoose.model("Message",messageSchema)

export default Message;
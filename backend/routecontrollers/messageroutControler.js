import Conversation from "../Models/conversationModels.js";
import Message from "../Models/messageSchema.js";
import { getReciverSocketId,io } from "../socket/socket.js";
import cloudinary from "../utils/cloudinary.js";

export const sendMessage =async(req,res)=>{
try {
    const {messages, image} = req.body;
    const {id:reciverId} = req.params;
    const senderId = req.user._id;

    let imageUrl = "";
    if (image) {
        const uploadResponse = await cloudinary.uploader.upload(image);
        imageUrl = uploadResponse.secure_url;
    }

    let chats = await Conversation.findOne({
        participants:{$all:[senderId , reciverId]}
    })

    if(!chats){
        chats = await Conversation.create({
            participants:[senderId , reciverId],
        })
    }

    const newMessages = new Message({
        senderId,
        reciverId,
        message:messages || "",
        imageUrl:imageUrl,
        conversationId: chats._id
    })

    if(newMessages){
        chats.messages.push(newMessages._id);
    }

    await Promise.all([chats.save(),newMessages.save()]);

     //SOCKET.IO function 
     const reciverSocketId = getReciverSocketId(reciverId);
     if(reciverSocketId){
        io.to(reciverSocketId).emit("newMessage",newMessages)
     }

    res.status(201).send(newMessages)

} catch (error) {
    res.status(500).send({
        success: false,
        message: error
    })
    console.log(`error in sendMessage ${error}`);
}
}


export const getMessages=async(req,res)=>{
try {
    const {id:reciverId} = req.params;
    const senderId = req.user._id;

    const chats = await Conversation.findOne({
        participants:{$all:[senderId , reciverId]}
    }).populate("messages")

    if(!chats)  return res.status(200).send([]);
    const message = chats.messages;

    // Mark messages as read
    const unreadMessages = message.filter(m => m.senderId.toString() === reciverId && !m.isRead);
    if (unreadMessages.length > 0) {
        await Message.updateMany(
            { _id: { $in: unreadMessages.map(m => m._id) } },
            { $set: { isRead: true } }
        );
        
        // Notify the sender that their messages were read
        const senderSocketId = getReciverSocketId(reciverId);
        if (senderSocketId) {
            io.to(senderSocketId).emit("messagesRead", { conversationId: chats._id, readerId: senderId });
        }
        
        // Update local array so response shows them as read
        unreadMessages.forEach(m => m.isRead = true);
    }

    res.status(200).send(message)
} catch (error) {
    res.status(500).send({
        success: false,
        message: error
    })
    console.log(`error in getMessage ${error}`);
}
}
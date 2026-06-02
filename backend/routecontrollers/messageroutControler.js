import Conversation from "../Models/conversationModels.js";
import Message from "../Models/messageSchema.js";
import { getReciverSocketId,io } from "../socket/socket.js";
import cloudinary from "../utils/cloudinary.js";
import { sendPushNotification } from "../utils/firebase.js";
import User from "../Models/userModels.js";

export const sendMessage =async(req,res)=>{
try {
    const {messages, image, file, fileName, fileType} = req.body;
    const {id:reciverId} = req.params;
    const senderId = req.user._id;

    let imageUrl = "";
    if (image) {
        const uploadResponse = await cloudinary.uploader.upload(image);
        imageUrl = uploadResponse.secure_url;
    }

    let fileUrl = "";
    if (file) {
        const uploadResponse = await cloudinary.uploader.upload(file, {
            resource_type: "auto"
        });
        fileUrl = uploadResponse.secure_url;
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
        fileUrl: fileUrl,
        fileName: fileName || "",
        fileType: fileType || "",
        isEncrypted: req.body.isEncrypted || false,
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
     } else {
         // If receiver is offline, send a push notification
         const sender = await User.findById(senderId);
         await sendPushNotification(
             reciverId, 
             `New message from ${sender.fullname}`, 
             messages || "Sent an image",
             { senderId: senderId.toString() }
         );
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

export const searchMessages = async (req, res) => {
    try {
        const { id: receiverId } = req.params;
        const senderId = req.user._id;
        const { query, date, mediaOnly } = req.query;

        let filter = {
            $or: [
                { senderId: senderId, reciverId: receiverId },
                { senderId: receiverId, reciverId: senderId }
            ]
        };

        if (query) {
            filter.$text = { $search: query };
        }

        if (date) {
            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setDate(endDate.getDate() + 1);
            filter.createdAt = { $gte: startDate, $lt: endDate };
        }

        if (mediaOnly === 'true') {
            filter.imageUrl = { $ne: "" };
        }

        const messages = await Message.find(filter).sort({ createdAt: -1 });

        res.status(200).send(messages);
    } catch (error) {
        res.status(500).send({
            success: false,
            message: error.message
        });
        console.log(`error in searchMessages ${error}`);
    }
}

export const togglePinConversation = async (req, res) => {
    try {
        const { id: otherUserId } = req.params;
        const userId = req.user._id;

        const conversation = await Conversation.findOne({
            participants: { $all: [userId, otherUserId] }
        });

        if (!conversation) return res.status(404).send({ message: "Conversation not found" });

        const isPinned = conversation.pinnedBy.includes(userId);
        if (isPinned) {
            conversation.pinnedBy.pull(userId);
        } else {
            conversation.pinnedBy.push(userId);
        }

        await conversation.save();
        res.status(200).send({ success: true, isPinned: !isPinned });
    } catch (error) {
        res.status(500).send({ success: false, message: error.message });
        console.log(`error in togglePinConversation ${error}`);
    }
};

export const createGroupChat = async (req, res) => {
    try {
        const { participants, groupName, groupDescription } = req.body;
        const userId = req.user._id;

        if (!participants || !groupName) {
            return res.status(400).send({ message: "Please fill all fields" });
        }

        if (participants.length < 2) {
            return res.status(400).send({ message: "More than 2 users are required to form a group chat" });
        }

        participants.push(userId);

        const groupChat = await Conversation.create({
            groupName,
            groupDescription,
            participants,
            isGroup: true,
            groupAdmin: userId,
        });

        const fullGroupChat = await Conversation.findOne({ _id: groupChat._id })
            .populate("participants", "-password")
            .populate("groupAdmin", "-password");

        res.status(200).json(fullGroupChat);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

export const renameGroup = async (req, res) => {
    try {
        const { conversationId, groupName } = req.body;

        const updatedChat = await Conversation.findByIdAndUpdate(
            conversationId,
            { groupName },
            { new: true }
        )
            .populate("participants", "-password")
            .populate("groupAdmin", "-password");

        if (!updatedChat) return res.status(404).send({ message: "Chat Not Found" });
        res.json(updatedChat);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

export const addToGroup = async (req, res) => {
    try {
        const { conversationId, userId } = req.body;

        const added = await Conversation.findByIdAndUpdate(
            conversationId,
            { $push: { participants: userId } },
            { new: true }
        )
            .populate("participants", "-password")
            .populate("groupAdmin", "-password");

        if (!added) return res.status(404).send({ message: "Chat Not Found" });
        res.json(added);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

export const removeFromGroup = async (req, res) => {
    try {
        const { conversationId, userId } = req.body;

        const removed = await Conversation.findByIdAndUpdate(
            conversationId,
            { $pull: { participants: userId } },
            { new: true }
        )
            .populate("participants", "-password")
            .populate("groupAdmin", "-password");

        if (!removed) return res.status(404).send({ message: "Chat Not Found" });
        res.json(removed);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

export const toggleArchiveConversation = async (req, res) => {
    try {
        const { id: otherUserId } = req.params;
        const userId = req.user._id;

        const conversation = await Conversation.findOne({
            participants: { $all: [userId, otherUserId] }
        });

        if (!conversation) return res.status(404).send({ message: "Conversation not found" });

        const isArchived = conversation.archivedBy.includes(userId);
        if (isArchived) {
            conversation.archivedBy.pull(userId);
        } else {
            conversation.archivedBy.push(userId);
        }

        await conversation.save();
        res.status(200).send({ success: true, isArchived: !isArchived });
    } catch (error) {
        res.status(500).send({ success: false, message: error.message });
        console.log(`error in toggleArchiveConversation ${error}`);
    }
};
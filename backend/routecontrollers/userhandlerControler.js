import Conversation from "../Models/conversationModels.js";
import User from "../Models/userModels.js";
import Message from "../Models/messageSchema.js";

export const getUserBySearch=async(req,res)=>{
try {
    const search = req.query.search || '';
    const currentUserID = req.user._id;
    const user = await User.find({
        $and:[
            {
                $or:[
                    {username:{$regex:'.*'+search+'.*',$options:'i'}},
                    {fullname:{$regex:'.*'+search+'.*',$options:'i'}}
                ]
            },{
                _id:{$ne:currentUserID}
            }
        ]
    }).select("-password").select("email");

    const usersWithUnreadCounts = await Promise.all(user.map(async (u) => {
        const unreadCount = await Message.countDocuments({
            senderId: u._id,
            reciverId: currentUserID,
            isRead: false
        });
        return {
            ...u._doc,
            unreadCount
        };
    }));

    res.status(200).send(usersWithUnreadCounts)

} catch (error) {
    res.status(500).send({
        success: false,
        message: error
    })
    console.log(error);
}
}


export const getCorrentChatters=async(req,res)=>{
    try {
        const currentUserID = req.user._id;
        const currenTChatters = await Conversation.find({
            participants:currentUserID
        }).sort({
            updatedAt: -1
            });

            if(!currenTChatters || currenTChatters.length === 0)  return res.status(200).send([]);

            const partcipantsIDS = currenTChatters.reduce((ids,conversation)=>{
                const otherParticipents = conversation.participants.filter(id => id !== currentUserID);
                return [...ids , ...otherParticipents]
            },[])

            const otherParticipentsIDS = partcipantsIDS.filter(id => id.toString() !== currentUserID.toString());

            const usersArray = await User.find({_id:{$in:otherParticipentsIDS}}).select("-password").select("-email");

            const users = otherParticipentsIDS.map(id => usersArray.find(u => u._id.toString() === id.toString()));

            const usersWithUnreadCounts = await Promise.all(users.map(async (user) => {
                if(!user) return null;
                const unreadCount = await Message.countDocuments({
                    senderId: user._id,
                    reciverId: currentUserID,
                    isRead: false
                });
                return {
                    ...user._doc,
                    unreadCount
                };
            }));

            const validUsers = usersWithUnreadCounts.filter(u => u !== null);

            res.status(200).send(validUsers)

    } catch (error) {
        res.status(500).send({
            success: false,
            message: error
        })
        console.log(error);
    }
}
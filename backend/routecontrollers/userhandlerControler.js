import Conversation from "../Models/conversationModels.js";
import User from "../Models/userModels.js";
import Message from "../Models/messageSchema.js";
import cloudinary from "../utils/cloudinary.js";

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

export const saveFcmToken = async (req, res) => {
    try {
        const { fcmToken } = req.body;
        const userId = req.user._id;

        await User.findByIdAndUpdate(userId, { fcmToken });

        res.status(200).send({
            success: true,
            message: "Token saved successfully"
        });
    } catch (error) {
        res.status(500).send({
            success: false,
            message: error.message
        });
        console.log(error);
    }
}

export const getUserProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).select("-password");
        if (!user) return res.status(404).send({ success: false, message: "User not found" });

        res.status(200).send(user);
    } catch (error) {
        res.status(500).send({
            success: false,
            message: error.message
        });
        console.log(error);
    }
}

export const updateProfilePic = async (req, res) => {
    try {
        const { profilepic } = req.body;
        const userId = req.user._id;

        if (!profilepic) {
            return res.status(400).send({ success: false, message: "Profile picture is required" });
        }

        const uploadResponse = await cloudinary.uploader.upload(profilepic);
        const imageUrl = uploadResponse.secure_url;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { profilepic: imageUrl },
            { new: true }
        ).select("-password");

        res.status(200).send({
            success: true,
            message: "Profile picture updated successfully",
            user: updatedUser
        });
    } catch (error) {
        res.status(500).send({
            success: false,
            message: error.message
        });
        console.log(error);
    }
}

export const updateUserProfile = async (req, res) => {
    try {
        const { fullname, username, bio } = req.body;
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) return res.status(404).send({ success: false, message: "User not found" });

        // If username is changing, check if new username is already taken
        if (username && username !== user.username) {
            const existingUser = await User.findOne({ username });
            if (existingUser) {
                return res.status(400).send({ success: false, message: "Username already exists" });
            }
        }

        user.fullname = fullname || user.fullname;
        user.username = username || user.username;
        user.bio = bio || user.bio;

        await user.save();

        res.status(200).send({
            success: true,
            message: "Profile updated successfully",
            user: {
                _id: user._id,
                fullname: user.fullname,
                username: user.username,
                bio: user.bio,
                profilepic: user.profilepic,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).send({ success: false, message: error.message });
    }
}

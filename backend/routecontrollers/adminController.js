import User from "../Models/userModels.js";
import Message from "../Models/messageSchema.js";

export const getAdminStats = async (req, res) => {
    try {
        // Basic security check: ensure the user is an admin
        if (!req.user.isAdmin) {
            return res.status(403).send({ success: false, message: "Access denied. Admin only." });
        }

        const totalUsers = await User.countDocuments();
        const totalMessages = await Message.countDocuments();
        
        // Messages in the last 24 hours
        const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const messagesLast24h = await Message.countDocuments({ createdAt: { $gte: last24h } });

        // Messages per day (last 7 days)
        const stats = await Message.aggregate([
            {
                $match: {
                    createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.status(200).send({
            success: true,
            totalUsers,
            totalMessages,
            messagesLast24h,
            stats
        });
    } catch (error) {
        res.status(500).send({ success: false, message: error.message });
    }
};

export const getAllUsersAdmin = async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).send({ success: false, message: "Access denied. Admin only." });
        }
        const users = await User.find().select("-password");
        res.status(200).send({ success: true, users });
    } catch (error) {
        res.status(500).send({ success: false, message: error.message });
    }
};

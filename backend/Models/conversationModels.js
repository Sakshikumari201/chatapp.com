import mongoose from "mongoose";

const conversationSchema = mongoose.Schema({
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ],
  messages: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: []
    }
  ],
  isGroup: {
    type: Boolean,
    default: false
  },
  groupName: {
    type: String,
    default: ""
  },
  groupAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  groupDescription: {
    type: String,
    default: ""
  },
  groupPic: {
    type: String,
    default: "https://cdn-icons-png.flaticon.com/512/166/166258.png"
  },
  pinnedBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ],
  archivedBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ]
}, { timestamps: true })

const Conversation = mongoose.model('Conversation', conversationSchema)

export default Conversation;
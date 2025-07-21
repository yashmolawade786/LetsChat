import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
    },
    image: {
      type: String,
    },
    isViewOnce: {
      type: Boolean,
      default: false,
    },
    isViewed: {
      type: Boolean,
      default: false,
    },
    originalContent: {
      text: String,
      image: String,
    },
  },
  { timestamps: true }
);

// Middleware to save original content for view-once messages
messageSchema.pre("save", function (next) {
  if (this.isViewOnce && !this.originalContent) {
    this.originalContent = {
      text: this.text,
      image: this.image,
    };
  }
  next();
});

const Message = mongoose.model("Message", messageSchema);

export default Message;

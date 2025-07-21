import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    // Process messages for response
    const processedMessages = messages.map((message) => {
      const messageObj = message.toObject();

      // If it's a view-once message
      if (message.isViewOnce) {
        // If user is receiver and message is viewed, show "**"
        if (
          message.isViewed &&
          message.receiverId.toString() === myId.toString()
        ) {
          return {
            ...messageObj,
            text: "**",
            image: null,
          };
        }
        // If user is sender, always show original content
        else if (message.senderId.toString() === myId.toString()) {
          return {
            ...messageObj,
            text: message.originalContent?.text || message.text,
            image: message.originalContent?.image || message.image,
          };
        }
      }
      return messageObj;
    });

    // Reset unread count
    const user = await User.findById(myId);
    user.unreadCounts.set(userToChatId, 0);
    await user.save();

    res.status(200).json(processedMessages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image, isViewOnce } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      isViewOnce: Boolean(isViewOnce),
    });

    await newMessage.save();

    // Update unread count for receiver
    const receiver = await User.findById(receiverId);
    const currentUnreadCount =
      receiver.unreadCounts.get(senderId.toString()) || 0;
    receiver.unreadCounts.set(senderId.toString(), currentUnreadCount + 1);
    await receiver.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", {
        message: newMessage,
        unreadCount: currentUnreadCount + 1,
        fromUser: senderId,
      });
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const markMessagesAsRead = async (req, res) => {
  try {
    const { id: otherUserId } = req.params;
    const userId = req.user._id;

    // Reset unread count for this specific chat
    const user = await User.findById(userId);
    user.unreadCounts.set(otherUserId, 0);
    await user.save();

    res.status(200).json({ message: "Messages marked as read" });
  } catch (error) {
    console.log("Error in markMessagesAsRead controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const pinChat = async (req, res) => {
  try {
    const userId = req.user._id;
    const { chatId } = req.params;
    const user = await User.findById(userId);
    if (!user.pinnedChats.includes(chatId)) {
      user.pinnedChats.push(chatId);
      await user.save();
    }
    res.status(200).json({ pinnedChats: user.pinnedChats });
  } catch (error) {
    res.status(500).json({ error: "Failed to pin chat" });
  }
};

export const unpinChat = async (req, res) => {
  try {
    const userId = req.user._id;
    const { chatId } = req.params;
    const user = await User.findById(userId);
    user.pinnedChats = user.pinnedChats.filter(
      (id) => id.toString() !== chatId
    );
    await user.save();
    res.status(200).json({ pinnedChats: user.pinnedChats });
  } catch (error) {
    res.status(500).json({ error: "Failed to unpin chat" });
  }
};

export const markMessageAsViewed = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Only allow receiver to mark message as viewed
    if (message.receiverId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    if (message.isViewOnce && !message.isViewed) {
      message.isViewed = true;
      await message.save();

      const senderSocketId = getReceiverSocketId(message.senderId);
      const receiverSocketId = getReceiverSocketId(message.receiverId);

      // For receiver, show "**"
      const receiverContent = {
        messageId: message._id,
        viewedContent: {
          text: "**",
          image: null,
          isViewed: true,
        },
      };

      // For sender, show original content
      const senderContent = {
        messageId: message._id,
        viewedContent: {
          text: message.originalContent?.text || message.text,
          image: message.originalContent?.image || message.image,
          isViewed: true,
        },
      };

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("messageViewed", receiverContent);
      }

      if (senderSocketId) {
        io.to(senderSocketId).emit("messageViewed", senderContent);
      }

      // Return appropriate content based on user role
      return res.status(200).json({
        ...message.toObject(),
        text: "**",
        image: null,
      });
    }

    res.status(200).json(message);
  } catch (error) {
    console.log("Error in markMessageAsViewed controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

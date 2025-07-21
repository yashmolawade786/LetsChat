import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getMessages,
  getUsersForSidebar,
  sendMessage,
  markMessagesAsRead,
  pinChat,
  unpinChat,
  markMessageAsViewed,
} from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, sendMessage);
router.post("/mark-read/:id", protectRoute, markMessagesAsRead);
router.post("/pin/:chatId", protectRoute, pinChat);
router.post("/unpin/:chatId", protectRoute, unpinChat);
router.post("/view/:messageId", protectRoute, markMessageAsViewed);

export default router;

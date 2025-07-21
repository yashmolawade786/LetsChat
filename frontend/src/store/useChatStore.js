import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import { showNotification } from "../lib/notification";
import MessageNotification from "../components/MessageNotification";
import { createElement } from "react";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  unreadCounts: {},
  pinnedChats: [],

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
      // Fetch pinned chats for the logged-in user
      const userRes = await axiosInstance.get("/auth/check");
      set({ pinnedChats: userRes.data.pinnedChats || [] });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
      // Clear unread count when opening chat
      set((state) => ({
        unreadCounts: {
          ...state.unreadCounts,
          [userId]: 0,
        },
      }));
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  markMessagesAsRead: async (userId) => {
    try {
      await axiosInstance.post(`/messages/mark-read/${userId}`);
      set((state) => ({
        unreadCounts: {
          ...state.unreadCounts,
          [userId]: 0,
        },
      }));
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  },

  pinChat: async (chatId) => {
    try {
      const res = await axiosInstance.post(`/messages/pin/${chatId}`);
      set({ pinnedChats: res.data.pinnedChats });
    } catch (error) {
      toast.error("Failed to pin chat");
    }
  },
  unpinChat: async (chatId) => {
    try {
      const res = await axiosInstance.post(`/messages/unpin/${chatId}`);
      set({ pinnedChats: res.data.pinnedChats });
    } catch (error) {
      toast.error("Failed to unpin chat");
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (data) => {
      const { message, unreadCount, fromUser } = data;
      const isMessageSentFromSelectedUser = fromUser === selectedUser._id;

      if (!isMessageSentFromSelectedUser) {
        // Update unread count for other chats
        set((state) => ({
          unreadCounts: {
            ...state.unreadCounts,
            [fromUser]: (state.unreadCounts[fromUser] || 0) + 1,
          },
        }));

        // Find sender's info for notification
        const sender = get().users.find((user) => user._id === fromUser);
        if (sender) {
          // Show browser notification
          showNotification(
            sender.fullName,
            message.text || "Sent you an image",
            sender.profilePic || "/avatar.png"
          );

          // Show toast notification using createElement instead of JSX
          toast(() => createElement(MessageNotification, { sender, message }));
        }
        return;
      }

      set({
        messages: [...get().messages, message],
      });
    });

    socket.on("messageViewed", (data) => {
      const { messageId, viewedContent } = data;

      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId ? { ...msg, ...viewedContent } : msg
        ),
      }));
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
    socket.off("messageViewed");
  },

  setSelectedUser: (selectedUser) => {
    if (selectedUser) {
      get().markMessagesAsRead(selectedUser._id);
    }
    set({ selectedUser });
  },
}));

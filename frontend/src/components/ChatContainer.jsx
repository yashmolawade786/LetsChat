import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef } from "react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { axiosInstance } from "../lib/axios";
import { Eye } from "lucide-react";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  const handleViewOnceMessage = async (message) => {
    if (
      message.isViewOnce &&
      !message.isViewed &&
      message.receiverId === authUser._id
    ) {
      try {
        await axiosInstance.post(`/messages/view/${message._id}`);
        // Socket event will handle the UI update
      } catch (error) {
        console.error("Error marking message as viewed:", error);
      }
    }
  };

  useEffect(() => {
    getMessages(selectedUser._id);

    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [
    selectedUser._id,
    getMessages,
    subscribeToMessages,
    unsubscribeFromMessages,
  ]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isReceiver = message.receiverId === authUser._id;
          const shouldHideContent =
            message.isViewOnce && !message.isViewed && isReceiver;
          const isViewedOnce = message.isViewOnce && message.isViewed;

          return (
            <div
              key={message._id}
              className={`chat ${
                message.senderId === authUser._id ? "chat-end" : "chat-start"
              }`}
              ref={messageEndRef}
            >
              <div className="chat-image avatar">
                <div className="size-10 rounded-full border">
                  <img
                    src={
                      message.senderId === authUser._id
                        ? authUser.profilePic || "/avatar.png"
                        : selectedUser.profilePic || "/avatar.png"
                    }
                    alt="profile pic"
                  />
                </div>
              </div>
              <div className="chat-header mb-1">
                <time className="text-xs opacity-50 ml-1">
                  {formatMessageTime(message.createdAt)}
                </time>
                {message.isViewOnce && (
                  <span
                    className={`ml-2 text-xs flex items-center gap-1 ${
                      message.isViewed ? "text-base-content/50" : "text-primary"
                    }`}
                  >
                    <Eye size={12} />
                    {message.isViewed ? "Viewed" : "View once"}
                  </span>
                )}
              </div>
              <div
                className={`chat-bubble flex flex-col relative ${
                  shouldHideContent
                    ? "cursor-pointer hover:opacity-90 min-h-[60px] min-w-[100px]"
                    : ""
                }`}
                onClick={() => handleViewOnceMessage(message)}
              >
                {shouldHideContent ? (
                  <div className="absolute inset-0 bg-base-300/50 flex items-center justify-center rounded-lg">
                    <div className="flex flex-col items-center gap-2">
                      <Eye className="w-6 h-6" />
                      <span className="text-sm">Click to view</span>
                    </div>
                  </div>
                ) : (
                  <>
                    {message.image && !isViewedOnce && (
                      <img
                        src={message.image}
                        alt="Attachment"
                        className="sm:max-w-[200px] rounded-md mb-2"
                      />
                    )}
                    {isViewedOnce ? (
                      <p className="opacity-50">**</p>
                    ) : (
                      message.text && <p>{message.text}</p>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <MessageInput />
    </div>
  );
};
export default ChatContainer;

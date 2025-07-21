const MessageNotification = ({ sender, message }) => {
  return (
    <div className="flex items-center gap-3">
      <img
        src={sender.profilePic || "/avatar.png"}
        alt={sender.fullName}
        className="w-10 h-10 rounded-full object-cover"
      />
      <div>
        <p className="font-medium">{sender.fullName}</p>
        <p className="text-sm opacity-70">
          {message.text || "Sent you an image"}
        </p>
      </div>
    </div>
  );
};

export default MessageNotification;

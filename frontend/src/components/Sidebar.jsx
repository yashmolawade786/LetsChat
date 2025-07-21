import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, Pin } from "lucide-react";

const Sidebar = () => {
  const {
    getUsers,
    users,
    selectedUser,
    setSelectedUser,
    isUsersLoading,
    unreadCounts,
    pinnedChats,
    pinChat,
    unpinChat,
  } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  const filteredUsers = showOnlineOnly
    ? users.filter((user) => onlineUsers.includes(user._id))
    : users;

  // Helper: get latest activity (for now, use unreadCounts as fallback, or sort alphabetically)
  // In a real app, you would use the last message timestamp per chat.
  const getActivity = (user) => unreadCounts[user._id] || 0;

  // Split and sort chats
  const pinned = filteredUsers
    .filter((u) => pinnedChats.includes(u._id))
    .sort((a, b) => getActivity(b) - getActivity(a));
  const unpinned = filteredUsers
    .filter((u) => !pinnedChats.includes(u._id))
    .sort((a, b) => getActivity(b) - getActivity(a));
  const sortedUsers = [...pinned, ...unpinned];

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2">
          <Users className="size-6" />
          <span className="font-medium hidden lg:block">Contacts</span>
        </div>
        <div className="mt-3 hidden lg:flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="text-sm">Show online only</span>
          </label>
          <span className="text-xs text-zinc-500">
            ({onlineUsers.length - 1} online)
          </span>
        </div>
      </div>

      <div className="overflow-y-auto w-full py-3">
        {/* Pinned label */}
        {pinned.length > 0 && (
          <div className="px-4 py-1 text-xs font-semibold text-primary/80 uppercase tracking-wider mb-1">
            Pinned
          </div>
        )}
        {pinned.map((user) => (
          <button
            key={user._id}
            onClick={() => setSelectedUser(user)}
            className={`
              group relative w-full p-3 flex items-center gap-3
              hover:bg-base-300 transition-colors
              ${
                selectedUser?._id === user._id
                  ? "bg-base-300 ring-1 ring-base-300"
                  : ""
              }
            `}
          >
            <div className="relative mx-auto lg:mx-0">
              <img
                src={user.profilePic || "/avatar.png"}
                alt={user.name}
                className="size-12 object-cover rounded-full"
              />
              {onlineUsers.includes(user._id) && (
                <span
                  className="absolute bottom-0 right-0 size-3 bg-green-500 
                  rounded-full ring-2 ring-zinc-900"
                />
              )}
            </div>
            <div className="hidden lg:block text-left min-w-0">
              <div className="font-medium truncate">{user.fullName}</div>
              <div className="text-sm text-zinc-400">
                {onlineUsers.includes(user._id) ? "Online" : "Offline"}
              </div>
            </div>
            {unreadCounts[user._id] > 0 && (
              <div className="absolute top-2 right-2 min-w-5 h-5 flex items-center justify-center rounded-full bg-primary text-primary-content text-xs px-1.5">
                {unreadCounts[user._id]}
              </div>
            )}
            {/* Pin/Unpin button - change from <button> to <span> for valid nesting */}
            <span
              role="button"
              tabIndex={0}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-1 rounded hover:bg-base-200 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                pinnedChats.includes(user._id)
                  ? unpinChat(user._id)
                  : pinChat(user._id);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  pinnedChats.includes(user._id)
                    ? unpinChat(user._id)
                    : pinChat(user._id);
                }
              }}
              aria-label={
                pinnedChats.includes(user._id) ? "Unpin chat" : "Pin chat"
              }
            >
              <Pin
                size={18}
                fill={pinnedChats.includes(user._id) ? "currentColor" : "none"}
              />
            </span>
          </button>
        ))}
        {/* Chats label for unpinned chats if there are pinned chats */}
        {pinned.length > 0 && unpinned.length > 0 && (
          <div className="px-4 py-1 text-xs font-semibold text-base-content/60 uppercase tracking-wider mt-2 mb-1">
            Chats
          </div>
        )}
        {unpinned.map((user) => (
          <button
            key={user._id}
            onClick={() => setSelectedUser(user)}
            className={`
              group relative w-full p-3 flex items-center gap-3
              hover:bg-base-300 transition-colors
              ${
                selectedUser?._id === user._id
                  ? "bg-base-300 ring-1 ring-base-300"
                  : ""
              }
            `}
          >
            <div className="relative mx-auto lg:mx-0">
              <img
                src={user.profilePic || "/avatar.png"}
                alt={user.name}
                className="size-12 object-cover rounded-full"
              />
              {onlineUsers.includes(user._id) && (
                <span
                  className="absolute bottom-0 right-0 size-3 bg-green-500 
                  rounded-full ring-2 ring-zinc-900"
                />
              )}
            </div>
            <div className="hidden lg:block text-left min-w-0">
              <div className="font-medium truncate">{user.fullName}</div>
              <div className="text-sm text-zinc-400">
                {onlineUsers.includes(user._id) ? "Online" : "Offline"}
              </div>
            </div>
            {unreadCounts[user._id] > 0 && (
              <div className="absolute top-2 right-2 min-w-5 h-5 flex items-center justify-center rounded-full bg-primary text-primary-content text-xs px-1.5">
                {unreadCounts[user._id]}
              </div>
            )}
            <span
              role="button"
              tabIndex={0}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-1 rounded hover:bg-base-200 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                pinnedChats.includes(user._id)
                  ? unpinChat(user._id)
                  : pinChat(user._id);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  pinnedChats.includes(user._id)
                    ? unpinChat(user._id)
                    : pinChat(user._id);
                }
              }}
              aria-label={
                pinnedChats.includes(user._id) ? "Unpin chat" : "Pin chat"
              }
            >
              <Pin
                size={18}
                fill={pinnedChats.includes(user._id) ? "currentColor" : "none"}
              />
            </span>
          </button>
        ))}

        {filteredUsers.length === 0 && (
          <div className="text-center text-zinc-500 py-4">No online users</div>
        )}
      </div>
    </aside>
  );
};
export default Sidebar;

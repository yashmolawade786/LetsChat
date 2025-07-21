const NOTIFICATION_SOUND = new Audio("/notification.mp3");

export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) {
    console.log("Browser does not support notifications");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
};

export const showNotification = async (title, body, icon = "/logo.png") => {
  const hasPermission = await requestNotificationPermission();

  if (hasPermission) {
    try {
      // Play notification sound
      NOTIFICATION_SOUND.play().catch(console.error);

      // Show browser notification
      const notification = new Notification(title, {
        body,
        icon,
        badge: icon,
      });

      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000);

      // Handle notification click
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error("Error showing notification:", error);
    }
  }
};

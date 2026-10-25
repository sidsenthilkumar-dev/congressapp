import * as Notifications from "expo-notifications";
import { validReminderSchedule } from "./config";
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});
const marker = "rebound-weekly-v1";
export async function scheduleReminders(value: unknown) {
  const schedule = validReminderSchedule(value);
  const current = await Notifications.getPermissionsAsync();
  const allowed =
    current.granted || (await Notifications.requestPermissionsAsync()).granted;
  if (!allowed)
    throw Error(
      "Notification permission was not granted. You can change it in iPhone Settings.",
    );
  const previous = (
    await Notifications.getAllScheduledNotificationsAsync()
  ).filter((n) => n.content.data?.owner === marker);
  const created: string[] = [];
  try {
    for (const day of schedule.days)
      created.push(
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "A little time for you",
            body: "Your planned movement time is here. Open Rebound and check how you feel.",
            sound: true,
            data: {
              owner: marker,
              day,
              hour: schedule.hour,
              minute: schedule.minute,
            },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: day + 1,
            hour: schedule.hour,
            minute: schedule.minute,
          },
        }),
      );
    for (const notification of previous)
      await Notifications.cancelScheduledNotificationAsync(
        notification.identifier,
      );
  } catch (error) {
    for (const id of created)
      await Notifications.cancelScheduledNotificationAsync(id);
    throw error;
  }
  return created.length;
}
export async function cancelReminders() {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of all.filter((n) => n.content.data?.owner === marker))
    await Notifications.cancelScheduledNotificationAsync(n.identifier);
}
export async function readReminders() {
  const all = (await Notifications.getAllScheduledNotificationsAsync()).filter(
    (n) => n.content.data?.owner === marker,
  );
  if (!all.length) return null;
  return validReminderSchedule({
    days: all.map((n) => n.content.data?.day),
    hour: all[0].content.data?.hour,
    minute: all[0].content.data?.minute,
  });
}

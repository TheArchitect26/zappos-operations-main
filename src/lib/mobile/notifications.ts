export const MOBILE_NOTIFICATION_CATEGORIES = [
  "jobs",
  "incidents",
  "messages",
  "compliance",
  "sync",
  "system",
] as const;
export type MobileNotificationCategory = (typeof MOBILE_NOTIFICATION_CATEGORIES)[number];
export interface MobileNotificationPreference {
  category: MobileNotificationCategory;
  enabled: boolean;
  backgroundAllowed: boolean;
}

export function defaultMobileNotificationPreferences(): MobileNotificationPreference[] {
  return MOBILE_NOTIFICATION_CATEGORIES.map((category) => ({
    category,
    enabled: category !== "system",
    backgroundAllowed: false,
  }));
}

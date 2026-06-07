export interface UserPreferences {
  fast: boolean;
  multi: boolean;
  notif: boolean;
  dark: boolean;
  stats: boolean;
  popover: boolean;
}

export type SwitchId = keyof UserPreferences;

export interface SwitchItem {
  id: SwitchId;
  icon: React.ComponentType;
  name: string;
  desc: string;
}

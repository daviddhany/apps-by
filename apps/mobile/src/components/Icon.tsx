import { MaterialIcons } from "@expo/vector-icons";

// Maps the same icon-name vocabulary the web app uses (Material Symbols
// Outlined, snake_case) onto @expo/vector-icons' MaterialIcons set (the
// closest native-friendly equivalent — filled rather than outlined, but the
// same glyphs), so screen code reads identically to its web counterpart.
const NAME_MAP: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  auto_awesome: "auto-awesome",
  mic: "mic",
  attach_file: "attach-file",
  bolt: "bolt",
  arrow_forward: "arrow-forward",
  qr_code_scanner: "qr-code-scanner",
  chevron_right: "chevron-right",
  offline_bolt: "offline-bolt",
  check_circle: "check-circle",
  verified: "verified",
  arrow_back_ios_new: "arrow-back-ios-new",
  qr_code_2: "qr-code",
  more_vert: "more-vert",
  close: "close",
  add: "add",
  content_copy: "content-copy",
  check: "check",
  chat: "chat",
  send: "send",
  lock_open_right: "lock-open",
  explore: "explore",
  dashboard: "dashboard",
  person: "person",
  apps: "apps",
  archive: "archive",
  unarchive: "unarchive",
  delete_forever: "delete-forever",
  lock: "lock",
  public: "public",
};

export function Icon({ name, size = 20, color = "#e2e2e9" }: { name: string; size?: number; color?: string }) {
  const resolved = NAME_MAP[name] ?? "help-outline";
  return <MaterialIcons name={resolved} size={size} color={color} />;
}

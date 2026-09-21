import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { BottomSheet } from "./BottomSheet";
import { getServerUrlOverride, setServerUrlOverride } from "../api/serverUrlStore";
import { getApiBaseUrl } from "../api/config";
import { useThemeColors } from "../theme/ThemeContext";

/** Escape hatch for whatever the automatic LAN-IP detection in
 * src/api/config.ts gets wrong — a tunnel, an Android emulator (needs
 * 10.0.2.2, not localhost), a VPN, a firewalled network, etc. Find your
 * computer's address from the same terminal running `npm run dev`/`expo
 * start` (System Settings > Wi-Fi > Details on Mac, `ipconfig` on Windows,
 * or the LAN URL Expo itself prints) and type it in here. */
export function ServerAddressSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useThemeColors();
  const [value, setValue] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (visible) {
      setValue(getServerUrlOverride() ?? getApiBaseUrl());
      setSaved(false);
    }
  }, [visible]);

  async function save() {
    const trimmed = value.trim().replace(/\/+$/, "");
    if (!trimmed) return;
    await setServerUrlOverride(trimmed);
    setSaved(true);
  }

  async function reset() {
    await setServerUrlOverride(null);
    setValue(getApiBaseUrl());
    setSaved(true);
  }

  return (
    <BottomSheet visible={visible} title="Server address" onClose={onClose}>
      <View className="gap-3">
        <Text className="text-sm text-on-surface-variant">
          Your phone and computer need to be on the same Wi-Fi. If sign-in keeps failing, enter the address your computer is
          running the app server on — for example http://192.168.1.23:3000.
        </Text>
        <TextInput
          value={value}
          onChangeText={(t) => {
            setValue(t);
            setSaved(false);
          }}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          placeholder="http://192.168.1.23:3000"
          placeholderTextColor={colors.outline}
          className="rounded-2xl bg-surface-container-low px-4 py-3 text-base text-on-surface"
        />
        {saved ? <Text className="text-sm text-secondary">Saved. Try signing in again.</Text> : null}
        <View className="flex-row gap-2">
          <Pressable onPress={reset} className="flex-1 items-center rounded-full border border-outline-variant/40 py-3">
            <Text className="font-semibold text-on-surface-variant">Reset to default</Text>
          </Pressable>
          <Pressable onPress={save} className="flex-1 items-center rounded-full bg-primary py-3">
            <Text className="font-semibold text-on-primary">Save</Text>
          </Pressable>
        </View>
      </View>
    </BottomSheet>
  );
}

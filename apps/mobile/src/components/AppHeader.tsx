import { View, Text, Pressable, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Icon } from "./Icon";
import { useTheme, useThemeColors } from "../theme/ThemeContext";

export function AppHeader({
  title,
  subtitle,
  showBack,
  initial = "N",
}: {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  initial?: string;
}) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const colors = useThemeColors();
  const { theme, toggleTheme } = useTheme();

  return (
    <View style={{ paddingTop: insets.top }} className="border-b border-outline-variant/40 bg-surface/95">
      <View className="h-16 flex-row items-center justify-between gap-3 px-4">
        <View className="flex-1 flex-row items-center gap-3">
          {showBack ? (
            <Pressable
              onPress={() => navigation.goBack()}
              className="h-11 w-11 -ml-1.5 items-center justify-center rounded-full active:bg-surface-container-high"
            >
              <Icon name="arrow_back_ios_new" size={20} color={colors["on-surface"]} />
            </Pressable>
          ) : (
            <Image source={require("../../assets/logo.png")} className="h-8 w-8" resizeMode="contain" />
          )}
          <View className="flex-1">
            <Text numberOfLines={1} className="text-lg font-bold tracking-tight text-on-surface">
              {title}
            </Text>
            {subtitle ? (
              <Text numberOfLines={1} className="text-xs font-medium tracking-wide text-on-surface-variant">
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>
        <Pressable
          onPress={toggleTheme}
          accessibilityLabel={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          className="h-9 w-9 items-center justify-center rounded-full active:bg-surface-container-high"
        >
          <Icon name={theme === "dark" ? "light_mode" : "dark_mode"} size={20} color={colors["on-surface-variant"]} />
        </Pressable>
        <View className="h-8 w-8 items-center justify-center rounded-full bg-primary-fixed">
          <Text className="text-xs font-bold text-on-primary-fixed">{initial.slice(0, 1).toUpperCase()}</Text>
        </View>
      </View>
    </View>
  );
}

import { View, Text, Pressable, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Icon } from "./Icon";

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

  return (
    <View style={{ paddingTop: insets.top }} className="border-b border-black/5 bg-surface/95">
      <View className="h-16 flex-row items-center justify-between gap-3 px-4">
        <View className="flex-1 flex-row items-center gap-3">
          {showBack ? (
            <Pressable
              onPress={() => navigation.goBack()}
              className="h-11 w-11 -ml-1.5 items-center justify-center rounded-full active:bg-surface-container-high"
            >
              <Icon name="arrow_back_ios_new" size={20} color="#111c2d" />
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
        <View className="h-8 w-8 items-center justify-center rounded-full bg-primary-fixed">
          <Text className="text-xs font-bold text-on-primary-fixed">{initial.slice(0, 1).toUpperCase()}</Text>
        </View>
      </View>
    </View>
  );
}

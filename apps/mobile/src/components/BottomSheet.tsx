import { Modal, View, Text, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "./Icon";

export function BottomSheet({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <Pressable onPress={(e) => e.stopPropagation()} style={{ paddingBottom: insets.bottom + 24 }} className="rounded-t-[28px] bg-surface-container-lowest p-5">
            <View className="mx-auto mb-4 h-1 w-10 rounded-full bg-black/10" />
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-on-surface">{title}</Text>
              <Pressable onPress={onClose} className="h-7 w-7 items-center justify-center rounded-full bg-surface-container">
                <Icon name="close" size={16} color="#111c2d" />
              </Pressable>
            </View>
            {children}
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

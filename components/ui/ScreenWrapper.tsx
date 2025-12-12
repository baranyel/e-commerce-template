import React from "react";
import { View, ViewProps, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ScreenWrapperProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
  bg?: string;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  className,
  bg = "bg-gray-50",
  style,
  ...props
}) => {
  return (
    <SafeAreaView className={`flex-1 ${bg}`} edges={['top', 'left', 'right']}>
      <View className={`flex-1 items-center w-full ${className || ""}`} {...props}>
        <View
          className="flex-1 w-full"
          style={[
            style,
            Platform.OS === "web" ? { maxWidth: 1200, width: "100%" } : {},
          ]}
        >
          {children}
        </View>
      </View>
    </SafeAreaView>
  );
};

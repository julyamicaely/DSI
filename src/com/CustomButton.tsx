import React from "react";
import { TouchableOpacity, Text, StyleSheet, GestureResponderEvent, DimensionValue } from "react-native";
import colors from './Colors'

interface CustomButtonProps {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  outline?: boolean;
  width?: DimensionValue;
  borderWidth?: number;
  height?: DimensionValue;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  backgroundColor = colors.red,
  textColor = "#fff",
  borderColor = colors.red,
  outline = false,
  width = 350,
  height = 50,
  borderWidth = 4,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: outline ? "transparent" : backgroundColor,
          borderColor: borderColor,
          borderWidth: outline ? borderWidth : 0,
          width,
          height,
        },
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.text,
          { color: outline ? borderColor : textColor },
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export default CustomButton;
const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },
  text: {
    fontSize: 18,
    fontWeight: "bold",
  },
});

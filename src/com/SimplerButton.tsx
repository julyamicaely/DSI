import React from "react";
import { TouchableOpacity, Text, StyleSheet, GestureResponderEvent, DimensionValue } from "react-native";
import colors from '../com/Colors'

interface CustomButtonProps {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  outline?: boolean;
  width?: DimensionValue;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  backgroundColor = "#A42020",
  textColor = "#fff",
  borderColor = "#A42020",
  outline = false,
  width = 350,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: outline ? "transparent" : backgroundColor,
          borderColor: borderColor,
          borderWidth: outline ? 2 : 0,
          width,
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
  },
  text: {
    fontSize: 18,
    fontWeight: "bold",
  },
});

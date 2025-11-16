import React from "react";
import { TouchableOpacity, Text, StyleSheet, GestureResponderEvent, DimensionValue } from "react-native";
import colors from '../components/Colors'

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
  borderRadius?: number;
  padding?: number;
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
  borderWidth = 0,
  padding = 0,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: backgroundColor,
          borderColor: borderColor,
          borderWidth: borderWidth,
          width,
          height,
          padding,
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

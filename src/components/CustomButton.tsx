import React from "react";
import { TouchableOpacity, Text, StyleSheet, GestureResponderEvent, DimensionValue, View } from "react-native";
import colors from './Colors'
import { Ionicons } from '@expo/vector-icons';

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
  iconName?: React.ComponentProps<typeof Ionicons>['name'];
  iconColor?: string;
  color?: string; // Adicionado para compatibilidade
}

const CustomButton = ({
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
  iconName,
  iconColor,
  color, // Recebe a prop color
}: CustomButtonProps) => {
  // Usa color se backgroundColor não for passado explicitamente ou para sobrescrever?
  // O erro dizia que 'color' foi passado. Vamos usar 'color' como fallback ou prioridade para backgroundColor.
  // Se o usuário passar 'color', provavelmente quer definir a cor de fundo (como no Button nativo).
  const finalBackgroundColor = color || backgroundColor;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: finalBackgroundColor,
          borderColor: borderColor,
          borderWidth: borderWidth,
          width,
          height,
          padding,
        },
      ]}
      onPress={onPress}
    >
      <View style={styles.content}>
        {iconName && <Ionicons name={iconName} size={20} color={iconColor || textColor} style={styles.icon} />}
        <Text
          style={[
            styles.text,
            { color: outline ? borderColor : textColor },
          ]}
        >
          {title}
        </Text>
      </View>
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
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontSize: 18,
    fontWeight: "bold",
  },
});

import React, { useState } from 'react';
import { StyleSheet, TextInput, View, TextInputProps, StyleProp, ViewStyle, DimensionValue } from 'react-native';
import colors from './Colors';

interface CustomTextInputProps extends TextInputProps {
  placeholder?: string;
  backgroundColor?: string;
  borderRadius?: number;
  containerStyle?: StyleProp<ViewStyle>;
  placeholderTextColor?: string;
  onFocus?: (e: any) => void;
  onBlur?: (e: any) => void;
  outlineColor?: string;
  focusedBackgroundColor?: string;
  blurredBackgroundColor?: string;
  width?: DimensionValue;
}

const CustomTextInput: React.FC<CustomTextInputProps> = ({
  placeholder,
  backgroundColor,
  borderRadius,
  onFocus,
  onBlur,
  containerStyle,
  placeholderTextColor,
  outlineColor,
  focusedBackgroundColor,
  blurredBackgroundColor,
  width,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    if (onFocus) {
      onFocus(e);
    }
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (onBlur) {
      onBlur(e);
    }
  };

  const containerBackgroundColor = isFocused
    ? (focusedBackgroundColor || colors.white)
    : (blurredBackgroundColor || backgroundColor || colors.lightestBlue);

  const borderColor = isFocused ? (outlineColor || colors.blue) : (outlineColor || '#A6B6FF');

  return (
    <View style={[styles.container, { backgroundColor: containerBackgroundColor, borderRadius: borderRadius || 8, borderColor: borderColor }, width ? { width } : undefined, containerStyle]}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholderTextColor={placeholderTextColor || colors.lightBlue}
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 322,
    height: 44,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginVertical: 6,
  },
  input: {
    width: '100%',
    height: '100%',
    color: '#000',
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Roboto',
    fontWeight: '400',
  },
});

export default CustomTextInput;
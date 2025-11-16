import React, { useState } from 'react';
import { StyleSheet, TextInput, View, TextInputProps } from 'react-native';
import colors from './Colors';

interface CustomTextInputProps extends TextInputProps {
  placeholder?: string;
  backgroundColor?: string;
  borderRadius?: number;
}

const CustomTextInput: React.FC<CustomTextInputProps> = ({ 
  placeholder, 
  backgroundColor, 
  borderRadius, 
  onFocus, 
  onBlur, 
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
    ? colors.white 
    : (backgroundColor || colors.lightestBlue);

  return (
    <View style={[styles.container, { backgroundColor: containerBackgroundColor, borderRadius: borderRadius || 8 }]}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#A6B6FF"
        onFocus={handleFocus}
        onBlur={handleBlur}
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
    borderColor: '#A6B6FF',
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
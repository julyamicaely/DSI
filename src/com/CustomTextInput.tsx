import React from 'react';
import { StyleSheet, TextInput, View, TextInputProps } from 'react-native';
import colors from './Colors';

interface CustomTextInputProps extends TextInputProps {
  placeholder?: string;
  backgroundColor?: string;
  borderRadius?: number;
}

const CustomTextInput: React.FC<CustomTextInputProps> = ({ placeholder, backgroundColor, borderRadius, ...props }) => {
  return (
    <View style={[styles.container, { backgroundColor: backgroundColor || colors.lightestBlue, borderRadius }]}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#A6B6FF"
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
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginVertical: 6,
  },
  input: {
    width: '100%',
    height: '100%',
    color: '#000', // A cor do texto digitado
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Roboto',
    fontWeight: '400',
  },
});

export default CustomTextInput;
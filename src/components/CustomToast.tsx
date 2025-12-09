// components/CustomToast.tsx
import React from 'react';
import { BaseToast, ErrorToast } from 'react-native-toast-message';
import Colors from './Colors';

export const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: Colors.blue, backgroundColor: Colors.lightestBlue }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 15,
        fontWeight: '600',
        color: Colors.darkGray
      }}
      text2Style={{
        fontSize: 13,
        color: Colors.gray
      }}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{ borderLeftColor: Colors.red, backgroundColor: Colors.lightestBlue }}
      text1Style={{
        fontSize: 15,
        fontWeight: '600',
        color: Colors.darkGray
      }}
      text2Style={{
        fontSize: 13,
        color: Colors.gray
      }}
    />
  ),
  info: (props: any) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: Colors.lightBlue, backgroundColor: Colors.lightestBlue }}
      text1Style={{
        fontSize: 15,
        fontWeight: '600',
        color: Colors.darkGray
      }}
      text2Style={{
        fontSize: 13,
        color: Colors.gray
      }}
    />
  ),
};
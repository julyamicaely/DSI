// src/types/declarations.d.ts

// Declaração para react-native-root-toast
declare module 'react-native-root-toast' {
  // ... (código da declaração do Toast) ...
  interface ToastOptions {
    duration?: number;
    position?: number;
    delay?: number;
    onShow?: () => void;
    onShown?: () => void;
    onHide?: () => void;
    onHidden?: () => void;
    animation?: boolean;
    hideOnPress?: boolean;
    backgroundColor?: string;
    shadow?: boolean;
    opacity?: number;
    textColor?: string;
    textStyle?: TextStyle;
    containerStyle?: ViewStyle;
  }

  export default class Toast {
    static show(message: string, options?: ToastOptions): number;
    static hide(toastId: number): void;
    static durations: {
      LONG: number;
      SHORT: number;
      BOTTOM: number;
      CENTER: number;
      TOP: number;
    };
  }
}

// Declaração para react-native-picker-select
declare module 'react-native-picker-select' {
  import * as React from 'react';
  import { TextStyle, ViewStyle } from 'react-native';

  interface Item {
    label: string;
    value: any;
    key?: string | number;
    color?: string;
    disabled?: boolean;
    displayValue?: boolean;
  }

  interface PickerSelectProps {
    onValueChange: (value: any, index: number) => void;
    items: Item[];
    placeholder?: Item | {};
    value?: any;
    disabled?: boolean;
    style?: {
      inputIOS?: TextStyle;
      inputAndroid?: TextStyle;
      inputWeb?: TextStyle;
      iconContainer?: ViewStyle;
      modalViewMiddle?: ViewStyle;
    };
    useNativeAndroidPickerStyle?: boolean;
    textInputProps?: object;
    Icon?: React.ComponentType | React.ReactElement;
  }

  const RNPickerSelect: React.FC<PickerSelectProps>;
  export default RNPickerSelect;
}
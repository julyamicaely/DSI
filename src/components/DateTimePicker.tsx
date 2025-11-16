import React from 'react';
import { Button, Text, View } from 'react-native';
import { DateTimePickerAndroid, DateTimePickerEvent } from '@react-native-community/datetimepicker';

type DateTimePickerComponentProps = {
  date: Date;
  onChange: (event: DateTimePickerEvent, selectedDate?: Date) => void;
  habitTime: Date | null;
};

export const DateTimePickerComponent = ({ date, onChange, habitTime }: DateTimePickerComponentProps) => {

  const showMode = (currentMode: 'time') => {
    DateTimePickerAndroid.open({
      value: date,
      onChange,
      mode: currentMode,
      is24Hour: true,
    });
  };

  const showTimepicker = () => {
    showMode('time');
  };

  const timeSetter = () => {
    if (!habitTime) {
      return null;
    }
    const timeToDisplay = habitTime || date;
    return timeToDisplay.toLocaleTimeString().split(':').map(Number).slice(0,2).map((unit) => unit < 10 ? `0${unit}` : unit).join(':');
  }

  const selectedTime = timeSetter();

  return showTimepicker();
};
import { Alert, Platform } from 'react-native';

type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel: string;
  destructive?: boolean;
};

function webText(title: string, message?: string) {
  return message ? `${title}\n\n${message}` : title;
}

export function confirmAction({ title, message, confirmLabel, destructive }: ConfirmOptions) {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(webText(title, message)));
  }

  return new Promise<boolean>((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        {
          text: confirmLabel,
          style: destructive ? 'destructive' : 'default',
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

export function showMessage(title: string, message?: string) {
  if (Platform.OS === 'web') {
    window.alert(webText(title, message));
  } else {
    Alert.alert(title, message);
  }
}

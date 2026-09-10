import Snackbar from 'react-native-snackbar';

export type SnackbarType = 'error' | 'success' | 'info';

export const showSnackbar = (
  message: string,
  type: SnackbarType = 'info',
  actionText: string = 'OK'
): void => {
  let backgroundColor = '#323232';
  if (type === 'error') {
    backgroundColor = '#dc2626'; // Deep Red
  } else if (type === 'success') {
    backgroundColor = '#16a34a'; // Vibrant Green
  } else if (type === 'info') {
    backgroundColor = '#2563eb'; // Royal Blue
  }

  Snackbar.show({
    text: message,
    duration: Snackbar.LENGTH_LONG,
    backgroundColor,
    textColor: '#ffffff',
    action: {
      text: actionText,
      textColor: '#ffffff',
      onPress: () => Snackbar.dismiss(),
    },
  });
};

export const showErrorSnackbar = (message: string): void => showSnackbar(message, 'error');
export const showSuccessSnackbar = (message: string): void => showSnackbar(message, 'success');
export const showInfoSnackbar = (message: string): void => showSnackbar(message, 'info');

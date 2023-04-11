import Toast from 'react-native-root-toast';

const showToast = (message: string, style: 'warning') => {
  return Toast.show(message, {
    duration: Toast.durations.LONG,
    position: Toast.positions.BOTTOM,
    shadow: true,
    animation: true,
    hideOnPress: true,
    delay: 0,
    backgroundColor: style === 'warning' ? 'yellow' : 'black',
    textColor: style === 'warning' ? 'black' : 'white'
  });
};

export default showToast;
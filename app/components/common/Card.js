import { View } from 'react-native';

export const Card = ({ children, style }) => {
  return (
    <View style={[{
      backgroundColor: 'white',
      borderRadius: 20,
      padding: 20,
      marginHorizontal: 16,
      // ...Platform.select({
      //   ios: {
      //     shadowColor: '#000',
      //     shadowOffset: { width: 0, height: 2 },
      //     shadowOpacity: 0.1,
      //     shadowRadius: 8,
      //   },
      //   android: {
      //     elevation: 4,
      //   },
      // }),
    }, style]}>
      {children}
    </View>
  );
};
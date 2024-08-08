import { View } from 'react-native';
import Spotcheck from 'spotcheck';

export const spotcheck = (
  <Spotcheck
    domainName="kalaiselvank4570.surveysparrow.com"
    targetToken="tar-epahqUppfe85F24rcmqY5a"
    userDetails={{}}
  />
);

export default function Spotchecks() {
  return (
    <View
      style={{ position: 'absolute', flex: 1, height: '100%', width: '100%' }}
    >
      {spotcheck}
    </View>
  );
}

import { View } from 'react-native';
import Spotcheck from 'spotcheck';

export default function Spotchecks() {
  return (
    <View
      style={{ position: 'absolute', flex: 1, height: '100%', width: '100%' }}
    >
      <Spotcheck
        domainName="<your-domain-name>"
        targetToken="<your-target-token>"
        userDetails={{}}
      />
    </View>
  );
}

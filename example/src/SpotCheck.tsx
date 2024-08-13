import { View } from 'react-native';
import Spotcheck from 'spotcheck';

export default function Spotchecks() {
  return (
    <View
      style={{ position: 'absolute', flex: 1, height: '100%', width: '100%' }}
    >
      <Spotcheck
        domainName="kalaiprojects.surveysparrow.com"
        targetToken="tar-5AB5te8uZgK7rShTQrcods"
        userDetails={{}}
      />
    </View>
  );
}

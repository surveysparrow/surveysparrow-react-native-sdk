import * as React from 'react';

import { StyleSheet, View, Button } from 'react-native';
import {
  SsSurveyViewComponent,
  SsSurvey,
  onSurveyResponseListener,
  ScheduleSsSurvey,
  ClearScheduleSsSurvey,
} from 'surveysparrow-react-native-sdk';

export default function App() {
  React.useEffect(() => {
    const sub = onSurveyResponseListener.addListener(
      'onSurveyResponse',
      (data: any) => {
        console.log('survey response is', data);
      }
    );
    return () => sub.remove();
  }, []);

  const surveyConfig = {
    domain: 'sachin.noforms.io',
    token: 'tt-cf72a7',
    surveyType: 'classic',
  };

  return (
    <View style={styles.container}>
      <Button
        title="Schedule Survey"
        onPress={() => {
          ScheduleSsSurvey(surveyConfig);
        }}
      />
      <Button
        title="Clear Schedule Survey"
        onPress={() => {
          ClearScheduleSsSurvey(surveyConfig);
        }}
      />
      <Button
        title="Open Survey"
        onPress={() => {
          SsSurvey(surveyConfig);
        }}
      />
      <SsSurveyViewComponent
        styles={styles.box}
        config={{
          domain: 'sachin.noforms.io',
          token: 'tt-cf72a7',
          surveyType: 'classic',
          customParams: [
            { name: 'testname', value: 'custom value 10' },
            { name: 'testname2', value: 'custom value 2' },
          ],
        }}
        onSurveyComplete={(data) => {
          console.log('survey response from embed survey is', data);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: '100%',
    height: 400,
  },
});

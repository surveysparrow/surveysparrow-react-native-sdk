import React from 'react';
import type {Node} from 'react';
import {SafeAreaView, StyleSheet, Button, View} from 'react-native';
import {
  SurveySparrow,
  invokeSurveySparrow,
  onSurveyResponseListener,
} from 'surveysparrow-react-native-sdk';

const App: () => Node = () => {
  React.useEffect(() => {
    const sub = onSurveyResponseListener.addListener(
      'onSurveyResponse',
      data => {
        console.log('survey response is', data);
      },
    );
    return () => sub.remove();
  }, []);

  const surveyConfig = {
    domain: 'domain-name',
    token: 'survey-token',
    surveyType: 'survey-type',
  };

  return (
    <View style={styles.container}>
      <Button
        title="Open Survey"
        onPress={() => {
          invokeSurveySparrow(surveyConfig);
        }}
      />
      <SurveySparrow
        styles={styles.box}
        config={{
          domain: 'domain-name',
          token: 'survey-token',
          surveyType: 'survey-type',
          customParams: [
            {name: 'testname', value: 'custom value 10'},
            {name: 'testname2', value: 'custom value 2'},
          ],
        }}
        onSurveyComplete={data => {
          console.log('survey response from embed survey is', data);
        }}
      />
    </View>
  );
};

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

export default App;

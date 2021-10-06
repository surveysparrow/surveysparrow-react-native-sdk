# surveysparrow-react-native-sdk

react native sdk for survey sparrow

## Installation

```sh
npm install surveysparrow-react-native-sdk
```

## Usage

```js
import {
  SsSurveyViewComponent,
  SsSurvey,
  onSurveyResponseListener,
  ScheduleSsSurvey,
  ClearScheduleSsSurvey,
} from 'surveysparrow-react-native-sdk';

// Embedded Survey

      <SsSurveyViewComponent
        styles={styles.box}
        config={{
          domain: 'domain-name',
          token: 'survey-token',
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
//  Full Survey

      <Button
        title="Open Survey"
        onPress={() => {
          SsSurvey({
            domain: 'domain-name',
            token: 'survey-token',
            surveyType: 'classic',
        });
        }}
      />
// Schedule Survey
      <Button
        title="Open Survey"
        onPress={() => {
            ScheduleSsSurvey({
                domain: 'domain-name',
                token: 'survey-token',
                surveyType: 'classic',
            });
        }}
      />
// clear schedule
<Button
        title="Open Survey"
        onPress={() => {
            ClearScheduleSsSurvey({
                domain: 'domain-name',
                token: 'survey-token',
                surveyType: 'classic',
            });
        }}
      />
// listining to survey complete event
  React.useEffect(() => {
    const sub = onSurveyResponseListener.addListener(
      'onSurveyResponse',
      (data: any) => {
        console.log('survey response is', data);
      }
    );
    return () => sub.remove();
  }, []);
```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

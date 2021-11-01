# surveysparrow-react-native-sdk
[SurveySparrow](https:://surveysparrow.com) React Native SDK enables you to collect feedback from your mobile app. Embed the Classic, Chat & NPS surveys in your React Native application seamlessly with few lines of code.

## Features
1. [Fully customizable pre-build `Full Size View` to take feedback whenever & wherever you want.](#Take-feedback-using-Activity)
2. [`Survey Component` to integrate the feedback experience anywhere in your app.](#Embed-survey-view)
3. [Schedule Surveys to take one-time or recurring feedbacks.](#Schedule-Surveys)


## Installation

```sh
npm install surveysparrow-react-native-sdk

yarn add surveysparrow-react-native-sdk
```

IOS

Add SurveySparrow IOS sdk in pod file and run pod install
```sh
pod 'SurveySparrowSdk', :git => 'https://github.com/surveysparrow/surveysparrow-ios-sdk.git', :tag => '0.2.0'
```
ANDROID

Android doesn't require any changes and note the min sdk version should be 19
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

## Methods

1) SsSurvey --> to invoke a full screen survey
2) ScheduleSsSurvey --> to schedule a survey
3) ClearScheduleSsSurvey --> to clear a schedule 

1) SsSurvey

| parameter | Description | Default |
| --- | --- | --- |
| domain | survey domain to load | value has to be provided |
| token | survey token for the survey | value has to be provided |
| surveyType | survey type for the survey | value has to be provided |
| customParams | any custom params to be passed for the survey | [] |
| thankYouPageTimeLimit | how long the full view has to be shown before closing | 3000 (ms) | 

2) ScheduleSsSurvey

| parameter | Description | Default |
| --- | --- | --- |
| domain | survey domain to load | value has to be provided |
| token | survey token for the survey | value has to be provided |
| surveyType | survey type for the survey | value has to be provided |
| customParams | any custom params to be passed for the survey | [] |
| thankYouPageTimeLimit | how long the full view has to be shown before closing | 3000 (ms) |
| alertTitle | dialouge box alert title | 'Rate us' |
| alertMessage | dialouge box alert message | 'Share your feedback and let us know how we are doing' |
| alertPositiveText | dialouge box positive text | 'Rate Now' |
| alertNegativeText | dialouge box negative text | 'Later' |
| startAfter | after how long the initial schedule has to happen | 259200000 |
| repeatInterval | after how long the schedule should repeat | 432000000 |
| repeatSurvey | if the schedule should repeat | false |
| incrementalRepeat | if schedule has to be a incremental repeat | false |

3) ClearScheduleSsSurvey

| parameter | Description | Default |
| --- | --- | --- |
| domain | survey domain to load | value has to be provided |
| token | survey token for the survey | value has to be provided |

## Event Listener
1) onSurveyResponseListener --> event listener which will be triggered after completeing the survey
## Component
1) SurveyModuleView --> component to render the survey in an emb

1) SurveyModuleView

| prop | Description | Default |
| --- | --- | --- |
| config | survey config such as domain,token,surveyType,customParams | config object has to be provided |
| onSurveyComplete | callback function that will be called after survey complete | null |
| styles | component styles | null |

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

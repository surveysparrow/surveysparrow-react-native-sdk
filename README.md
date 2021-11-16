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
  SurveySparrow,
  invokeSurveySparrow,
  onSurveyResponseListener,
  scheduleSurveySparrow,
  clearSurveySparrow,
} from 'surveysparrow-react-native-sdk';

// Embedded Survey
<SurveySparrow
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
    invokeSurveySparrow({
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
    scheduleSurveySparrow({
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
    clearSurveySparrow({
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

### 1) invokeSurveySparrow()
This method will be used to invoke Survey from SurveySparrow

| parameter | Description | Default | Optional |
| --- | --- | --- | -- |
| domain | survey domain to load | value has to be provided | no |
| token | survey token for the survey | value has to be provided | no |
| surveyType | survey type for the survey | value has to be provided | no |
| customParams | any custom params to be passed for the survey | [] | yes |
| thankYouPageTimeLimit | how long the full view has to be shown before closing | 3000 (ms) | yes | 

### 2) scheduleSurveySparrow()
This method will be used to schedule Survey from SurveySparrow

| parameter | Description | Default | Optional |
| --- | --- | --- | -- |
| domain | survey domain to load | value has to be provided | no |
| token | survey token for the survey | value has to be provided | no |
| surveyType | survey type for the survey | value has to be provided | no |
| customParams | any custom params to be passed for the survey | [] | yes |
| thankYouPageTimeLimit | how long the full view has to be shown before closing | 3000 (ms) | yes |
| alertTitle | dialouge box alert title | 'Rate us' | yes |
| alertMessage | dialouge box alert message | 'Share your feedback and let us know how we are doing' | yes |
| alertPositiveText | dialouge box positive text | 'Rate Now' | yes |
| alertNegativeText | dialouge box negative text | 'Later' | yes |
| startAfter | after how long the initial schedule has to happen | 259200000 | yes |
| repeatInterval | after how long the schedule should repeat | 432000000 | yes |
| repeatSurvey | if the schedule should repeat | false | yes |
| incrementalRepeat | if schedule has to be a incremental repeat | false | yes |

### 3) clearSurveySparrow()
This method will be used to clear the schedule that was previously set

| parameter | Description | Default | Optional |
| --- | --- | --- | -- |
| domain | survey domain to load | value has to be provided | no |
| token | survey token for the survey | value has to be provided | no |

## Event Listener
### 1) onSurveyResponseListener

| Listener name | Description |  Optional |
| --- | --- | --- |
| onSurveyResponse | this event listener will be triggered after completing the survey | yes |

## Component
### 1) SurveySparrow
This Component can be used to render a survey view

| prop | Description | Default | Optional |
| --- | --- | --- | --- |
| config | survey config such as domain,token,surveyType,customParams | config object has to be provided | no |
| onSurveyComplete | callback function that will be called after survey complete | null | yes |
| styles | component styles | null | yes |

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

> Please submit bugs/issues through GitHub issues we will try to fix it ASAP.
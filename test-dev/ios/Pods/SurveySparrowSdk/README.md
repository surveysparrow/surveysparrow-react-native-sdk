# Survey Sparrow iOS SDK

[SurveySparrow](https://surveysparrow.com) iOS SDK enables you to collect feedback from your mobile app. Embed the Classic, Chat & NPS surveys in your iOS application seamlessly with few lines of code.

> Mobile SDK share channel is only available from SurveySparrow **Premium** plan onwards.

## Features
1. [Full-screen feedback whenever & wherever you want.](#Full-screen-feedback)
2. [Integrate the feedback experience anywhere in your app.](#Embed-survey)
3. [Schedule Surveys to take one-time or recurring feedbacks.](#Schedule-Surveys)

## SDK integration (Deployment Target 9+)

### Add SurveySparrowSdk Framework
Add SurveySparrowSdk Framework to your project either by using CocoaPods or directly embedding binary
#### Using CocoaPods
Add the following line to your `Podfile` file under `target`
```pod
pod 'SurveySparrowSdk', :git => 'https://github.com/surveysparrow/surveysparrow-ios-sdk.git', :tag => '0.4.5'
```

#### Not using CocoaPods! Directly import SurveySparrowSdk
Add `SurveySparrowSdk.xcodeproj` or `SurveySparrowSdk.framework` to your project.

### Full-screen feedback
Take feedback using our pre-build `SsSurveyViewController` and get the response after submission by implementing the `SsSurveyDelegate`'s `handleSurveyResponse` protocol.

<img width="340" alt="SurveySparrow Android SDK full-screen view" src="https://user-images.githubusercontent.com/61273614/85126008-37b2a500-b24a-11ea-8b7d-1edd55ecc668.png">


#### Import framework
```swift
import SurveySparrowSdk
```
#### Create a [`SsSurveyViewController`](#SsSurveyViewController)
Create a `SsSurveyViewController` and set `domain` and `token`
```swift
let ssSurveyViewController = SsSurveyViewController()
ssSurveyViewController.domain = "<account-domain>"
ssSurveyViewController.token = "<sdk-token>"
```
#### Present the SsSurveyViewController
```swift
present(ssSurveyViewController, animated: true, completion: nil)
```

#### Handle the initial question load and the response from the survey
Implement the `SsSurveyDelegate` protocol to handle survey responses.
```swift
class ViewController: UIViewController, SsSurveyDelegate {
  //...
  func handleSurveyLoaded(response: [String : AnyObject]) {
    // This will be executed after the initial question in the survey is loaded
    // NOTE: 'ssSurveyViewController.getSurveyLoadedResponse' should be set to true for this to work
    print(response)
  }
  //...
  func handleSurveyResponse(response: [String : AnyObject]) {
    // Handle response here
    print(response)
  }
  func handleSurveyValidation(response: [String : AnyObject]) {
    // Get survey validation fail json here
    print(response)
  }
  //...
}
```
Also set surveyDelegate property of the `SsSurveyViewController` object to `self`
```swift
ssSurveyViewController.surveyDelegate = self
```

#### Handle survey validation

Handle survey validation using the [`SsSurveyView`](#SsSurveyView).


Add a `UIView` to storyboard and change the Class to `SsSurveyView` under *Identity Inspector* and also make sure that the Module is `SurveySparrowSdk`. Under *Attribute inspector*  provide `domain` and `token`. 

Now connect the `SsSurveyView` as an `IBOutlet`
```swift
@IBOutlet weak var ssSurveyView: SsSurveyView!
```
Use `loadFullscreenSurvey()` on  the `ssSurveyView` to load the survey in full screen view, this method will handle the survey validations along with survey pop up. If a survey is not valid the error json can be captured in `handleSurveyValidation` method 

```swift
ssSurveyView.loadFullscreenSurvey(parent: self,delegate: self,domain:"some-company.surveysparrow.com", token: "tt-7f76bd",params:["emailaddress":"example@gmail.com", "email":"example@gmail.com"] )
// Note : only params will be an optional field, email and emailaddress has to be passed in the params for creating a contact
```

### Embed survey 
Embed the feedback experience using the [`SsSurveyView`](#SsSurveyView).

<img width="340" alt="SurveySparrow Android SDK embed view" src="https://user-images.githubusercontent.com/61273614/85125981-2e293d00-b24a-11ea-8468-d56f1035dccb.png">

#### Add SsSurveyView
Add a `UIView` to storyboard and change the Class to `SsSurveyView` under *Identity Inspector* and also make sure that the Module is `SurveySparrowSdk`. Under *Attribute inspector*  provide `domain` and `token`. 

Now connect the `SsSurveyView` as an `IBOutlet`
```swift
@IBOutlet weak var ssSurveyView: SsSurveyView!
```
Then call `loadSurvey()` on  the `ssSurveyView` to load the survey
```swift
ssSurveyView.loadSurvey()
```
#### Handle survey validation

Use `loadEmbedSurvey()` on  the `ssSurveyView` to load the survey in Embed, this method will handle the survey validations along with survey embed. If a survey is not valid the error json can be captured in `handleSurveyValidation` method 

```swift
ssSurveyView.loadFullscreenSurvey(domain:"some-company.surveysparrow.com", token: "tt-7f76bd",params:["emailaddress":"example@gmail.com", "email":"example@gmail.com"] )
// Note : only params will be an optional field, email and emailaddress has to be passed in the params for creating a contact
```
#### Handle response
Implement `SsSurveyDelegate` protocol to handle responses.

### Schedule Surveys
Ask the user to take a feedback survey when they open your app/ a screen after a period of time.

<img width="340" alt="SurveySparrow Android SDK scheduling" src="https://user-images.githubusercontent.com/61273614/85126016-3d0fef80-b24a-11ea-8760-89bf3cca8af4.png">


Override viewDidAppear method and create a `SurveySparrow` object by passing domain and `token`. Then call `scheduleSurvey` method on the `SurveySparrow` object by passing the parent `ViewController` reference to schedule the survey.
```swift
override func viewDidAppear(_ animated: Bool) {
  super.viewDidAppear(animated)
  
  let surveySparrow = SurveySparrow(domain: "some-company.surveysparrow.com", token: "tt-7f76bd")
  surveySparrow.scheduleSurvey(parent: self)
}
```
Refer [SurveySparrow](#SurveySparrow) class for configuration options.

#### Handle response
Implement `SsSurveyDelegate` protocol to handle responses.

#### Clear a schedule
You can clear a schedule by calling the `surveySparrow.clearSchedule()` method.

#### How scheduling works
We will show a customized alert to take a feedback survey whenever the `scheduleSurvey` method called after the `startAfter` days and if the user declines to take the survey we will show the prompt after the `repeatInterval`.

**Example use case:** Add the above code to `viewDidAppear` method of your ViewController to ask the user to take a feedback survey 3 days after the user starts using your app, and if the user declines to take the survey we will continue to prompt at an interval of 5 days. If the user takes and complete the survey once we will not ask again.

**You can only create one schedule per token. Create multiple tokens if you want to create multiple schedules for same survey.*

### NPS survey 
Survey type can be changed to NPS by setting surveyType property to `.NPS`. You can also pass email as a custom param.

## Reference
### SsSurveyView
View to display embedded surveys
#### Public Properties
|Property|Description|Default Value|
|-----------|------|------|
|`domain: String`|Your SurveySparrow account domain|*|
|`token: String`|SDK token of the survey|*|
|`surveyType: SurveySparrow.SurveyType`|Type of the survey|`.CLASSIC`|
|`params: [String: String]`|Custom params for the survey| - |
|`getSurveyLoadedResponse: Bool`|Set to true to get handleSurveyLoaded response (available in version >= 0.3.0)|false|
|`surveyDelegate: SsSurveyDelegate`|Protocol to handle survey response| - |

#### Public methods
|Method|Description|
|-----------|------|
|`loadSurvey(domain: String?, token: String?)`|Load survey in SsSurveyView|

### SsSurveyViewController
ViewController to take full-screen feedback
#### Public Properties
|Property|Description|Default Value|
|-----------|------|---|
|`domain: String`|Your SurveySparrow account domain| * |
|`token: String`|SDK token of the survey| * |
|`surveyType: SurveySparrow.SurveyType`|Type of the survey|`.CLASSIC`|
|`getSurveyLoadedResponse: Bool`|Set to true to get handleSurveyLoaded response (available in version >= 0.3.0)|false|
|`params: [String: String]`|Custom params for the survey| - |
|`thankyouTimeout: Double`|Duration to display thankyou screen in seconds| 3.0 |
|`surveyDelegate: SsSurveyDelegate`|Protocol to handle survey response| - |

#### Public methods
|Method|Description|
|-----------|------|
|`loadSurvey(domain: String?, token: String?)`|: Load survey in SsSurveyView|

### SsSurveyDelegate
Protocol to get survey responses
|Method|Description|
|-----------|------|
|`handleSurveyResponse(response: [String: AnyObject])`|Handle survey response|
|`handleSurveyLoaded(response: [String: AnyObject])`|Handle survey loaded|
|`handleSurveyValidation(response: [String: AnyObject])`|Handle survey validation|

### SurveySparrow
Class to handle survey scheduling

#### Initializer
`public init(domain: String, token: String)` : pass SurveySparrow account domain & survey SDK token

#### Public constants
`SurveySparrow.SurveyType`
| Constant | Description |
|----------|-------------|
|`.CLASSIC`|Classic Survey|
|`.CHAT`|Chat Survey|
|`.NPS`|NPS Survey|

#### Public Properties
|Property|Description|Default Value|
|-----------|------|------|
|`surveyType: SurveySparrow.SurveyType`|Type of the survey|`.CLASSIC`|
|`params: [String: String]`|Custom params for the survey| - |
|`thankyouTimeout: Double`|Duration to display thankyou screen in seconds| 3.0 |
|`surveyDelegate: SsSurveyDelegate`|Protocol to handle survey response| - |
|`getSurveyLoadedResponse: Bool`|Set to true to get handleSurveyLoaded response (available from version >= 0.3.0)|false|
|`alertTitle: String`| Alert title | Rate us |
|`alertMessage: String`| Alert message | Share your feedback and let us know how we are doing |
|`alertPositiveButton: String`| Alert positive button text | Rate Now |
|`alertNegativeButton: String`| Alert negative button text | Later |
|`isConnectedToNetwork: Bool`| Network status | true |
|`startAfter: Int64`| Set the number of days to wait before showing the scheduled alert after launching the app for first time | 259200000 *(3 days)* |
|`repeatInterval: Int64`| Set the number of days to wait to show the dialog once the user declined the dialog or accepted in the case of multiple feedback enabled | 432000000 *(5 days)* |
|`repeatSurvey: Bool`| Collect scheduled feedback multiple times. (Make sure that you have enabled 'Allow multiple submissions per user' for this survey) | false |
|`incrementalRepeat: Bool`| Repeat survey with a incremental interval | false |

#### Public methods
|Method|Description|
|-----------|------|
|`scheduleSurvey(parent: UIViewController)`|Schedule Survey|
|`clearSchedule()`|Clear scheduler data|

\* Required property

\- Optional


> Please submit bugs/issues through GitHub issues we will try to fix it ASAP.

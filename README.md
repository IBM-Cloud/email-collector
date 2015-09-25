#email-collector Overview

The Email Collector app was built as a tool for workshop facilitators to collect attendees emails for various purposes. The app itself is optimized for the [Bluemix][bluemix_url] platform and leverages [Twilio SMS][twilio_sms_url], a [Cloudant DB][cloudant_url], and the enigmatic [Cat API][cat_api_url]. Attendees can send a text to a Twilio number with their email address, logging the email in central DB. Each email is assigned to a unique cat picture and served to the app's main page.

![Bluemix Deployments](https://deployment-tracker.mybluemix.net/stats/0b1709819601f1c20ea8bf58b88d61b8/badge.svg)

## Running the app on Bluemix

You can deploy your own instance of the Email Collector to Bluemix. To do this, you can either use the _Deploy to Bluemix_ button for an automated deployment or follow the step below to create and deploy your app manually.
  
[![Deploy to Bluemix](https://bluemix.net/deploy/button.png)](https://bluemix.net/deploy)  
**Note**: If deploying by this method, the app will fail on first deploy. After this initial failure, you must complete steps 9-16 below in order to successfully start your app.

1. Create a Bluemix Account

    [Sign up for Bluemix][bluemix_signup_url] or use an existing account.

2. Download and install the [Cloud Foundry CLI][cloud_foundry_url] tool

3. Clone the app to your local environment from your terminal using the following command:

  ```
  git clone https://github.com/IBM-Bluemix/email-collector.git
  ```

4. `cd` into this newly created directory

5. Open the `manifest.yml` file and change the `host` value to something unique

  The host you choose will determinate the subdomain of your application's URL:  `<host>.mybluemix.net`

6. Connect to Bluemix in the command line tool and follow the prompts to log in:

  ```
  $ cf api https://api.ng.bluemix.net
  $ cf login
  ```
  
7. Create the Cloudant service in Bluemix:

  ```
  $ cf create-service cloudantNoSQLDB Shared email-collector-datastore
  ```
  
8. Deploy your app to Bluemix. We need to perform additional steps once it is deployed, so we will add the `--no-start` argument:

  ```
  $ cf push --no-start
  ```
  
9. If you do not have one already, sign up for a [Twilio developer account][twilio_signup_url]

10. Once you have created an account, navigate to your account page. Take note of your Account SID and AuthToken on this page, as you will need it to plug in as your credentials for accessing Twilio's REST API from within Bluemix.

11. Provision a phone number for your Twilio account. Then, in the SMS & MMS options, change the Request URL to `https://email-collector.mybluemix.net/api/v1/sms`, replacing `email-collector` with your `host` value from step 5. Save the configuration change.

12. Open up the `lib/twilioNumber.json` file and replace the `twilioNum` value with your new phone number

13. Go to the Bluemix catalog, create a Twilio service using the credentials from the previous step, and choose to bind it to your new app.

14. Next, request an API key for [The Cat API][cat_api_reg_url]

15. Using the key from the previous step, we will create a user-provided service in Bluemix so that our app can serve some cat images:

  ```
  $ cf cups email-collector-cats -p '{"host":"thecatapi.com/api/","key":"<YourApiKey>"}'
  ```
Now bind the service to your app:

  ```
  $ cf bind-service email-collector email-collector-cats
  ```

16. Finally, we need to restage our app to ensure these env variables changes took effect:

  ```
  $ cf restage email-collector
  ```

And voila! You now have your very own instance of the Email Collector running on Bluemix.

## Run the app locally

1. Clone the app to your local environment from your terminal using the following command:

  ```
  git clone https://github.com/IBM-Bluemix/email-collector.git
  ```

2. `cd` into this newly created directory

3. Sign up for a [Cloudant account][cloudant_signup_url]. You will need your username and password for later

4. Next, request an API key for [The Cat API][cat_api_reg_url], the last key needed for configuration

5. Using the credentials from steps 3-6, replace the default configs in `vcap-local.json`

6. Install the required `npm` and `bower` packages using the following command

  ```
  npm install
  ```
  
7. Start your app locally with the following command.

  ```
  npm start
  ```

Your app will be automatically assigned to a port which will be logged to your terminal. To access the app, go to localhost:PORT in your browser.

To test the SMS portion, you will need to simulate the Twilio service. I recommend [Postman][postman_url] for this, but you are free to use any application you wish.

To simulate an SMS, make the following HTTP GET request, replacing the `PORT` number and the `From` and `Body` query parameters with your test values:

```
localhost:PORT/api/v1/sms?From=+15555555555&Body=sample@email.com
```

This should be all you need to test and tweak your Email Collector app. Happy developing!

## Contribute
We are more than happy to accept external contributions to this project, be it in the form of issues and pull requests. If you find a bug, please report it via the [Issues section][issues_url] or even better, fork the project and submit a pull request with your fix! Pull requests will be evaulated on an individual basis based on value add to the sample application.

### Credit
[Aden Forshaw][adenforshaw_url] - The Cat API [[source]][cat_api_url]

## Troubleshooting

The primary source of debugging information for your Bluemix app is the logs. To see them, run the following command using the Cloud Foundry CLI:

  ```
  $ cf logs email-collector --recent
  ```
For more detailed information on troubleshooting your application, see the [Troubleshooting section](https://www.ng.bluemix.net/docs/troubleshoot/tr.html) in the Bluemix documentation.

## Privacy Notice
The email-collector sample web application includes code to track deployments to Bluemix and other Cloud Foundry platforms. The following information is sent to a [Deployment Tracker](https://github.com/cloudant-labs/deployment-tracker) service on each deployment:

* Application Name (application_name)
* Space ID (space_id)
* Application Version (application_version)
* Application URIs (application_uris)

This data is collected from the VCAP_APPLICATION environment variable in IBM Bluemix and other Cloud Foundry platforms. This data is used by IBM to track metrics around deployments of sample applications to IBM Bluemix. Only deployments of sample applications that include code to ping the Deployment Tracker service will be tracked.

### Disabling Deployment Tracking

Deployment tracking can be disabled by removing `require("cf-deployment-tracker-client").track();` from the beginning of the `app.js` file.

[bluemix_url]: https://ibm.biz/email-collector-bluemix
[twilio_sms_url]: https://www.twilio.com/sms
[cloudant_url]: https://cloudant.com/
[cat_api_url]: https://thecatapi.com/
[bluemix_signup_url]: https://ibm.biz/email-collector-signup
[cloudant_signup_url]: https://cloudant.com/sign-up/
[cloud_foundry_url]: https://github.com/cloudfoundry/cli
[twilio_signup_url]:https://www.twilio.com/try-twilio
[cat_api_reg_url]: https://thecatapi.com/api-key-registration.html
[postman_url]: https://www.getpostman.com/
[issues_url]: https://github.com/IBM-Bluemix/email-collector/issues
[adenforshaw_url]: http://adenforshaw.com/
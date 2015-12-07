# Basket predictions
This repos contains instructions for creating a Google Predictions api model along with a script for testing model accuracy.

## Creating a prediction model
See the [tutorial](https://cloud.google.com/prediction/docs/hello_world) and [developer guide](https://cloud.google.com/prediction/docs/hello_world) for more info.

* Use source data to create to csv files, 1 for training and 1 for testing. The majority of data should be used for training.
CSV should have no header row, enclose all strings in double-quotes and do not enclose numbers in double quotes.
* Upload the training file to Google Cloud Storage using the GCloud web console.
* Use Google API Explorer to create the model:
  * Go to the page for [insert](https://developers.google.com/apis-explorer/#p/prediction/v1.6/prediction.trainedmodels.insert)
  * Enter GCloud project name
  * In request body select `id` from the dropdown and enter an name for the model
  * In request body select `storageDataLocation` from the dropdown and provide bucket and test file name of the training data
* Use Google API Explorer to see when the model is created:
  * Go to the [get](https://developers.google.com/apis-explorer/#p/prediction/v1.6/prediction.trainedmodels.get) page and enter the project name and model id
* View model analysis:
  * Go to the [analyse](https://developers.google.com/apis-explorer/#p/prediction/v1.6/prediction.trainedmodels.analyze) page and enter the project name and id

## Tesing the model
Execute script `test_model.js` from this repository - (run `node test_model.js --help` for required arguments)

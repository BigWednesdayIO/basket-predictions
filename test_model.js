#!/usr/bin/env node

'use strict';

const fs = require('fs');
const google = require('googleapis');
const program = require('commander');
const rxNode = require('rx-node');

program
  .option('-m, --model [model]', 'Prediction model name')
  .option('-p, --project [project]', 'GCloud project')
  .option('-k, --key-file [file]', 'GCloud keyfile path')
  .option('-t, --test-file [file]', 'Test file path')
  .parse(process.argv);

if (!program.model || !program.project || !program.testFile || !program.keyFile) {
  program.outputHelp(help => {
    console.log('  Missing command line args');
    console.log(help);
    process.exit(1);
  });
}

const key = require(program.keyFile);

var jwtClient = new google.auth.JWT(key.client_email, null, key.private_key, ['https://www.googleapis.com/auth/prediction'], null);

const getPrediction = (features, callback) => {
  google.prediction('v1.6').trainedmodels.predict({
    auth: jwtClient,
    id: program.model,
    project: program.project,
    resource: {input: {csvInstance: features}}
  }, callback);
}

const subscription = rxNode.fromReadableStream(fs.createReadStream(program.testFile))
  .map(t => t.toString().split('\n'))
  .flatMap(t => t)
  .take(1)
  .map(t => t.split(','))
  .subscribe(x => {
    const actualVolume = x[0];
    const features = x.slice(1);

    getPrediction(features, (err, result) => {
      if (err) {
        return console.error('Predict failed', err);
      }

      console.log(result.outputValue);
    });
  });


// Loops through training file, gets prediction for features, calculates accuracy.
  // Provides mean, mode, median and variance for accuracy

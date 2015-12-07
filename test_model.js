#!/usr/bin/env node

'use strict';

const debug = require('debug')('model-tester');
const fs = require('fs');
const google = require('googleapis');
const program = require('commander');
const rx = require('rx');
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

const jwtClient = new google.auth.JWT(key.client_email, null, key.private_key, ['https://www.googleapis.com/auth/prediction'], null);

const getPrediction = (params => {
  return rx.Observable.create(observer => {
    debug('Submitting prediction request');

    google.prediction('v1.6').trainedmodels.predict(params, (err, result) => {
      if (err) {
        console.error(err);
        observer.onError(err);
      } else {
        debug('Prediction request returned');
        observer.onNext(result);
      }
      observer.onCompleted();
    });
  });
});

const percentError = (predicted, actual) => {
  // https://en.wikipedia.org/wiki/Relative_change_and_difference#Percent_error
  const diff = Math.abs(Math.round(predicted) - actual);
  return (diff / actual) * 100;
};

const getActualVolume = fields => parseInt(fields[0]);

const differences = {
  sum: 0,
  count: 0
};

rxNode.fromReadableStream(fs.createReadStream(program.testFile))
  .flatMap(chunk => {
    const lines = chunk.toString().split('\r\n');
    console.log(`Processing ${lines.length} lines`);
    return lines;
  })
  .take(300)
  .map(line => line.split(','))
  .filter(fields => getActualVolume(fields) !== 0)
  .concatMap(fields => {
    const actualVolume = getActualVolume(fields);
    const features = fields.slice(1);

    debug('Preparing prediction request');

    return rx.Observable.defer(() => getPrediction({
      auth: jwtClient,
      id: program.model,
      project: program.project,
      resource: {input: {csvInstance: features}}
    }))
    .map(result => {
      debug(`Predicted ${result.outputValue}, Actual ${actualVolume}`);
      const errorAmount = percentError(result.outputValue, actualVolume);

      if (Number.isNaN(errorAmount)) {
        console.error('Invalid error amount for:', fields);
        throw new Error('Invalid error amount');
      }

      return errorAmount;
    })
  })
  .subscribe(difference => {
    differences.sum += difference;
    ++differences.count;
  }, err => {
    console.error('Error', err);
  }, () => {
    console.log(`Total cases analysed: ${differences.count}`);
    const mean = differences.sum / differences.count;
    console.log(`Mean error ${mean.toFixed(2)}`);
  });

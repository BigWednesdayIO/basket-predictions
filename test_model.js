#!/usr/bin/env node

'use strict';

const debug = require('debug')('model-tester');
const fs = require('fs');
const google = require('googleapis');
const program = require('commander');
const rx = require('rx');
const rxNode = require('rx-node');
const stats = require('stats-lite');

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

const getPrediction = rx.Observable.fromCallback(google.prediction('v1.6').trainedmodels.predict);

const percentError = (predicted, actual) => {
  // https://en.wikipedia.org/wiki/Relative_change_and_difference#Percent_error
  return (Math.abs(predicted - actual) / actual) * 100;
};

rxNode.fromReadableStream(fs.createReadStream(program.testFile))
  .map(t => t.toString().split('\r\n'))
  .do(t => {
    console.log(`Processing ${t.length} lines`)
  })
  .flatMap(t => t)
  .take(3)
  .map(t => t.split(','))
  .flatMap(t => {
    const actualVolume = t[0];
    const features = t.slice(1);

    return getPrediction({
      auth: jwtClient,
      id: program.model,
      project: program.project,
      resource: {input: {csvInstance: features}}
    }).map(p => {
      if (p[0]) {
        return console.error(p[0]);
      }

      debug(features);
      debug(`Predicted ${p[1].outputValue}, Actual ${actualVolume}`);
      return percentError(p[1].outputValue, actualVolume)
    });
  })
  .toArray()
  .subscribe(differences => {
    debug(differences);
    console.log(`${differences.length} tests cases analysed`);
    console.log(`Mean ${stats.mean(differences).toFixed(2)}`);
    console.log(`Median ${stats.median(differences).toFixed(2)}`);
    const mode = stats.mode(differences);
    console.log(`Mode ${mode.length ? mode.map(n => n.toFixed(2)) : mode.toFixed(2)}`);
    console.log(`Variance ${stats.variance(differences).toFixed(2)}`);
    console.log(`Standard deviation ${stats.stdev(differences).toFixed(2)}`);
  }, err => {
    console.error('Error', err);
  }, () => {
    console.log('Completed');
  });

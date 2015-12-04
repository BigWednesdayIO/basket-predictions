#!/usr/bin/env node

'use strict';

const program = require('commander');
const rxNode = require('rx-node');
const fs = require('fs');


program
  .option('-t, --test-file [file]', 'Test file path')
  .parse(process.argv);

if (!program.testFile) {
  program.outputHelp(help => {
    console.log('  Missing command line args');
    console.log(help);
    process.exit(1);
  });
}

console.log('Processing test file ', program.testFile);

const subscription = rxNode.fromReadableStream(fs.createReadStream(program.testFile))
    .map(t => t.toString().split('\n'))
    .flatMap(t => t)
    .take(10)
    .subscribe(x => {
      console.log(x);
    });


// Loops through training file, gets prediction for features, calculates accuracy.
  // Provides mean, mode, median and variance for accuracy

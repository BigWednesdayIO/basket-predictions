#!/usr/bin/env node

'use strict';

const program = require('commander');

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

console.log(program.model);
console.log(program.project);
console.log(program.testFile);




// Accepts a training file name, model name and project

// Loops through training file, gets prediction for features, calculates accuracy.
  // Provides mean, mode, median and variance for accuracy


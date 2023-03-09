#!/usr/bin/env node
const { program } =require("commander");
const fs = require("fs");
const prompt  = require("prompt");
const { exec } =  require('child_process');
const path = require("path");
console.log(process.argv);
readingList = JSON.parse(fs.readFileSync(path.resolve("./readingList.json")))

function isValidObject(str) {
  try {
    const obj = JSON.parse(str);
    return typeof obj === "object" && obj !== null;
  } catch (e) {
    return false;
  }
}

program
  .version("0.1.0")
  .option("-b, --book <book>", "Book name")
  .option("-w, --web <web>", "Shorthand for website")
// # .option("-p, --page <page>", "current page number")
// # .option("-c, --chunkSize <chunkSize>", "number of pages to read at once")
//TODO .option("-t, --type <type>", "pdf, html")
  .parse(process.argv);
const options = program.opts();
console.log(options);
// # if (!options.file) {
// #   console.error("No file specified e.g. ./.pdf");
// #   process.exit(1);
// # }

// if (process.env.OPENAI_API_KEY === undefined) {
//    console.log()
//    process.exit(1);
// }

// if (options.length() === 0) {
//      console.log("no parameters, running default ./book2quiz.sh -f ./Frankenstein.pdf")
// }
// console.log();

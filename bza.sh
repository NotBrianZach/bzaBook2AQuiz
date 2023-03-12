#!/usr/bin/env node
const { program } =require("commander");
const fs = require("fs");
const prompt  = require("prompt");
const { exec, spawn } =  require('child_process');
const path = require("path");
console.log(process.argv);
import readingListTopLevel from "./readingList.js";

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

// const { convert } = require('html-to-text');

// const html = '<a href="/page.html">Page</a><a href="!#" class="button">Action</a>';
// const text = convert(html, {
//   selectors: [
//     { selector: 'a', options: { baseUrl: 'https://example.com' } },
//     { selector: 'a.button', format: 'skip' }
//   ]
// });
// exec('"/path/to/test file/test.sh" arg1 arg2');
// // Double quotes are used so that the space in the path is not interpreted as
// // a delimiter of multiple arguments
spawn("xpdf", ["./Frankenstein.pdf", "-z", 200])
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

#!/usr/bin/env node
import { program } from "commander";
import fs from "fs";
import prompt from "prompt";
import pdf_extract from "pdf-extract";
import createGptQuery from "./lib/createGPTQuery.mjs"
console.log(process.argv);
const data = fs.readFileSync('./readingList.json',
                             {encoding:'utf8', flag:'r'});


const queryGPT = createGPTQuery(process.env.OPENAI_API_KEY)

program
  .version("0.1.0")
  .option("-f, --file <file>", "Path to file to read from")
  .option("-p, --page <page>", "current page number")
  .option("-c, --chunkSize <chunkSize>", "number of pages to read at once")
  .option("-I, --isPDFImage <isPDFImage>", "if pdf is a scanned image w/no searchable text")
  .option("-b, --before <beforeContext>", "context provided to gpt at beginning of each request")
  .option("-a, --after <afterContext>", "context provide to llm at end of each request")
  .option("-C, --character <character>", "character to reply as")
//TODO .option("-t, --type <type>", "pdf, html")
  .parse(process.argv);
const options = program.opts();
console.log(options);
if (!options.file) {
  console.error("No file specified e.g. ./google_sre_2_2018.pdf");
  process.exit(1);
}
let beforeContext = options.beforeContext

const path = require("path")
const pdf_extract = require('pdf-extract')

// extract text from scanned image pdf without searchable text
// console.log("Usage: node thisfile.js the/path/tothe.pdf")
// const absolute_path_to_pdf = path.resolve(process.argv[2])
// if (absolute_path_to_pdf.includes(" ")) throw new Error("will fail for paths w spaces like "+absolute_path_to_pdf)

// const options = {
//   type: 'ocr', // perform ocr to get the text within the scanned image
//   ocr_flags: ['--psm 1'], // automatically detect page orientation
// }
// const processor = pdf_extract(absolute_path_to_pdf, options, ()=>console.log("Starting…"))
// processor.on('complete', data => callback(null, data))
// processor.on('error', callback)
// function callback (error, data) { error ? console.error(error) : console.log(data.text_pages[0]) }

// extract text from pdf with searchable text
var pdfOptions = {
  type: "text", // extract the actual text in the pdf file
  mode: 'layout' // optional, only applies to 'text' type. Available modes are 'layout', 'simple', 'table' or 'lineprinter'. Default is 'layout'
  ocr_flags: ['--psm 1'], // automatically detect page orientation
  enc: 'UTF-8',  // optional, encoding to use for the text output
  clean: true // try prevent tmp directory /usr/run/$userId$ from overfilling with parsed pdf pages (doesn't seem to work)
};

function removeExtraWhitespace(str) {
  // removes any instance of two or whitespace (text often has tons of padding characers), and whitespace from end and beginning of str
  return str.replace(/\s+/g, " ").trim();
}

var processor = pdf_extract(options.file, pdfOptions, function(err) {
  if (err) {
    return callback(err);
  }
});

let synopsis = "";
let logSummary = [];
let logQuiz = [];
const existsBookNameInReadingList = typeof readingList
const currentPageNumber = options.page === undefined ? 0 : options.page;
const chunkSize = options.chunkSize === undefined ? 2 : options.chunkSize;
function eventLoop(data, 1a, 2a, 2b, 6a) {
  const totalPages = data.text_pages.length;
  console.log("totalPages", totalPages, currentPageNumber, chunkSize);
  // 1. IF EXISTS, load title&synopsis&rollingSummary from readingList.json ELSE try to grab title, query user C=confirm, string=user inputs title, query user for page range of table of contents if input=([0-9]*-[0-9]*) try to synopsize and validate with user, else ask user input synopsis, rollingSummary=empty string

  const titlePrompt = `What follows is the text of the first few pages of a pdf, output the title: ${removeExtraWhitespace(
    data.text_pages
      .slice(currentPageNumber, currentPageNumber + chunkSize)
      .join("")
  )}`;
  console.log("titlePrompt", titlePrompt);
  let potentialTitle = queryGPT(titlePrompt)
  var titlePromptSchema = {
    properties: {
      validTitle: {
        message:
        "Press C if title correct, otherwise enter title",
        required: true
      }
    }
  };
  const { inputTitle } = await prompt.get(titlePromptSchema);
  let rollingSummary = ""
  while (currentPageNumber + chunkSize < totalPages) {
    // 3. feed gpt3 pages[pageNumber:pageNumber+chunkSize], prepending prependContext&synopsis&title&rollingSummary, appending appendContext, summarize pages[n:n+m]
    const pageSlice = removeExtraWhitespace(
      data.text_pages
        .slice(currentPageNumber, currentPageNumber + chunkSize)
        .join("")
    );
    rollingSummary = queryGPT(`Given SYNOPSIS, TITLE, and ROLLING SUMMARY of content up to this point, summarize the following EXCERPT, TITLE: ${title}, SYNOPSIS: ${synopsis}, ROLLING SUMMARY: ${rollingSummary}, EXCERPT: ${pageSlice}`)
    //2. display summary of pages[pageNum:pageNum+chunkSize] and quiz  to the user, record user answer to quiz
    console.log(
      `Summary of pages ${currentPageNumber} to ${currentPageNumber +
        chunkSize}:`,
      rollingSummary
    );
    logSummary.push(rollingSummary);
    await prompt.get(["Press any a letter+enter to continue to quiz"]);

    // **** 1.a. generate quiz,
    const quiz =  queryGPT(`$SUMMARY$: ${synopsis} $CONTENT$: ${pageSlice} $INSTRUCTIONS$: given $SUMMARY$ and $CONTENT$ of book titled "${title}" generate a quiz bank of questions to test knowledge of $CONTENT$`)
    console.log(`Quiz:`, quiz);
    logQuiz.push(quiz);
    const { answers } = await prompt.get(["Record answers here or single char input&enter to continue"]);

    //?TODO? have gpt attempt to check the answers to made up quiz
    // const completionCheckAnswers = await openai.createCompletion({
    //   model: "text-davinci-003",
    //   prompt: `What is the correct answer for the quiz above? ${userAnswer}`,
    //   max_tokens: 2000
    // });
    // console.log(`Check answer:`, completionCheckAnswers.data.choices[0].text);

    // 4. query gpt3 w/synopsis+summary of pages[pageNumber:pageNumber+chunkSize] to generate a new rollingSummary
    const updateMetaSummaryCompletion = queryGPT(`given $SUMMARY$ of book titled ${title.titleKey}${synopsis} $CONTENT$: ${pageSlice} $INSTRUCTIONS$: given $SUMMARY$ and $CONTENT$ of book titled "${title}" generate a quiz bank of questions to test knowledge of $CONTENT$`)
    console.log(`New Meta Summary:`, synopsis);
    var finalPromptSchema = {
      properties: {
        isExit: {
          message:
            "Press any letter except X to continue to next ${chunkSize} page(s), press X to save logs and exit program",
          required: true
        }
      }
    };
    const { isExit } = await prompt.get(finalPromptSchema);
    if (isExit === "X") {
      break;
    }
  }

  const summary = {
    synopsis,
    logSummary,
    logQuiz
  }
  console.log(summary);
  // 4. record a log of all the summaries and quizzes
  fs.writeFileSync(
    `./log.json`,
    JSON.stringify(summary)
  );
}

processor.on("complete", async function(pdfText) {
  // console.log(data.text_pages[0], "extracted text page 1");
  eventLoop(pdfText)
});

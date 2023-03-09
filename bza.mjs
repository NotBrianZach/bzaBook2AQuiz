#!/usr/bin/env node
import { program } from "commander";
import fs from "fs";
import prompt from "prompt";
import pdf_extract from "pdf-extract";
import {createGPTQuery} from "./lib/createGPTQuery.mjs"
import path from "path"
console.log(process.argv);

function parseJSONFile(filepath) {
  return JSON.parse(fs.readFileSync(filepath), {encoding:'utf8', flag:'r'})
}
const readingList = parseJSONFile('./readingList.json').readingList;

const queryGPT = createGPTQuery(process.env.OPENAI_API_KEY)

program
  .version("0.1.0")
  .option("-f, --file <file>", "Path to file to read from")
  .option("-O, --openAIAPIKey <openAIAPIKey>", "api key")// .env("openAIAPIKey")
  .option("-p, --page <page>", "current page number")
  .option("-c, --chunkSize <chunkSize>", "number of pages to read at once")
  .option("-w, --workflow <workflow>", "type of workflow")
  .option("-I, --isPDFImage <isPDFImage>", "if pdf is a scanned image w/no searchable text")
  .option("-b, --before <beforeContext>", "context provided to gpt at beginning of each request")
  .option("-a, --after <afterContext>", "context provide to llm at end of each request")
  .option("-C, --character <character>", "character to reply as")
//TODO .option("-t, --type <type>", "pdf, html")
  .parse(process.argv);
const options = program.opts();
console.log(options);
if (!options.file) {
  console.error("No file specified e.g. ./Frankenstein.pdf");
  process.exit(1);
}
let beforeContext = options.beforeContext

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
  mode: 'layout', // optional, only applies to 'text' type. Available modes are 'layout', 'simple', 'table' or 'lineprinter'. Default is 'layout'
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

const logs = {
  synopsis: "",
  logSummary: []
}
// function recordAndExit (logs) {
//   fs.writeFileSync(
//     `./log.json`,
//     JSON.stringify(logs)
//   );
// }

// const titlePrompt = `What follows is the text of the first few pages of a pdf, output only the title: ${removeExtraWhitespace(
//   data.text_pages
//     .slice(currentPageNumber, currentPageNumber + chunkSize)
//     .join("")
// )}`;
// // console.log("titlePrompt", titlePrompt);
// let potentialTitle = queryGPT(titlePrompt)
const existsBookNameInReadingList = readingList[options.bookName] !== undefined
if (existsBookNameInReadingList) {

} else {
}

const currentPageNumber = options.page === undefined ? 0 : options.page;
const chunkSize = options.chunkSize === undefined ? 2 : options.chunkSize;

const totalPages = data.text_pages.length;
console.log("totalPages", totalPages, currentPageNumber, chunkSize);

var titlePromptSchema = {
  properties: {
    title: {
      message:
      "Enter title",
      required: true
    }
  }
};
const { title } = await prompt.get(titlePromptSchema);

var summaryPromptSchema = {
  properties: {
    summary: {
      message:
      "Enter a summary",
      required: true
    }
  }
};
const { summary } = await prompt.get(summaryPromptSchema);
// let title = ""
// if (maybeTitle === "Y") {
//   title = potentialTitle
// } else {
//   title = maybeTitle
// }
// const titlePrompt = `What follows is the text of the first few pages of a pdf, output only the title: ${removeExtraWhitespace(
//   data.text_pages
//     .slice(currentPageNumber, currentPageNumber + chunkSize)
//     .join("")
// )}`;
// // console.log("titlePrompt", titlePrompt);
// let potentialTitle = queryGPT(titlePrompt)
async function eventLoop(curPageNum, rollingSummary, data, step1a, step1b, step2a) {
    // 1. feed gpt3 pages[pageNumber:pageNumber+chunkSize], prepending prependContext&synopsis&title&rollingSummary, appending appendContext, summarize pages[n:n+m]
    const pageSlice = removeExtraWhitespace(
      data.text_pages
        .slice(curPageNum, curPageNum + chunkSize)
        .join("")
    );
  const pageChunkSummary = queryGPT(`Given TITLE, OVERALL SUMMARY, and RECENT SUMMARY of content up to this point, summarize the following EXCERPT, TITLE: ${title}, OVERALL SUMMARY: ${synopsis}, RECENT SUMMARY: ${rollingSummary}, EXCERPT: ${pageSlice}`)


  let step1aOut = ""
  if (step1a !== undefined) {
    step1aOut = step1a(pageSlice, data, summary, rollingSummary, title)
  }
  let step1bOut = ""
  if (step1b !== undefined && step1aOut !== "C") {
    step1bOut = step1b(pageSlice, data, summary, rollingSummary, title)
  }
  // 2. rollingSummary=queryGPT3(synopsis+pageChunkSummary)
  const newRollingSummary = queryGPT(`Given TITLE, OVERALL SUMMARY, and RECENT SUMMARY of content up to this point, summarize the following EXCERPT with respect to the rest of the book, TITLE: ${title}, OVERALL SUMMARY: ${synopsis}, RECENT SUMMARY: ${rollingSummary}, EXCERPT: ${pageSlice}`)

  let step2aOut = ""
  if (step2a !== undefined && step1aOut !== "C" && step2aOut !== "C") {
    step2aOut = step2a(pageSlice, data, summary, rollingSummary, title)
  }
  // console.log(
  //   `Summary of pages ${curPageNum} to ${curPageNum +
  //     chunkSize}:`,
  //   rollingSummary
  // );

    // const newRollingSummary = queryGPT(`given $SUMMARY$ of book titled ${title.titleKey}${synopsis} $CONTENT$: ${pageSlice} $INSTRUCTIONS$: given $SUMMARY$ and $CONTENT$ of book titled "${title}" summarise the book up to this point $CONTENT$`)
  // 3. WHILE (pageNumber < bookLength), set pageNumber=pageNumber+chunkSize, jump back to 1. else continue to 4.
    // console.log(`New Meta Summary:`, synopsis);
  if (curPageNum + chunkSize < totalPages) {
    logSummary.push(rollingSummary);
    eventLoop(curPageNum + chunkSize, newRollingSummary, data, step3a, step3b, step6a)
  } else {
    console.log(logs);
    // 4. record a log of all the summaries and quizzes
    step6a(logs)
  }
}
//   - ask user for input
function queryUserDefault(optionToAdd, isPrepend, curPageNum, data) {
  const modifiedDefaultQuerySchema =  {
    properties: {
      nextAction: {
        type: 'string',                 // Specify the type of input to expect.
        description:
        `${isPrepend && optionToAdd}\n
   C=continue to next page,\n
   Q=ask a different query \n
   r="repeat"/continue the conversation, query gpt3 w/user reply on question answer,\n
   b="before" prepend next user query input to all non summary gpt requests, "tell a joke about the following text":\n
   d=delete stack of prepended prompts
   A="after" append next user query input to all non summary gpt requests,"...tell another joke about the above text that ties into the first joke"
   D=delete stack of appended prompts${!isPrepend && optionToAdd}
`
      }
    }
  }
  const queryValue = await prompt.get(queryUserDefault("",false));
  switch(queryValue) {
  case "C":
    return "C"
  default:
    return queryValue
  }
}

function runQuizWorkflow(pageSlice, synsopsis, title) {
  function runQuiz() {
    queryUserDefault("q", true)
    // * 1.a. generate quiz,
    const quiz =  queryGPT(`INSTRUCTIONS: given SUMMARY and CONTENT of book titled "${title}" generate a quiz bank of questions to test knowledge of CONTENT, SUMMARY: ${synopsis} CONTENT$: ${pageSlice}`)
    console.log(`Quiz:`, quiz);
    logQuiz.push(quiz);
    const { answers } = await prompt.get(
      {
        properties: {
          answers: {
            message:
            "Enter Answers",
            required: true
          }
        }
      });
    const grade =  queryGPT(`INSTRUCTIONS: assign a grade in the form { grade: x, question1: ["correct", ""], "question2": ["wrong", "correct answer goes here"], ... }, given SUMMARY and CONTENT of book titled "${title}" to student answers to a quiz to test knowledge of CONTENT, SUMMARY: ${synopsis} CONTENT$: ${pageSlice}`)
    console.log(grade)
    await prompt.get("input most anything to continue")
  }

  eventLoop(currentPageNumber, data, runQuiz)
}

processor.on("complete", async function(pdfText) {
  // console.log(data.text_pages[0], "extracted text page 1");
  switch(options.workflow) {
    default: runQuizWorkflow(pdfText)

  }

});

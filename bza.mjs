#!/usr/bin/env node
import { program, Option } from "commander";
import fs from "fs";
import prompt from "prompt";
import pdf_extract from "pdf-extract";
import {createGPTQuery} from "./lib/createGPTQuery.mjs"
import path from "path"
console.log(process.argv);


const queryGPT = createGPTQuery(process.env.OPENAI_API_KEY)

program
  .version("0.1.0")
  .option("-f, --file <file>", "Path to file to read from")
  .addOption(new Option("-b, --bookName <bookName>", "Book name (alternative to file)").conflicts("file"))
  .option("-O, --openAIAPIKey <openAIAPIKey>", "api key")// .env("openAIAPIKey")
  .option("-p, --page <page>", "current page number")
  .option("-c, --chunkSize <chunkSize>", "number of pages to read at once")
  .option("-w, --workflow <workflow>", "type of workflow")
  .option("-I, --isPDFImage <isPDFImage>", "if pdf is a scanned image w/no searchable text")
  // .option("-b, --before <beforeContext>", "context provided to gpt at beginning of each request")
  // .option("-a, --after <afterContext>", "context provide to llm at end of each request")
  .option("-C, --character <character>", "character to reply as")
//TODO .option("-t, --type <type>", "pdf, html")
  .parse(process.argv);

const options = program.opts();
console.log(options);
if (!options.file && typeof options.bookName !== "string") {
  console.error("No file specified e.g. ./Frankenstein.pdf");
  process.exit(1);
}

function parseJSONFile(filepath) {
  return JSON.parse(fs.readFileSync(filepath), {encoding:'utf8', flag:'r'})
}
const readingList = parseJSONFile('./readingList.json').readingList;

function validateObj(object, key, values) {
  if (object[key] && values.includes(object[key])) {
    return true;
  }
  return false;
}

function writeToReadingList(readOptions) {
  validateObj(options, "articleType", readingList.articleTypeValues)
  validateObj(options, "modeValues", readingList.modeValues)
  if (typeof options.bookName === "string") {
    //readingList entry exists
    let readingListEntry = {
      pageNumber: readOptions.pageNumber || 0,
      articleType: readOptions.articleType || "",
      chunkSize: readOptions.chunkSize || 2,
      narrator: readOptions.narrator || "",
      summary: readOptions.summary || "",
      mode: readOptions.mode || "quiz&answer",
      isPrintSummary: readOptions.isPrintSummary || true,
      path: readOptions.path || "",
      max_tokens: readOptions.max_tokens || 2000,
      executable: readOptions.executable || "xpdf",
      exeArguments: readOptions.exeArguments || "-z 200",
      prependContext: readOptions.prependContext || [""],
      appendContext: readOptions.appendContext || [""]
    };
    //write to readingList
    fs.writeFileSync(`./readingList.json`, JSON.stringify(readingListEntry));
  } else {
    console.log("No book name supplied to write list");
  }
}
let beforeContext = options.beforeContext
function removeExtraWhitespace(str) {
  // removes any instance of two or whitespace (text often has tons of padding characers), and whitespace from end and beginning of str
  return str.replace(/\s+/g, " ").trim();
}

const logs = {
  synopsis: "",
  logSummary: []
}

const readingListBook = readingList[options.bookName]
const existsBookNameInReadingList = readingListBook !== undefined
let currentPageNumber = options.page === undefined ? 0 : options.page
let chunkSize = options.chunkSize === undefined ? 2 : options.chunkSize
let title = ""
let synopsis = ""
if (existsBookNameInReadingList) {
  currentPageNumber = readingListBook.pageNumber
  chunkSize = readingListBook.chunkSize
  title = options.bookName
  options.file = readingListBook.path
  synopsis = readingListBook.summary
} else {
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
  const { synopsis } = await prompt.get(summaryPromptSchema);
}

// fs.writeFileSync()

//   - ask user for input
async function queryUserDefault(optionToAdd, isPrepend, curPageNum, gptPrompt) {
  const modifiedDefaultQuerySchema =  {
    properties: {
      nextAction: {
        type: 'string', // Specify the type of input to expect.
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
  let query = ""
  let gptResponse = ""
  switch(queryValue) {
    case "r":
      query = await prompt(["query"])
      gptResponse = queryGPT(`${gptPrompt}\n${query}`)
      queryUserDefault(optionToAdd, isPrepend, curPageNum, gptResponse)
      break
    case "Q":
      query = await prompt(["query"])
      gptResponse = queryGPT(`${gptPrompt}`)
      queryUserDefault(optionToAdd, isPrepend, curPageNum, gptPrompt)
      break

    // b="before" prepend next user query input to all non summary gpt requests, "tell a joke about the following text":\n
    // d=delete stack of prepended prompts
    // A="after" append next user query input to all non summary gpt requests,"...tell another joke about the above text that ties into the first joke"
    // D=delete stack of appended prompts${!isPrepend && optionToAdd}
    default:
      return queryValue
  }
}

async function eventLoop(pdfTxt, curPageNum, rollingSummary,  step1a, step1b, step2a, step4a) {
  const totalPages = pdfTxt.text_pages.length;
  console.log("totalPages", totalPages, currentPageNumber, chunkSize);
  // 1. feed gpt3 pages[pageNumber:pageNumber+chunkSize], prepending prependContext&synopsis&title&rollingSummary, appending appendContext, summarize pages[n:n+m]
  const pageSlice = removeExtraWhitespace(
    pdfTxt.text_pages
      .slice(curPageNum, curPageNum + chunkSize)
      .join("")
  );
  const pageChunkSummary = queryGPT(`Given TITLE, OVERALL SUMMARY, and RECENT SUMMARY of content up to this point, summarize the following EXCERPT, TITLE: ${title}, OVERALL SUMMARY: ${synopsis}, RECENT SUMMARY: ${rollingSummary}, EXCERPT: ${pageSlice}`)

  let step1aOut = ""
  if (step1a !== undefined) {
    step1aOut = await step1a(title, synopsis, pageSlice, pdfTxt, rollingSummary)
  }
  let step1bOut = ""
  if (step1b !== undefined && step1aOut !== "C") {
    step1bOut = step1b(title, synopsis, pageSlice, pdfTxt, rollingSummary)
  }
  // 2. rollingSummary=queryGPT3(synopsis+pageChunkSummary)
  const newRollingSummary = queryGPT(`Given TITLE, OVERALL SUMMARY, and RECENT SUMMARY of content up to this point, summarize the following EXCERPT with respect to the rest of the book, TITLE: ${title}, OVERALL SUMMARY: ${synopsis}, RECENT SUMMARY: ${rollingSummary}, EXCERPT: ${pageSlice}`)

  let step2aOut = ""
  if (step2a !== undefined && step1aOut !== "C" && step2aOut !== "C") {
    step2aOut = step2a(title, synopsis, pageSlice, pdfTxt, rollingSummary)
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
    // logSummary.push(rollingSummary);
    eventLoop(pdfTxt, curPageNum + chunkSize, newRollingSummary, step1a, step1b, step2a, step4a)
  } else {
    console.log(logs);
    // 4. record a log of all the summaries and quizzes
    let step4aOut = ""
    if (step4a !== undefined) {
      step4aOut = step4a(title, synopsis, pageSlice, pdfTxt, rollingSummary)
      // step6a(logs)
    }
  }
}

async function runQuizWorkflow(pdfTxt, synopsis, title) {
  async function runQuiz(title, synopsis, pageSlice) {
    // * 1.a. generate quiz,
    const quiz =  await queryGPT(`INSTRUCTIONS: given SUMMARY and CONTENT of book titled "${title}" generate a quiz bank of questions to test knowledge of CONTENT, SUMMARY: ${synopsis} CONTENT$: ${pageSlice}`)
    console.log(`Quiz:`, quiz);
    // logQuiz.push(quiz);
    // const queryUserDefault("q", true)
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
    const grade =  await queryGPT(`assign a grade in format { grade: x, question1: ["correct", ""], "question2": ["wrong", "correct answer goes here"], ... }, given {SUMMARY} and {CONTENT} of book titled "${title}" to {student answers} to a {QUIZ} to test knowledge of CONTENT, SUMMARY: ${synopsis} CONTENT$: ${pageSlice} {QUIZ}: quiz {STUDENT ANSWERS}: ${answers}`)
    console.log("grade", grade)
    return await prompt.get("input most anything to continue")
  }

  // pdfTxt, curPageNum, rollingSummary,  step1a, step1b, step2a, step4a
  eventLoop(pdfTxt, currentPageNumber, "", runQuiz)
}

if (!options.isPdfImage || options.isPdfImage === undefined) {
  // extract text from pdf with searchable text
  var pdfOptions = {
    type: "text", // extract the actual text in the pdf file
    mode: 'layout', // optional, only applies to 'text' type. Available modes are 'layout', 'simple', 'table' or 'lineprinter'. Default is 'layout'
    ocr_flags: ['--psm 1'], // automatically detect page orientation
    enc: 'UTF-8',  // optional, encoding to use for the text output
    clean: true // try prevent tmp directory /usr/run/$userId$ from overfilling with parsed pdf pages (doesn't seem to work)
  };

  var processor = pdf_extract(options.file, pdfOptions, function(err) {
    if (err) {
      console.error("failed to extract pdf, err:", err)
    }
  });
} else {
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
}

processor.on("complete", async function(pdfText) {
  switch(options.workflow) {
    default: runQuizWorkflow(pdfText, synopsis, title)
  }
});

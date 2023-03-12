#!/usr/bin/env node
import { program, Option } from "commander";
import fs from "fs";
import prompt from "prompt";
import pdf_extract from "pdf-extract";
import queryUser from "./lib/queryUser.mjs";
import runQuiz from "./lib/runQuiz.mjs";
import {
  parseJSONFromFileOrReturnObjectSync,
  validateObj
} from "./lib/utils.mjs";
import path from "path";
import prettier from "prettier";

console.log(process.argv);
import { createGPTQuery } from "./lib/createGPTQuery.mjs";
const queryGPT = createGPTQuery(process.env.OPENAI_API_KEY);

// could also use https://github.com/mozilla/readability
// There is also an alias to `convert` called `htmlToText`.
import { htmlToText } from 'html-to-text';
const htmlToTxtOpts = {
  wordwrap: 130
};
import axios from 'axios';

program
  .version("0.1.0")
  .option("-f, --file <file>", "Path to file to read from (if epub, must be utf8)")
  .addOption(new Option(
            "-w, --webUrl <webUrl>",
            'URL to parse text from'
  ).conflicts(['file', 'isPDFImage']))
  .addOption(
    new Option(
      "-b, --bookName <bookName>",
      'look up "book" name in readingList&load file path from there, in case of conflict, overwrite readingList.json entry with command line params'
    )
  )
  // .option("-O, --openAIAPIKey <openAIAPIKey>", "api key")// .env("openAIAPIKey")
  .option("-n, --narrator <narrator>", "character to narrate as")
  .option("-p, --page <page>", "current page number")
  .option("-c, --chunkSize <chunkSize>", "number of pages to read at once")
  .option(
    "-I, --isPDFImage <isPDFImage>",
    "if pdf is a scanned image w/no searchable text"
  )
  // .option("-C, --character <character>", "character to reply as")
  // .option("-t, --type <type>", "pdf, TODO html")
  .parse(process.argv);

const options = program.opts();
console.log(options);
if (!options.file && typeof options.bookName !== "string") {
  console.error(
    "No file or bookName specified e.g. -f ./Frankenstein.pdf, -b Frankenstein"
  );
  process.exit(1);
}

const readingListFileJSON = parseJSONFromFileOrReturnObjectSync(
  "./readingList.json"
);
const readingList = readingListFileJSON.readingList;

function removeExtraWhitespace(str) {
  // removes any instance of two or whitespace (text often has tons of padding characers), and whitespace from end and beginning of str
  return str.replace(/\s+/g, " ").trim();
}

const logs = {
  title: "",
  synopsis: "",
  pageChunk: {},
  pageChunkSummary: {},
  rollingSummary: {},
  quizzes: {
    "0-2": {
      questions: "",
      answers: "",
      readingList: {}
    }
  }
};

const readingListBook = readingList[options.bookName];
console.log("readingListBook", readingListBook);
const existsBookNameInReadingList = readingListBook !== undefined;
let currentPageNumber = options.page === undefined ? 0 : options.page;
let chunkSize = options.chunkSize === undefined ? 2 : options.chunkSize;
let readingOpts = {};
let fileType = ""
if (existsBookNameInReadingList) {
  readingOpts = {
    ...readingListBook
  };
} else {
  var titlePromptSchema = {
    properties: {
      title: {
        message: "Enter a title (can be made up)",
        required: true
      }
    }
  };
  const { title } = await prompt.get(titlePromptSchema);

  var synopsisPromptSchema = {
    properties: {
      synopsis: {
        message: "Enter a summary/synopsis",
        required: true
      }
    }
  };
  const { synopsis } = await prompt.get(synopsisPromptSchema);

  if (!options.file === undefined) {
    readingOpts = {
      ...readingList.readingOptsDefaults,
      title,
      synopsis,
      path: options.path
    };
    if (options.file.includes("pdf")) {
      fileType = "pdf"
    }
    if (options.file.includes(".html")) {
      fileType = "html"
    }
    if (options.file.includes(".epub")) {
      fileType = "epub"
    }
  }
  if (options.webUrl !== undefined) {
    readingOpts = {
      ...readingList.readingOptsDefaults,
      title,
      synopsis,
      url: options.webUrl
    };
  }
}

//   - ask user for input

const nowTime = new Date();

async function eventLoop(pdfTxt, readOpts) {
  const totalPages = pdfTxt.text_pages.length;
  const {
    pageNum,
    chunkSize,
    synopsis,
    rollingSummary,
    isPrintPage,
    isPrintChunkSummary,
    isPrintRollingSummary,
    title
  } = readOpts
  console.log(
    "totalPages, pageNum, chunkSize",
    totalPages,
    readOpts.pageNumber,
    readOpts.chunkSize
  );
  // 1. pageChunkSummary=queryGPT(beforeContext+synopsis+title+rollingSummary+pages[pageNumber:pageNumber+chunkSize]+afterContext)
  const pageSlice = removeExtraWhitespace(
    pdfTxt.text_pages.slice(pageNum, pageNum + chunkSize).join("")
  );
  const chunkSummary = queryGPT(
    `Given TITLE, OVERALL SUMMARY, and RECENT SUMMARY of content up to this point, summarize the following EXCERPT, TITLE: ${title}, OVERALL SUMMARY: ${synopsis}, RECENT SUMMARY: ${rollingSummary}, EXCERPT: ${pageSlice}`
  );

  if (isPrintPage) {
    console.log(
      `Summary of pages ${pageNum} to ${pageNum + chunkSize}:`,
      rollingSummary
    );
  }
  if (isPrintChunkSummary) {
    console.log(
      `Summary of pages ${pageNum} to ${pageNum + chunkSize}:`,
      rollingSummary
    );
  }
  if (isPrintRollingSummary) {
    console.log(
      `Summary of pages ${pageNum} to ${pageNum + chunkSize}:`,
      rollingSummary
    );
  }
  // console.log(
  //   `Summary of pages ${pageNum} to ${pageNum +
  //     chunkSize}:`,
  //   rollingSummary
  // );
  const { quiz, grade } = await runQuiz(title, synopsis, pageSlice, queryGPT);
  fs.writeFileSync();
  queryUser(pdfTxt, pageNum, rollingSummary, toggles);

  // 2. rollingSummary=queryGPT3(synopsis+pageChunkSummary)
  const newRollingSummary = queryGPT(
    `Given TITLE, OVERALL SUMMARY, and RECENT SUMMARY of content up to this point, summarize the following EXCERPT with respect to the rest of the book, TITLE: ${title}, OVERALL SUMMARY: ${synopsis}, RECENT SUMMARY: ${rollingSummary}, EXCERPT: ${pageSlice}`
  );

  // console.log(`New Meta Summary:`, synopsis);
  if (pageNum + chunkSize < totalPages) {
    // logSummary.push(rollingSummary);
    return eventLoop(pdfTxt, {
      ...readOpts,
      pageNum: pageNum + chunkSize
    });
  } else {
    console.log(logs);
    // 4. record a log of all the summaries and quizzes
    // TODO make subdirectory for ${title}
    fs.writeFileSync(
      "./logs/${nowtime}-${title}",
      JSON.stringify({
        logs,
        readOpts
      })
    );
  }
}

switch (readingOpts.fileType) {
  case "pdf":
    if (!options.isPdfImage || options.isPdfImage === undefined) {
      // extract text from pdf with searchable text
      var pdfOptions = {
        type: "text", // extract the actual text in the pdf file
        mode: "layout", // optional, only applies to 'text' type. Available modes are 'layout', 'simple', 'table' or 'lineprinter'. Default is 'layout'
        ocr_flags: ["--psm 1"], // automatically detect page orientation
        enc: "UTF-8", // optional, encoding to use for the text output
        clean: true // try prevent tmp directory /usr/run/$userId$ from overfilling with parsed pdf pages (doesn't seem to work)
      };

      var processor = pdf_extract(options.file, pdfOptions, function(err) {
        if (err) {
          console.error("failed to extract pdf, err:", err);
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
      eventLoop(pdfTxt, readingOpts);
    });
    break;
  case "url":
    // const text = convert(html, htmlToTxtOpts);
    axios.get(options.webURL)
      .then(function (response) {
        // handle success
        console.log("axios response:", response);

        const text = htmlToText(response.body,
                             {
          // selectors: [
          //   { selector: 'a', options: { baseUrl: 'https://example.com' } },
          //   { selector: 'a.button', format: 'skip' }
          // ]
        }
                            );
        // TODO chunk returned text pdfTxt.text_pages.slice(pageNum, pageNum + chunkSize).join("")

        eventLoop(text, {
          ...readingOpts
        });
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      })
      .finally(function () {
        // always executed
      });
    // console.log(text); // Hello World
  break;

  default:
    console.error("no filetype or url specified or inferrable");
}

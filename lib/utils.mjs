import fs from "fs";
import prettier from "prettier";
import readingListTopLevel from "../readingList.mjs";

export function removeExtraWhitespace(str) {
  // removes any instance of two or whitespace (text often has tons of padding characers), and whitespace from end and beginning of str
  return str.replace(/\s+/g, " ").trim();
}

export function validateObj(object, key, values) {
  if (object[key] && values.includes(object[key])) {
    return true;
  }
  return false;
}

// function readReadingList(filepath) {
//   if (fs.existsSync(filepath)) {
//     (;
//     readingListString.replace(/\n+/g, "").slice(14); // remove newlines && export default

//     return JSON.parse();
//   } else {
//     return {};
//   }
// }

export function writeToReadingList(bookName, readOptions) {
  const readingListString = fs
    .readFileSync(
      "../readingList.js",
      {
        encoding: "utf8",
        flag: "r"
      }.slice(14)
    )
    .toString(); // remove export default
  //  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining
  const checkOutput = eval?.(
    `"use strict"; let readingListTopLevel=${readingListString}`
  );
  if (checkOutput === undefined) {
    console.error(
      "WARNING: FAILED TO EVAL readingListTopLevel in writeToReadingList"
    );
  }
  // let readingList=eval("(" + readingListString + ")"); // parens necessary for eval
  const { rdListDefaults } = readingListTopLevel;
  validateObj(
    readOptions,
    "articleType",
    readingListTopLevel.articleTypeValues
  );
  // validateObj(options, "modeValues", readingList.modeValues)
  if (typeof bookName === "string") {
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

    const unprettyReadingList = JSON.stringify({
      ...readingListTopLevel,
      [bookName]: {
        ...readingListTopLevel[bookName],
        ...readingListEntry
      }
    });
    const finalReadingList = prettier.format(
      "export default " + unprettyReadingList,
      { parser: "babel" }
    );
    //write to readingList
    fs.writeFileSync(`../readingList.js`, finalReadingList);
  } else {
    console.log("No book name supplied to write list");
  }
}

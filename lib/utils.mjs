import fs from "fs";

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
export function writeToReadingList(bookName, readOptions) {
  validateObj(options, "articleType", readingList.articleTypeValues);
  // validateObj(options, "modeValues", readingList.modeValues)
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
    fs.writeFileSync(
      `./readingList.js`,
      JSON.stringify({
        ...readingListTopLevel,
        [bookName]: {
          ...readingListTopLevel[bookName],
          ...readingListEntry
        }
      })
    );
  } else {
    console.log("No book name supplied to write list");
  }
}

export function parseJSONFromFileOrReturnObjectSync(filepath) {
  if (fs.existsSync(filepath)) {
    return JSON.parse(fs.readFileSync(filepath), {
      encoding: "utf8",
      flag: "r"
    });
  } else {
    return {};
  }
}

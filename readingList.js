export default {
  articleTypes: ["book", "research paper", ""],
  typeValueType: ["pdf", "url", "epub"],
  readerExeTypes: ["pdf", "url", "epub"],
  exampleCharacterValues: ["", "socrates", "lao-tzu", "mike tyson"],
  genChunkSummaryPrompt: (title, synopsis, rollingSummary, excerpt) =>
    `Given TITLE, OVERALL SUMMARY, and RECENT SUMMARY of content up to this point, summarize the following EXCERPT, TITLE: ${title}, OVERALL SUMMARY: ${synopsis}, RECENT SUMMARY: ${rollingSummary}, EXCERPT: ${excerpt}`,
  genRollingSummaryPrompt: (title, synopsis, rollingSummary, excerpt) =>
    `Given TITLE, OVERALL SUMMARY, and RECENT SUMMARY of content up to this point, summarize the following EXCERPT with respect to the rest of the book, TITLE: ${title}, OVERALL SUMMARY: ${synopsis}, RECENT SUMMARY: ${rollingSummary}, EXCERPT: ${excerpt}`,
  genQuizPrompt: (title, synopsis, excerpt) =>
    `INSTRUCTIONS: given SUMMARY and CONTENT of book titled "${title}" generate a quiz bank of questions to test knowledge of CONTENT, SUMMARY: ${synopsis} CONTENT$: ${excerpt}`,
  genQuizGradePrompt: (title, synopsis, excerpt, studentAnswers) =>
    `assign a grade in format { grade: x, question1: ["correct", ""], "question2": ["wrong", "correct answer goes here"], ... }, given {SUMMARY} and {CONTENT} of book titled "${title}" to {student answers} to a {QUIZ} to test knowledge of CONTENT, SUMMARY: ${synopsis} CONTENT$: ${excerpt} {QUIZ}: quiz {STUDENT ANSWERS}: ${studentAnswers}`,
  rdListDefaults: {
    pageNumber: 0,
    articleType: "",
    type: {
      value: "",
      url: {
        url: "",
        textCharactersPerPage: 1800
      },
      html: {
        path: "",
        textCharactersPerPage: 1800
      },
      pdf: {
        path: "",
        isImage: ""
      },
      epub: {
        path: "",
        textCharactersPerPage: 1800
      }
    },
    chunkSize: 2,
    narrator: "",
    title: "",
    synopsis: "",
    isPrintPage: true,
    isPrintChunkSummary: true,
    isPrintRollingSummary: true,
    quiz: false,
    max_tokens: 2000,
    readerExe: "",
    readerArgs: "",
    prependContext: [""],
    appendContext: [""],
    summaryPrependContext: [""],
    summaryAppendContext: [""]
  },
  readingList: {
    Frankenstein: {
      pageNumber: 0,
      articleType: "book",
      chunkSize: 2,
      narrator: "Mr. T",
      title: "Frankenstein",
      synopsis:
        "A scientist, Victor Von Frankenstein creates life by infusing corpses with lightning. His Misshapen creature seeks the affection of his father and failing that, the creation of a bride, but Frankenstein refuses leading to a climactic chase across the world as the creature rebels against his creator.",
      isPrintPage: true,
      isPrintChunkSummary: true,
      isPrintRollingSummary: true,
      quiz: false,
      path: "./Frankenstein.pdf",
      url: "",
      max_tokens: 2000,
      executable: "xpdf",
      exeArguments: "-z 200",
      prependContext: [""],
      appendContext: [""]
    },
    "World Models": {
      pageNumber: 0,
      articleType: "book",
      chunkSize: 2,
      title: "World Models: A Path to AGI",
      narrator: "",
      synopsis:
        "In this research paper, Yann Lecunn outlines a differentiable architecture that would allow for online learning and creation of a world model that might be a computational analog for human intuition, intelligence, and consciouss experience.",
      isPrintPage: false,
      isPrintChunkSummary: false,
      isPrintRollingSummary: false,
      quiz: true,
      path: "./a_path_towards_autonomous_mach.pdf",
      url: "",
      max_tokens: 2000,
      executable: "xpdf",
      exeArguments: "-z 200",
      prependContext: [""],
      appendContext: [""]
    }
  },
  readingOptsDefaults: {
    pageNumber: 0,
    articleType: "book",
    chunkSize: 2,
    narrator: "Mr. T",
    synopsis: "",
    isPrintPage: false,
    isPrintPageChunkSummary: "",
    isPrintRollingSummary: "",
    mode: "quiz",
    path: "./Frankenstein.pdf",
    max_tokens: 2000,
    executable: "xpdf",
    exeArguments: "-z 200",
    prependContext: [""],
    appendContext: [""]
  }
};

export default {
  articleTypes: ["book", "research paper", ""],
  fileTypes: ["pdf", "url", "epub"],
  exampleCharacterValues: ["", "socrates", "lao-tzu", "mike tyson"],
  genQuizPrompt: (title, synopsis, excerpt) =>
    `INSTRUCTIONS: given SUMMARY and CONTENT of book titled "${title}" generate a quiz bank of questions to test knowledge of CONTENT, SUMMARY: ${synopsis} CONTENT$: ${excerpt}`,
  genQuizGradePrompt: (title, synopsis, excerpt, studentAnswers) =>
    `assign a grade in format { grade: x, question1: ["correct", ""], "question2": ["wrong", "correct answer goes here"], ... }, given {SUMMARY} and {CONTENT} of book titled "${title}" to {student answers} to a {QUIZ} to test knowledge of CONTENT, SUMMARY: ${synopsis} CONTENT$: ${excerpt} {QUIZ}: quiz {STUDENT ANSWERS}: ${studentAnswers}`,
  defaults: {
    pageNumber: 0,
    articleType: "",
    fileType: "",
    chunkSize: 2,
    narrator: "",
    title: "",
    synopsis: "",
    isPrintPage: true,
    isPrintChunkSummary: true,
    isPrintRollingSummary: true,
    quiz: false,
    path: "",
    url: "",
    max_tokens: 2000,
    executable: "",
    exeArguments: "",
    prependContext: [""],
    appendContext: [""]
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

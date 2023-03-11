import prompt from "prompt";

export default async function runQuiz(title, synopsis, pageSlice, queryGPT) {
  const quiz = await queryGPT(
    `INSTRUCTIONS: given SUMMARY and CONTENT of book titled "${title}" generate a quiz bank of questions to test knowledge of CONTENT, SUMMARY: ${synopsis} CONTENT$: ${pageSlice}`
  );
  console.log(`Quiz:`, quiz);
  // logQuiz.push(quiz);
  // const queryUserDefault("q", true)
  const { answers } = await prompt.get({
    properties: {
      answers: {
        message: "Enter Answers",
        required: true
      }
    }
  });
  const grade = await queryGPT(
    `assign a grade in format { grade: x, question1: ["correct", ""], "question2": ["wrong", "correct answer goes here"], ... }, given {SUMMARY} and {CONTENT} of book titled "${title}" to {student answers} to a {QUIZ} to test knowledge of CONTENT, SUMMARY: ${synopsis} CONTENT$: ${pageSlice} {QUIZ}: quiz {STUDENT ANSWERS}: ${answers}`
  );
  console.log("grade", grade);
  return { quiz, grade };
}

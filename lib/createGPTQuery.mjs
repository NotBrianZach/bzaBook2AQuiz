import { Configuration, OpenAIApi } from "openai";

export function createGptQuery(openaiAPIKey) {
  const openAIConfiguration = new Configuration({
    apiKey: openaiAPIKey
  });
  const openai = new OpenAIApi(openAIConfiguration);
  return async function(gptPrompt) {
    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: gptPrompt,
      max_tokens: 2000
    });
    return completion.data.choices[0].text;
  };
}

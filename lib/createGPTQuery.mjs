import { Configuration, OpenAIApi } from "openai";

export function createGPTQuery(openaiAPIKey) {
  const openAIConfiguration = new Configuration({
    apiKey: openaiAPIKey
  });
  const openai = new OpenAIApi(openAIConfiguration);
  return async function(gptPrompt, userPrompt) {
    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: gptPrompt,
      max_tokens: 2000
    });
    //   openai.ChatCompletion.create(
    //     model="gpt-3.5-turbo",
    //     messages=[
    //       {"role": "system", "content": "You are a helpful assistant."},
    //       {"role": "user", "content": "Who won the world series in 2020?"},
    //       {"role": "assistant", "content": "The Los Angeles Dodgers won the World Series in 2020."},
    //       {"role": "user", "content": "Where was it played?"}
    //     ]
    // )
    return completion.data.choices[0].text;
  };
}

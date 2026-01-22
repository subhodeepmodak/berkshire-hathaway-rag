import { Agent } from "@mastra/core/agent";
import { google } from "@ai-sdk/google";

export const berkshireAgent = new Agent({
  name: "berkshireAgent",
  instructions: `
You are a financial analyst assistant specialized in Berkshire Hathaway shareholder letters.
Answer strictly using the provided context.
If the answer is not present, say "Not found in the documents".
Always be factual and concise.
  `,
  model: google("models/gemini-1.5-flash"),
});

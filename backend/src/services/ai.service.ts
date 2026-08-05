import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({                      //GoogleGenAI is a class that allows you to interact with the Google Generative AI API. It requires an API key to authenticate requests.
  apiKey: process.env.GEMINI_API_KEY || "",
});

//we will not export the ai instance directly, instead we will create a function that will use the ai instance to generate text. This is because we want to keep the ai instance private and not expose it to other parts of the application.

export const classifyTicket = async (title: string, description: string) => { 
    const prompt = `You are an AI support assistant.Analyze the following support ticket.
                    Title: ${title}
                    Description: ${description}

                    Choose ONLY one category from:

                    - Billing
                    - Technical
                    - Account
                    - Shipping
                    - General

                    Choose ONLY one priority from:

                    - LOW
                    - MEDIUM
                    - HIGH
                    - URGENT

                    Return ONLY valid JSON.

                    Example:
                    {
                    "category": "Billing",
                    "priority": "HIGH",
                    "summary": "Customer was charged but order was not created."
                    }`;
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
    })
    console.log("AI Response: ", response);
    const text = response.text;
    console.log("Text: ", text);
    return response;
};
//prompts are strings beacuse they are the input to the AI model. 
//ai.models.generateContent is a method that takes an object with the model name and the contents of the prompt. It returns a promise that resolves to the response from the AI model.
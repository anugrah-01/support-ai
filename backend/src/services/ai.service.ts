import { GoogleGenAI } from "@google/genai";
import { AppError } from "../utils/AppError.js";
import { aiTicketSchema } from "../validation/ai.schema.js";

const ai = new GoogleGenAI({                      //GoogleGenAI is a class that allows you to interact with the Google Generative AI API. It requires an API key to authenticate requests.
  apiKey: process.env.GEMINI_API_KEY || "",
});

//we will not export the ai instance directly, instead we will create a function that will use the ai instance to generate text. This is because we want to keep the ai instance private and not expose it to other parts of the application.

// export const classifyTicket = async (title: string, description: string) => { 
//     const prompt = `You are an AI support assistant.Analyze the following support ticket.
//                     Title: ${title}
//                     Description: ${description}

//                     Choose ONLY one category from:

//                     - Billing
//                     - Technical
//                     - Account
//                     - Shipping
//                     - General

//                     Choose ONLY one priority from:

//                     - LOW
//                     - MEDIUM
//                     - HIGH
//                     - URGENT

//                     Return ONLY valid JSON.

//                     Example:
//                     {
//                     "category": "Billing",
//                     "priority": "HIGH",
//                     "summary": "Customer was charged but order was not created."
//                     }`;
//     const response = await ai.models.generateContent({
//         model: "gemini-3-flash-preview",
//         contents: prompt,
//     })
//     console.log("AI Response: ", response);
//     const text = response.text;
//     const aiResponse = JSON.parse(text as string); //parse the text to JSON, because the AI response is a string, we need to parse it to JSON to access the category and priority.
//     console.log("aiResponse: ", aiResponse);
//     return aiResponse;
// };
//prompts are strings beacuse they are the input to the AI model. 
//ai.models.generateContent is a method that takes an object with the model name and the contents of the prompt. It returns a promise that resolves to the response from the AI model.

export const analyzeTicket = async (title: string, description: string) => {
    try {
        const prompt = `You are a professional AI support assistant.Analyze the following support ticket and generate a professional customer support reply.

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

                    Generate:
                    - A concise summary.
                    - A professional, empathetic customer reply.

                    Instructions:

                    - Do not invent information.
                    - Do not promise refunds or resolutions unless explicitly stated.
                    - Keep the summary concise.
                    - Keep the reply under 150 words.
                    - Return ONLY valid JSON.
                    - Do NOT wrap the response inside markdown.

                    Example:
                    {
                    "category": "Billing",
                    "priority": "HIGH",
                    "summary": "Customer was charged but order was not created.",
                    "reply": "Dear Customer, we sincerely apologize for the inconvenience..."
                    }`;
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
        })
        const text = response.text;
        const parsed = JSON.parse(text as string); //parse the text to JSON, because the AI response is a string, we need to parse it to JSON to access the category and priority.
        const aiResponse = aiTicketSchema.parse(parsed); //validate the parsed response using zod schema, if the response is not valid, it will throw an error.
        return aiResponse;
    } catch (error) {
        console.error("Error in analyzeTicket: ", error);
        throw new AppError("Failed to analyze ticket", 500);
    }
};

// export const generateReply = async (category: string, priority: string, summary: string) => {
//     try{
//         const prompt = `You are a professional customer support agent. Generate a polite and empathetic response based on the following support ticket.
//         Category: ${category}
//         Priority: ${priority}
//         Summary: ${summary}
//         Instructions:
//         - Be professional and empathetic.
//         - Keep the reply under 150 words.
//         - Do not make false promises.
//         - Do not invent information.
//         - If the issue requires investigation, mention that it will be reviewed by the support team.
//         - Return only the reply text.`;

//         const response = await ai.models.generateContent({
//             model: "gemini-3-flash-preview",
//             contents: prompt,
//         });
//         const text = response.text;
//         console.log("AI Response: ", text);
//         if (!text) {
//             throw new AppError("AI returned an empty response", 500);
//         }
//         return text;
//     } catch (error) {
//         console.error("Error in generateReply: ", error);
//         throw new AppError("Failed to generate reply", 500);
//     }
// };
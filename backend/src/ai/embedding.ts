import { ai } from "../config/gemini.js";

export const generateEmbedding = async (text : string) => {
    try {
        const response = await ai.models.embedContent({                 //embedContent is a method that takes an object with the model name and the content to be embedded. It returns a promise that resolves to the response from the AI model.
            model: "gemini-embedding-001",
            contents: text,
        });
        console.log("Embedding Response: ", response);
        const embedding = response.embeddings?.[0]?.values;

        if (!embedding) {
            throw new Error("Embedding was not generated");
        }

        return embedding;
    } catch(error:any) {
        console.error("Error generating embedding: ", error);
        throw new Error("Failed to generate embedding");
    }
}
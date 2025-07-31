
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const textModel = 'gemini-2.5-flash';

/**
 * Transcribes audio data using the Gemini API.
 * @param base64Audio The base64 encoded audio string.
 * @param mimeType The MIME type of the audio (e.g., 'audio/webm').
 * @returns The transcribed text.
 */
export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
    try {
        const audioPart = {
            inlineData: {
                mimeType,
                data: base64Audio,
            },
        };

        const textPart = {
            text: "Transcribe this audio recording of a personal voice note. Focus on capturing the spoken words accurately.",
        };
        
        const response = await ai.models.generateContent({
            model: textModel,
            contents: { parts: [audioPart, textPart] }
        });

        return response.text;
    } catch (error) {
        console.error("Error transcribing audio:", error);
        return "Transcription failed. Please check the console for details.";
    }
};

/**
 * Summarizes a given piece of text using the Gemini API.
 * @param textToSummarize The text content of the note.
 * @returns A concise summary of the text.
 */
export const summarizeText = async (textToSummarize: string): Promise<string> => {
    if (!textToSummarize.trim()) {
        return "Nothing to summarize.";
    }
    try {
        const response = await ai.models.generateContent({
            model: textModel,
            contents: `Summarize the following note into a few key bullet points. Be concise and clear:\n\n---\n\n${textToSummarize}`
        });
        
        return response.text;
    } catch (error) {
        console.error("Error summarizing text:", error);
        return "Summarization failed. Please check the console for details.";
    }
};

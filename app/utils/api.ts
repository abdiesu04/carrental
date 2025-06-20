import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Function to extract YouTube video ID from URL
export function extractVideoId(url: string): string | null {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : null;
}

// Function to fetch YouTube transcript using RapidAPI
export async function fetchTranscript(videoId: string): Promise<any> {
  const options = {
    method: 'GET',
    url: 'https://youtube-video-summarizer-gpt-ai.p.rapidapi.com/api/v1/get-transcript-v2',
    params: {
      video_id: videoId,
      platform: 'youtube'
    },
    headers: {
      'x-rapidapi-host': 'youtube-video-summarizer-gpt-ai.p.rapidapi.com',
      'x-rapidapi-key': '1398d6de61mshc044ad3a07480e8p120353jsnc54a9c1ad019'
    }
  };

  try {
    console.log('Making RapidAPI request with options:', {
      url: options.url,
      params: options.params,
      headers: {
        'x-rapidapi-host': options.headers['x-rapidapi-host'],
        // Don't log the full API key
        'x-rapidapi-key': options.headers['x-rapidapi-key'].substring(0, 5) + '...'
      }
    });
    
    const response = await axios.request(options);
    
    if (!response.data) {
      throw new Error('No data returned from API');
    }
    
    console.log('RapidAPI response status:', response.status);
    console.log('RapidAPI response has transcript:', !!response.data.transcript);
    console.log('RapidAPI response has video_title:', !!response.data.video_title);
    
    return response.data;
  } catch (error: any) {
    console.error('Error fetching transcript:', error);
    
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      throw new Error(`Failed to fetch video transcript: ${error.message} - Status: ${error.response?.status || 'unknown'}`);
    }
    
    throw new Error(`Failed to fetch video transcript: ${error.message}`);
  }
}

// Function to generate summary using Gemini API
export async function generateSummary(transcript: string, videoTitle: string): Promise<{
  summary: string;
  keyPoints: string[];
}> {
  try {
    const genAI = new GoogleGenerativeAI('AIzaSyBqhzSh_lVHjglCX1QG2UrppncXfvlEA6U');
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
    You are a professional content summarizer. I need you to create a concise summary of the following YouTube video transcript.
    
    Video Title: "${videoTitle}"
    
    Transcript:
    ${transcript}
    
    Please provide:
    1. A concise summary (3-5 paragraphs) that captures the main ideas and purpose of the video
    2. A list of 5-7 key points or takeaways from the video
    
    Format your response as JSON with the following structure:
    {
      "summary": "Your summary here...",
      "keyPoints": ["Point 1", "Point 2", "Point 3", "Point 4", "Point 5"]
    }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const jsonStr = jsonMatch[0];
      return JSON.parse(jsonStr);
    } else {
      throw new Error('Failed to parse AI response');
    }
  } catch (error) {
    console.error('Error generating summary:', error);
    throw new Error('Failed to generate summary');
  }
}

// Function to generate AI chat responses
export async function generateChatResponse(
  message: string, 
  videoContext: { title: string; summary: string; keyPoints: string[] }
): Promise<string> {
  try {
    const genAI = new GoogleGenerativeAI('AIzaSyBqhzSh_lVHjglCX1QG2UrppncXfvlEA6U');
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const contextStr = `
    Video Title: "${videoContext.title}"
    
    Summary: ${videoContext.summary}
    
    Key Points:
    ${videoContext.keyPoints.map((point, i) => `${i + 1}. ${point}`).join('\n')}
    `;

    const prompt = `
    You are an AI assistant helping a user understand a YouTube video they just watched.
    You have access to the video's summary and key points.
    
    Context about the video:
    ${contextStr}
    
    The user asks: "${message}"
    
    Provide a helpful, conversational response that directly answers their question based on the video content.
    If you don't know the answer based on the provided context, be honest about it.
    Keep your response concise and focused on the user's question.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating chat response:', error);
    throw new Error('Failed to generate response');
  }
} 
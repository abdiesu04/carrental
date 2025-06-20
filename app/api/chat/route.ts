import { NextRequest, NextResponse } from 'next/server';
import { generateChatResponse } from '@/app/utils/youtube';

export async function POST(request: NextRequest) {
  try {
    const { message, videoContext } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (!videoContext || !videoContext.title || !videoContext.summary || !videoContext.keyPoints) {
      return NextResponse.json(
        { error: 'Video context is required' },
        { status: 400 }
      );
    }

    // Generate AI response
    const response = await generateChatResponse(message, videoContext);

    return NextResponse.json({ response });
  } catch (error: any) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { 
        error: error.message || 'An error occurred while processing the request',
        details: error.toString(),
        stack: error.stack
      },
      { status: 500 }
    );
  }
} 
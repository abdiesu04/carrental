import { NextRequest, NextResponse } from 'next/server';
import { fetchVideoDetails } from '@/app/utils/youtube';

export async function GET(request: NextRequest) {
  try {
    // Test video ID (a popular YouTube video)
    const videoId = 'dQw4w9WgXcQ';
    
    console.log('Making test API request for video ID:', videoId);
    const videoDetails = await fetchVideoDetails(videoId);
    console.log('Video details received:', videoDetails);

    return NextResponse.json({
      success: true,
      message: 'API connection successful',
      videoTitle: videoDetails.title,
      author: videoDetails.author_name,
      thumbnail: videoDetails.thumbnail_url
    });
  } catch (error: any) {
    console.error('Test API error:', error);
    
    let errorDetails = 'Unknown error';
    if (error instanceof Error) {
      errorDetails = error.message;
    }

    return NextResponse.json(
      {
        success: false,
        message: 'API connection failed',
        error: errorDetails
      },
      { status: 500 }
    );
  }
} 
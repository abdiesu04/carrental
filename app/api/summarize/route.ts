import { NextRequest, NextResponse } from 'next/server';
import { extractVideoId, generateSummary, fetchVideoDetails } from '@/app/utils/youtube';

export async function POST(request: NextRequest) {
  try {
    console.log('Summarize API called');
    
    const { videoUrl } = await request.json();
    console.log('Video URL:', videoUrl);

    if (!videoUrl) {
      return NextResponse.json(
        { error: 'Video URL is required' },
        { status: 400 }
      );
    }

    // Extract video ID from URL
    const videoId = extractVideoId(videoUrl);
    console.log('Extracted video ID:', videoId);
    
    if (!videoId) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }

    try {
      // First get video details
      const videoDetails = await fetchVideoDetails(videoId);
      const videoTitle = videoDetails.title || 'YouTube Video';
      
      // Generate summary using our new utility
      console.log('Generating summary for video ID:', videoId);
      const summaryData = await generateSummary(videoId, videoTitle);
      console.log('Summary generated successfully');

      // Return the summary data along with video info
      return NextResponse.json({
        videoId,
        videoTitle,
        summary: summaryData.summary,
        keyPoints: summaryData.keyPoints
      });
    } catch (summaryError: any) {
      console.error('Error in summary generation:', summaryError);
      return NextResponse.json(
        { 
          error: summaryError.message || 'Failed to generate summary', 
          details: summaryError.toString(),
          stack: summaryError.stack
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in summarize API:', error);
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
'use client';

import { useState } from 'react';
import axios from 'axios';
import Image from 'next/image';
import LoadingSpinner from './components/LoadingSpinner';

interface SummaryData {
  videoId: string;
  videoTitle: string;
  summary: string;
  keyPoints: string[];
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function Home() {
  const [videoUrl, setVideoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiTestResult, setApiTestResult] = useState<string | null>(null);
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const validateYouTubeUrl = (url: string) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    return youtubeRegex.test(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!videoUrl.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }

    if (!validateYouTubeUrl(videoUrl)) {
      setError('Please enter a valid YouTube URL');
      return;
    }

    setError('');
    setIsLoading(true);
    setSummaryData(null);
    setShowChat(false);
    setChatMessages([]);

    try {
      console.log('Submitting URL for summarization:', videoUrl);
      const response = await axios.post('/api/summarize', { videoUrl });
      console.log('Summary response received:', response.data);
      setSummaryData(response.data);
    } catch (error: any) {
      console.error('Error during summarization:', error);
      
      // Extract the most useful error message
      let errorMessage = 'Failed to generate summary';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.details) {
        errorMessage = error.response.data.details;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const testApiConnection = async () => {
    setIsTestingApi(true);
    setApiTestResult(null);
    
    try {
      const response = await axios.get('/api/test-api');
      console.log('API test response:', response.data);
      
      if (response.data.success) {
        setApiTestResult(`✅ API connection successful! Video title: ${response.data.videoTitle}`);
      } else {
        setApiTestResult(`❌ API connection failed: ${JSON.stringify(response.data)}`);
      }
    } catch (error: any) {
      console.error('API test error:', error);
      setApiTestResult(`❌ API test error: ${error.message}`);
    } finally {
      setIsTestingApi(false);
    }
  };

  const handleStartChat = () => {
    if (summaryData) {
      setShowChat(true);
      setChatMessages([
        {
          role: 'assistant',
          content: `I can answer questions about "${summaryData.videoTitle}". What would you like to know?`
        }
      ]);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!chatInput.trim() || isChatLoading || !summaryData) return;
    
    const userMessage = chatInput.trim();
    setChatInput('');
    
    // Add user message to chat
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    // Set loading state
    setIsChatLoading(true);
    
    try {
      // Get response from AI
      const response = await axios.post('/api/chat', {
        message: userMessage,
        videoContext: {
          title: summaryData.videoTitle,
          summary: summaryData.summary,
          keyPoints: summaryData.keyPoints
        }
      });
      
      // Add AI response to chat
      setChatMessages(prev => [...prev, { role: 'assistant', content: response.data.response }]);
    } catch (error: any) {
      console.error('Chat error:', error);
      setChatMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: 'Sorry, I encountered an error processing your request. Please try again.' 
        }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-10 pt-8">
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-16 h-16 mr-4">
              <div className="absolute inset-0 bg-red-600 rounded-full opacity-80"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 border-4 border-white rounded-sm"></div>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-red-400">
              YouTube Summarizer
            </h1>
          </div>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Get instant AI-powered summaries of any YouTube video. Save time and extract key insights in seconds.
          </p>
        </header>

        <div className="bg-gray-800 backdrop-blur-lg bg-opacity-50 rounded-2xl shadow-2xl p-8 mb-8 border border-gray-700 transform transition-all hover:border-red-500">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="videoUrl" className="block text-lg font-medium text-gray-200 mb-2">
                Enter YouTube Video URL
              </label>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 0C4.478 0 0 4.478 0 10C0 15.522 4.478 20 10 20C15.522 20 20 15.522 20 10C20 4.478 15.522 0 10 0ZM14.613 10.406L7.549 14.08C7.221 14.256 6.888 14.073 6.888 13.702V6.298C6.888 5.927 7.221 5.744 7.549 5.92L14.613 9.594C14.941 9.77 14.941 10.23 14.613 10.406Z" />
                    </svg>
                  </div>
                  <input
                    id="videoUrl"
                    type="text"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="block w-full pl-10 pr-3 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    disabled={isLoading}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-medium rounded-lg shadow-lg hover:from-red-500 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Summarizing...
                    </span>
                  ) : 'Summarize'}
                </button>
              </div>
              {error && (
                <div className="mt-3 flex items-center text-sm text-red-400 bg-red-900 bg-opacity-30 p-2 rounded">
                  <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}
            </div>
          </form>
          
          <div className="mt-4 pt-4 border-t border-gray-700">
            <button
              onClick={testApiConnection}
              disabled={isTestingApi}
              className="text-sm text-gray-400 hover:text-gray-200 flex items-center transition-colors"
            >
              {isTestingApi ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Testing API...
                </span>
              ) : (
                <span className="flex items-center">
                  <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Test API Connection
                </span>
              )}
            </button>
            {apiTestResult && (
              <p className="mt-2 text-sm font-mono bg-gray-900 bg-opacity-50 p-3 rounded border border-gray-700">
                {apiTestResult}
              </p>
            )}
          </div>
        </div>

        {isLoading && <LoadingSpinner />}

        {summaryData && !isLoading && (
          <div className="space-y-8">
            <div className="bg-gray-800 backdrop-blur-lg bg-opacity-50 rounded-2xl shadow-2xl p-8 border border-gray-700 transition-all hover:border-red-500">
              <div className="mb-8">
                <div className="aspect-w-16 aspect-h-9 mb-6 overflow-hidden rounded-xl shadow-2xl">
                  <iframe
                    src={`https://www.youtube.com/embed/${summaryData.videoId}`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-64 md:h-96 rounded-xl"
                  ></iframe>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">{summaryData.videoTitle}</h2>
                <div className="flex items-center text-gray-400 text-sm">
                  <svg className="h-4 w-4 mr-1 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                  AI Summary Generated
                </div>
              </div>

              <div className="mb-8 bg-gray-900 bg-opacity-50 p-6 rounded-xl border-l-4 border-red-500">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Summary
                </h3>
                <p className="text-gray-300 whitespace-pre-line leading-relaxed">{summaryData.summary}</p>
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                  </svg>
                  Key Points
                </h3>
                <ul className="space-y-3">
                  {summaryData.keyPoints.map((point, index) => (
                    <li key={index} className="flex items-start bg-gray-900 bg-opacity-30 p-3 rounded-lg">
                      <span className="flex-shrink-0 h-6 w-6 flex items-center justify-center bg-red-600 rounded-full text-white text-sm font-bold mr-3">
                        {index + 1}
                      </span>
                      <span className="text-gray-300">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {!showChat && (
                <button
                  onClick={handleStartChat}
                  className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-xl shadow-lg hover:from-purple-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all flex items-center justify-center"
                >
                  <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                  Ask Questions About This Video
                </button>
              )}
            </div>

            {showChat && (
              <div className="bg-gray-800 backdrop-blur-lg bg-opacity-50 rounded-2xl shadow-2xl p-6 border border-gray-700 transition-all hover:border-purple-500">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                    <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                  </svg>
                  Chat About This Video
                </h3>
                
                <div className="h-96 overflow-y-auto mb-4 p-4 bg-gray-900 bg-opacity-50 rounded-xl border border-gray-700 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
                  {chatMessages.map((message, index) => (
                    <div
                      key={index}
                      className={`mb-4 ${
                        message.role === 'user' ? 'text-right' : 'text-left'
                      }`}
                    >
                      <div
                        className={`inline-block max-w-[80%] px-4 py-3 rounded-2xl ${
                          message.role === 'user'
                            ? 'bg-purple-700 text-white'
                            : 'bg-gray-700 text-gray-200'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  ))}
                  
                  {isChatLoading && (
                    <div className="text-left mb-4">
                      <div className="inline-block px-4 py-3 rounded-2xl bg-gray-700">
                        <div className="flex space-x-2">
                          <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce"></div>
                          <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <div className="relative flex-grow">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask a question about the video..."
                      className="block w-full pl-4 pr-12 py-3 bg-gray-700 border border-gray-600 rounded-xl text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      disabled={isChatLoading}
                    />
                    <button
                      type="submit"
                      disabled={isChatLoading || !chatInput.trim()}
                      className="absolute right-2 top-2 p-2 text-purple-500 hover:text-purple-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                      </svg>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
        
        <footer className="mt-16 text-center text-sm text-gray-500 pb-8">
          <p>© {new Date().getFullYear()} YouTube Summarizer. All rights reserved.</p>
          <p className="mt-1">Powered by AI. Created with ❤️</p>
        </footer>
      </div>
    </div>
  );
}

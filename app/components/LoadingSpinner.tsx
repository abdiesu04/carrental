export default function LoadingSpinner() {
  return (
    <div className="w-full flex flex-col justify-center items-center py-16">
      <div className="relative">
        <div className="h-24 w-24 rounded-full border-t-4 border-b-4 border-red-500 animate-spin"></div>
        <div className="absolute top-0 left-0 h-24 w-24 rounded-full border-r-4 border-l-4 border-transparent border-r-purple-500 border-l-purple-500 animate-pulse"></div>
      </div>
      <p className="mt-6 text-white text-lg font-medium">Generating Summary...</p>
      <p className="text-gray-400 text-sm">This may take a moment</p>
    </div>
  );
} 
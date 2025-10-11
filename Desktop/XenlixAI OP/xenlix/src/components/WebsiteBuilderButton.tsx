'use client';

interface WebsiteBuilderButtonProps {
  websiteBuilderUrl?: string;
}

export default function WebsiteBuilderButton({ websiteBuilderUrl }: WebsiteBuilderButtonProps) {
  const handleClick = () => {
    if (websiteBuilderUrl) {
      // Open the website builder URL in a new tab
      window.open(websiteBuilderUrl, '_blank');
    } else {
      // Placeholder action - you can replace this with your actual URL later
      alert('Website Builder coming soon! We will redirect you to our website builder platform.');
    }
  };

  return (
    <div className="mt-16 text-center">
      <div className="bg-gradient-to-r from-slate-800/80 to-purple-800/80 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-8 max-w-2xl mx-auto">
        <h3 className="text-3xl font-bold text-white mb-4">Need a New Website?</h3>
        <p className="text-gray-300 mb-6">
          Our AI Website Builder creates professional, SEO-optimized websites in minutes.
        </p>
        <button
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 px-8 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 text-lg cursor-pointer"
          onClick={handleClick}
          suppressHydrationWarning={true}
        >
          Launch Website Builder
        </button>
        <p className="text-sm text-gray-400 mt-3">Professional websites optimized for SEO</p>
      </div>
    </div>
  );
}

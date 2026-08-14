import React from 'react';
import { Home, AlertTriangle } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-8 text-center shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-red-500/10 rounded-full">
            <AlertTriangle className="w-12 h-12 text-red-500" />
          </div>
        </div>
        
        <h1 className="text-6xl font-bold text-white mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
        
        <p className="text-slate-400 mb-8">
          The page you are looking for doesn't exist or has been moved.
          Please check the URL or return to the main application.
        </p>
        
        <a 
          href="/" 
          className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          <Home className="w-5 h-5" />
          Return Home
        </a>
      </div>
      
      <div className="mt-8 text-sm text-slate-500">
        &copy; {new Date().getFullYear()} Celeritas Simulation Suite
      </div>
    </div>
  );
};

export default NotFound;

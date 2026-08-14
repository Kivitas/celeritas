import React from 'react';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <a href="/" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Application
        </a>
        
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 md:p-12 shadow-xl">
          <div className="flex items-center gap-4 mb-8 border-b border-slate-800 pb-8">
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <ShieldCheck className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
              <p className="text-slate-400 mt-1">Last updated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
          
          <div className="prose prose-invert max-w-none prose-slate">
            <p>
              At Celeritas Spectrometry Suite, accessible from our application, one of our main priorities is the privacy of our visitors and users. This Privacy Policy document contains types of information that is collected and recorded by Celeritas and how we use it.
            </p>
            
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">1. Information We Collect</h2>
            <p>
              Celeritas operates primarily as a client-side simulation tool. We do not require you to create an account, and we do not collect personally identifiable information (PII) during your standard use of the physics simulation tools.
            </p>
            <p>
              If you choose to use the AI Assistant features, your prompts and associated telemetry may be processed by third-party AI providers (such as OpenAI, Anthropic, or Google) according to the API keys you provide locally. Your API keys are stored locally in your browser's local storage and are never transmitted to our servers.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">2. Local Storage & Cookies</h2>
            <p>
              We use standard browser features like Local Storage and Session Storage to save your simulation parameters, interface preferences (such as dark mode), and locally stored API keys. This data remains on your device. We use a single cookie or local storage item to remember your cookie consent preferences.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">3. Log Files</h2>
            <p>
              Like many standard web applications, our hosting provider may log standard anonymous access data including internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks. These are not linked to any information that is personally identifiable.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">4. Consent</h2>
            <p>
              By using our application, you hereby consent to our Privacy Policy and agree to its terms.
            </p>
            
            <div className="mt-12 p-6 bg-slate-800/50 rounded-xl border border-slate-700">
              <p className="m-0 text-slate-300">
                If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact the development team or open an issue on our repository.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

import React from 'react';

const MainFooter: React.FC = () => {
  return (
    <footer className="bg-slate-800 text-white text-xs p-6 text-center mt-auto">
      <div className="container mx-auto">
        <p>&copy; {new Date().getFullYear()} JD2CV. All rights reserved.</p>
        <p className="mt-1">
          <a href="/privacy-policy" className="hover:underline">Privacy Policy</a> | <a href="/terms-of-service" className="hover:underline">Terms of Service</a>
        </p>
         <p className="mt-2">
          <strong>Privacy Notice:</strong> To provide and improve our services, JD2CV may share your data with third-party AI tools to generate and optimize your CV.
          By using JD2CV, you consent to this data processing. We are committed to ensuring our practices are UK and EU friendly.
        </p>
      </div>
    </footer>
  );
};

export default MainFooter;

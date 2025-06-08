
import React, { useRef } from 'react';

interface EEGFooterControlsProps {
  duration: number;
  onFileUpload: (file: File) => void;
}

const EEGFooterControls: React.FC<EEGFooterControlsProps> = ({ duration, onFileUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="mt-4 flex items-center justify-between text-sm text-gray-500 bg-gray-50/50 p-3 rounded-lg">
      <div className="flex items-center space-x-4">
        <span>🔄 Mise à jour: 1s</span>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".edf"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="text-xs px-2 py-1 bg-medical-blue text-white rounded hover:bg-medical-blue/90"
      >
        Charger EDF
      </button>
    </div>
  );
};

export default EEGFooterControls;

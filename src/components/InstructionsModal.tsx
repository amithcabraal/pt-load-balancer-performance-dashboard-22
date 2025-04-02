import React from 'react';
import { X } from 'lucide-react';

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InstructionsModal({ isOpen, onClose }: InstructionsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full mx-4 shadow-xl">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Instructions</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="prose dark:prose-invert max-w-none">
            <h3 className="text-lg font-semibold mb-2">How to use this dashboard:</h3>
            <ol className="list-decimal list-inside space-y-2">
              <li>Click "Open AWS Athena" to access the query interface</li>
              <li>Click "Generate LB Query" to create queries with your desired date range</li>
              <li>Choose between Load Balancer Analysis or Performance Metrics queries</li>
              <li>Run the query in Athena and download the results as CSV</li>
              <li>Upload the CSV file using the upload button below</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useRef } from 'react';
import CardWrapper from './CardWrapper';

interface DatabaseFileUploadProps {
  onFileUploaded: (filename: string) => void;
  isLoading: boolean;
}

const DatabaseFileUpload: React.FC<DatabaseFileUploadProps> = ({ onFileUploaded, isLoading }) => {
  const [uploadStatus, setUploadStatus] = useState<{
    isUploading: boolean;
    progress: number;
    error: string | null;
    success: string | null;
  }>({
    isUploading: false,
    progress: 0,
    error: null,
    success: null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file extension
    if (!file.name.endsWith('.duckdb') && !file.name.endsWith('.db')) {
      setUploadStatus({
        isUploading: false,
        progress: 0,
        error: 'Please select a valid DuckDB file (.duckdb or .db)',
        success: null,
      });
      return;
    }

    setUploadStatus({
      isUploading: true,
      progress: 10,
      error: null,
      success: null,
    });

    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);

      // Start upload
      const response = await fetch('/api/db/upload', {
        method: 'POST',
        body: formData,
      });

      setUploadStatus(prev => ({ ...prev, progress: 90 }));

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      const result = await response.json();

      setUploadStatus({
        isUploading: false,
        progress: 100,
        error: null,
        success: `${file.name} uploaded successfully!`,
      });

      // Notify parent component
      if (result.filename) {
        onFileUploaded(result.filename);
      }
    } catch (error) {
      setUploadStatus({
        isUploading: false,
        progress: 0,
        error: `Upload failed: ${(error as Error).message}`,
        success: null,
      });
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <CardWrapper title="Upload Database">
      <div className="upload-container">
        <p className="upload-info">
          Upload a DuckDB database file (.duckdb or .db) to analyze and visualize your data.
        </p>
        
        <div className="upload-controls">
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange} 
            accept=".duckdb,.db"
            style={{ display: 'none' }}
          />
          
          <button 
            className="btn primary-btn"
            onClick={triggerFileInput}
            disabled={isLoading || uploadStatus.isUploading}
          >
            Select Database File
          </button>
        </div>
        
        {uploadStatus.isUploading && (
          <div className="upload-progress">
            <div className="progress-bar-container">
              <div 
                className="progress-bar" 
                style={{ width: `${uploadStatus.progress}%` }}
              ></div>
            </div>
            <span className="progress-text">Uploading... {uploadStatus.progress}%</span>
          </div>
        )}
        
        {uploadStatus.error && (
          <div className="error-message upload-message">
            {uploadStatus.error}
          </div>
        )}
        
        {uploadStatus.success && (
          <div className="success-message upload-message">
            {uploadStatus.success}
          </div>
        )}

        <div className="upload-info-footer">
          <p className="helper-text">
            Your database will be securely stored on the server for analysis.
          </p>
        </div>
      </div>

      <style jsx>{`
        .upload-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          gap: 1rem;
        }
        
        .upload-info {
          margin-bottom: 0.5rem;
          color: #4a5568;
        }
        
        .upload-controls {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        
        .upload-progress {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        
        .progress-bar-container {
          width: 100%;
          height: 0.5rem;
          background-color: #e2e8f0;
          border-radius: 9999px;
          overflow: hidden;
        }
        
        .progress-bar {
          height: 100%;
          background-color: #4299e1;
          transition: width 0.3s ease;
        }
        
        .progress-text {
          font-size: 0.875rem;
          color: #4a5568;
        }
        
        .upload-message {
          padding: 0.75rem;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }
        
        .success-message {
          background-color: #c6f6d5;
          color: #276749;
          border: 1px solid #9ae6b4;
        }
        
        .upload-info-footer {
          margin-top: auto;
        }
      `}</style>
    </CardWrapper>
  );
};

export default DatabaseFileUpload;
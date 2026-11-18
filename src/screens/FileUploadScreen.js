import React, { useState } from 'react';
import { singleFileUpload, multipleFilesUpload } from '../data/api';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const FileUploadScreen = (props) => {
  const [singleFile, setSingleFile] = useState(null);
  const [multipleFiles, setMultipleFiles] = useState([]);
  const [title, setTitle] = useState('');
  const [singleProgress, setSingleProgress] = useState(0);
  const [multipleProgress, setMultipleProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const singleFileChange = (e) => {
    setSingleFile(e.target.files[0]);
    setSingleProgress(0);
    setStatusMessage('');
  };

  const multipleFileChange = (e) => {
    setMultipleFiles(e.target.files);
    setMultipleProgress(0);
    setStatusMessage('');
  };

  const singleFileOptions = {
    onUploadProgress: (progressEvent) => {
      const { loaded, total } = progressEvent;
      const percentage = Math.floor(((loaded / 1000) * 100) / (total / 1000));
      setSingleProgress(percentage);
    },
  };

  const multipleFileOptions = {
    onUploadProgress: (progressEvent) => {
      const { loaded, total } = progressEvent;
      const percentage = Math.floor(((loaded / 1000) * 100) / (total / 1000));
      setMultipleProgress(percentage);
    },
  };

  const uploadSingleFile = async () => {
    if (!singleFile) {
      setIsError(true);
      setStatusMessage('Select a document before uploading.');
      return;
    }
    try {
      setIsError(false);
      setStatusMessage('');
      const formData = new FormData();
      formData.append('file', singleFile);
      await singleFileUpload(formData, singleFileOptions);
      setSingleFile(null);
      document.getElementById('single-file-input').value = '';
      setStatusMessage('Document parsed and saved to database.');
      props.getsingle();
    } catch (err) {
      setIsError(true);
      setStatusMessage('Upload failed. Verify backend server on port 5001.');
    }
  };

  const uploadMultipleFiles = async () => {
    if (!multipleFiles || multipleFiles.length === 0) {
      setIsError(true);
      setStatusMessage('Select at least one file for batch processing.');
      return;
    }
    try {
      setIsError(false);
      setStatusMessage('');
      const formData = new FormData();
      formData.append('title', title.trim() || 'Untitled Document Batch');
      for (let i = 0; i < multipleFiles.length; i++) {
        formData.append('files', multipleFiles[i]);
      }
      await multipleFilesUpload(formData, multipleFileOptions);
      setMultipleFiles([]);
      setTitle('');
      document.getElementById('multi-file-input').value = '';
      setStatusMessage(`Batch of ${multipleFiles.length} files indexed.`);
      props.getMultiple();
    } catch (err) {
      setIsError(true);
      setStatusMessage('Batch upload failed. Check supported formats.');
    }
  };

  return (
    <aside className="upload-panel">
      <div className="panel-section">
        <div className="section-header">
          <h2>Single Document Analysis</h2>
          <span className="mono-tag">POST /api/singleFile</span>
        </div>
        <p className="field-hint">
          Supported formats: PDF, TXT, MD, CSV, JSON, DOCX, PNG, JPG
        </p>

        <div className="form-group">
          <label htmlFor="single-file-input" className="field-label">
            Source File
          </label>
          <input
            id="single-file-input"
            type="file"
            className="file-input"
            onChange={singleFileChange}
          />
        </div>

        <div className="action-row">
          <button
            type="button"
            className="btn-primary"
            onClick={uploadSingleFile}
          >
            Upload & Parse
          </button>
          <div className="progress-box">
            <CircularProgressbar
              value={singleProgress}
              text={`${singleProgress}%`}
              styles={buildStyles({
                textSize: '26px',
                pathColor: '#1d4ed8',
                textColor: '#181a1f',
                trailColor: '#e5e7eb',
              })}
            />
          </div>
        </div>
      </div>

      <div className="panel-divider" />

      <div className="panel-section">
        <div className="section-header">
          <h2>Batch Archive Ingestion</h2>
          <span className="mono-tag">POST /api/multipleFiles</span>
        </div>

        <div className="form-group">
          <label htmlFor="batch-title-input" className="field-label">
            Collection Title
          </label>
          <input
            id="batch-title-input"
            type="text"
            className="text-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Q4 Financial Invoices"
          />
        </div>

        <div className="form-group">
          <label htmlFor="multi-file-input" className="field-label">
            Select Multiple Files
          </label>
          <input
            id="multi-file-input"
            type="file"
            className="file-input"
            multiple
            onChange={multipleFileChange}
          />
        </div>

        <div className="action-row">
          <button
            type="button"
            className="btn-secondary"
            onClick={uploadMultipleFiles}
          >
            Process Batch
          </button>
          <div className="progress-box">
            <CircularProgressbar
              value={multipleProgress}
              text={`${multipleProgress}%`}
              styles={buildStyles({
                textSize: '26px',
                pathColor: '#181a1f',
                textColor: '#181a1f',
                trailColor: '#e5e7eb',
              })}
            />
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className={`status-banner ${isError ? 'status-error' : 'status-ok'}`}>
          {statusMessage}
        </div>
      )}
    </aside>
  );
};

export default FileUploadScreen;

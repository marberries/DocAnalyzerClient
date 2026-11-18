import React, { useState } from 'react';
import { singleFileUpload, multipleFilesUpload } from '../data/api';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const FileUploadScreen = ({ onSingleAnalyzed, onBatchAnalyzed }) => {
  const [mode, setMode] = useState('single');
  const [singleFile, setSingleFile] = useState(null);
  const [multipleFiles, setMultipleFiles] = useState([]);
  const [title, setTitle] = useState('');
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const uploadOptions = {
    onUploadProgress: (progressEvent) => {
      const { loaded, total } = progressEvent;
      if (total) {
        const pct = Math.min(92, Math.floor((loaded * 100) / total));
        setProgress(pct);
      }
    },
  };

  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    if (!singleFile) {
      setFeedback({ type: 'error', text: 'Choose a file first (PDF, DOCX, TXT, MD, or Image).' });
      return;
    }
    try {
      setIsProcessing(true);
      setFeedback({ type: 'info', text: 'Extracting text and generating AI summary...' });
      const formData = new FormData();
      formData.append('file', singleFile);

      const createdDoc = await singleFileUpload(formData, uploadOptions);
      setProgress(100);
      setSingleFile(null);
      const input = document.getElementById('single-file-input');
      if (input) input.value = '';
      setFeedback({ type: 'success', text: `Analysis complete: "${createdDoc.fileName}"` });
      if (onSingleAnalyzed) onSingleAnalyzed(createdDoc);
    } catch (err) {
      setProgress(0);
      setFeedback({ type: 'error', text: 'Analysis failed. Verify backend server is running on port 5001.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchSubmit = async (e) => {
    e.preventDefault();
    if (!multipleFiles || multipleFiles.length === 0) {
      setFeedback({ type: 'error', text: 'Select at least one file for batch analysis.' });
      return;
    }
    const count = multipleFiles.length;
    try {
      setIsProcessing(true);
      setFeedback({ type: 'info', text: `Processing ${count} documents...` });
      const formData = new FormData();
      formData.append('title', title.trim() || `Batch Archive (${count} files)`);
      for (let i = 0; i < count; i++) {
        formData.append('files', multipleFiles[i]);
      }

      const createdBatch = await multipleFilesUpload(formData, uploadOptions);
      setProgress(100);
      setMultipleFiles([]);
      setTitle('');
      const input = document.getElementById('multi-file-input');
      if (input) input.value = '';
      setFeedback({ type: 'success', text: `Batch indexed (${count} files).` });
      if (onBatchAnalyzed) onBatchAnalyzed(createdBatch);
    } catch (err) {
      setProgress(0);
      setFeedback({ type: 'error', text: 'Batch processing failed. Check file formats.' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <aside className="upload-panel">
      <div className="step-badge">STEP 1 · INPUT DOCUMENT</div>
      <h2 className="panel-title">Upload & Analyze</h2>
      <p className="field-hint">
        Select a document to extract full text, classify topic, and generate structured key takeaways.
      </p>

      <div className="mode-switch">
        <button
          type="button"
          className={`mode-btn ${mode === 'single' ? 'active' : ''}`}
          onClick={() => {
            setMode('single');
            setProgress(0);
            setFeedback({ type: '', text: '' });
          }}
        >
          Single File
        </button>
        <button
          type="button"
          className={`mode-btn ${mode === 'batch' ? 'active' : ''}`}
          onClick={() => {
            setMode('batch');
            setProgress(0);
            setFeedback({ type: '', text: '' });
          }}
        >
          Multiple Files
        </button>
      </div>

      {mode === 'single' ? (
        <form onSubmit={handleSingleSubmit}>
          <label htmlFor="single-file-input" className="drop-zone">
            <span className="drop-title">
              {singleFile ? singleFile.name : 'Click to select file'}
            </span>
            <span className="drop-sub">
              {singleFile
                ? `${(singleFile.size / 1024).toFixed(1)} KB · Ready to analyze`
                : 'PDF, DOCX, TXT, MD, CSV, JSON, PNG, JPG'}
            </span>
            <input
              id="single-file-input"
              type="file"
              className="hidden-file-input"
              disabled={isProcessing}
              onChange={(e) => {
                setSingleFile(e.target.files[0] || null);
                setProgress(0);
                setFeedback({ type: '', text: '' });
              }}
            />
          </label>

          <div className="action-row">
            <button
              type="submit"
              className="btn-primary"
              disabled={isProcessing || !singleFile}
            >
              {isProcessing ? 'Analyzing...' : 'Analyze Document'}
            </button>
            <div className="progress-box">
              <CircularProgressbar
                value={progress}
                text={`${progress}%`}
                styles={buildStyles({
                  textSize: '26px',
                  pathColor: '#1d4ed8',
                  textColor: '#181a1f',
                  trailColor: '#e5e7eb',
                })}
              />
            </div>
          </div>
        </form>
      ) : (
        <form onSubmit={handleBatchSubmit}>
          <div className="form-group">
            <label htmlFor="batch-title-input" className="field-label">
              Collection Name
            </label>
            <input
              id="batch-title-input"
              type="text"
              className="text-input"
              value={title}
              disabled={isProcessing}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Coursework Lab Reports"
            />
          </div>

          <label htmlFor="multi-file-input" className="drop-zone">
            <span className="drop-title">
              {multipleFiles.length > 0
                ? `${multipleFiles.length} file(s) selected`
                : 'Click to select multiple files'}
            </span>
            <span className="drop-sub">
              Hold Cmd or Shift to select several documents
            </span>
            <input
              id="multi-file-input"
              type="file"
              className="hidden-file-input"
              multiple
              disabled={isProcessing}
              onChange={(e) => {
                setMultipleFiles(e.target.files || []);
                setProgress(0);
                setFeedback({ type: '', text: '' });
              }}
            />
          </label>

          <div className="action-row">
            <button
              type="submit"
              className="btn-primary"
              disabled={isProcessing || multipleFiles.length === 0}
            >
              {isProcessing ? 'Processing Batch...' : 'Analyze Batch'}
            </button>
            <div className="progress-box">
              <CircularProgressbar
                value={progress}
                text={`${progress}%`}
                styles={buildStyles({
                  textSize: '26px',
                  pathColor: '#1d4ed8',
                  textColor: '#181a1f',
                  trailColor: '#e5e7eb',
                })}
              />
            </div>
          </div>
        </form>
      )}

      {feedback.text && (
        <div className={`status-banner status-${feedback.type}`}>
          {feedback.text}
        </div>
      )}

      <div className="workflow-guide">
        <div className="guide-title">How it works</div>
        <ol className="guide-list">
          <li>Select a PDF, DOCX, TXT, or image file above.</li>
          <li>Click <strong>Analyze Document</strong> to parse text and run Gemini AI.</li>
          <li>Inspect the summary, key takeaways, and extracted text on the right.</li>
        </ol>
      </div>
    </aside>
  );
};

export default FileUploadScreen;

import React, { useState, useEffect } from 'react';
import './App.css';
import FileUploadScreen from './screens/FileUploadScreen';
import {
  getSingleFiles,
  getMultipleFiles,
  deleteSingleFile,
} from './data/api';

const CATEGORIES = [
  'All',
  'Legal / Contract',
  'Financial Report',
  'Academic / Research',
  'Technical Documentation',
  'General Document',
];

function App() {
  const [singleFiles, setSingleFiles] = useState([]);
  const [multipleFiles, setMultipleFiles] = useState([]);
  const [activeTab, setActiveTab] = useState('single');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [apiConnected, setApiConnected] = useState(true);
  const [loading, setLoading] = useState(true);
  const [previewDoc, setPreviewDoc] = useState(null);

  const getSingleFilesList = async () => {
    try {
      const filesList = await getSingleFiles();
      setSingleFiles(filesList);
      setApiConnected(true);
    } catch (error) {
      setApiConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const getMultipleFilesList = async () => {
    try {
      const filesList = await getMultipleFiles();
      setMultipleFiles(filesList);
    } catch (error) {
      // Handled by main status check
    }
  };

  useEffect(() => {
    getSingleFilesList();
    getMultipleFilesList();
  }, []);

  const handleDelete = async (id) => {
    try {
      await deleteSingleFile(id);
      setSingleFiles((prev) => prev.filter((item) => item._id !== id));
      if (previewDoc && previewDoc._id === id) {
        setPreviewDoc(null);
      }
    } catch (error) {
      alert('Failed to delete record from server.');
    }
  };

  const getCategoryClass = (category) => {
    switch (category) {
      case 'Legal / Contract':
        return 'badge badge-legal';
      case 'Financial Report':
        return 'badge badge-finance';
      case 'Academic / Research':
        return 'badge badge-academic';
      case 'Technical Documentation':
        return 'badge badge-tech';
      default:
        return 'badge badge-general';
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    const d = new Date(isoString);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredSingleFiles = singleFiles.filter((file) => {
    const matchesCategory =
      selectedCategory === 'All' || file.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      (file.fileName && file.fileName.toLowerCase().includes(q)) ||
      (file.summary && file.summary.toLowerCase().includes(q)) ||
      (file.keywords && file.keywords.some((kw) => kw.toLowerCase().includes(q)));
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand-block">
            <h1 className="brand-title">DocAnalyzer</h1>
            <span className="brand-sep">/</span>
            <span className="brand-subtitle">
              Document Parsing & Metadata Registry
            </span>
          </div>

          <div className="topbar-meta">
            <span className="meta-counter">
              Indexed: <strong>{singleFiles.length}</strong> docs ·{' '}
              <strong>{multipleFiles.length}</strong> batches
            </span>
            <span
              className={`connection-pill ${
                apiConnected ? 'pill-online' : 'pill-offline'
              }`}
            >
              <span className="dot" />
              {apiConnected ? 'API :5001 Connected' : 'API Offline'}
            </span>
          </div>
        </div>
      </header>

      <main className="workspace">
        <FileUploadScreen
          getsingle={getSingleFilesList}
          getMultiple={getMultipleFilesList}
        />

        <section className="registry-panel">
          <div className="registry-toolbar">
            <div className="view-tabs">
              <button
                type="button"
                className={`tab-btn ${activeTab === 'single' ? 'active' : ''}`}
                onClick={() => setActiveTab('single')}
              >
                Single Documents ({singleFiles.length})
              </button>
              <button
                type="button"
                className={`tab-btn ${activeTab === 'multiple' ? 'active' : ''}`}
                onClick={() => setActiveTab('multiple')}
              >
                Batch Collections ({multipleFiles.length})
              </button>
            </div>

            {activeTab === 'single' && (
              <div className="search-wrap">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Filter by filename, summary, or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="clear-search"
                    onClick={() => setSearchQuery('')}
                  >
                    Clear
                  </button>
                )}
              </div>
            )}
          </div>

          {activeTab === 'single' && (
            <>
              <div className="category-bar">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`cat-chip ${
                      selectedCategory === cat ? 'active' : ''
                    }`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="empty-state">Loading records from MongoDB...</div>
              ) : filteredSingleFiles.length === 0 ? (
                <div className="empty-state">
                  No documents match the current filter. Upload a file on the
                  left panel to inspect extracted metadata.
                </div>
              ) : (
                <div className="document-list">
                  {filteredSingleFiles.map((file) => (
                    <article key={file._id} className="doc-card">
                      <div className="doc-card-top">
                        <div className="doc-title-row">
                          <span className={getCategoryClass(file.category)}>
                            {file.category || 'General Document'}
                          </span>
                          <h3 className="doc-filename">{file.fileName}</h3>
                        </div>

                        <div className="doc-actions">
                          <button
                            type="button"
                            className="btn-preview"
                            onClick={() => setPreviewDoc(file)}
                          >
                            Preview
                          </button>
                          <a
                            href={`/${file.filePath}`}
                            target="_blank"
                            rel="noreferrer"
                            className="link-raw"
                          >
                            Raw File
                          </a>
                          <button
                            type="button"
                            className="btn-delete"
                            onClick={() => handleDelete(file._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      <div className="doc-specs">
                        <span>Size: {file.fileSize}</span>
                        <span>·</span>
                        <span>Words: {file.wordCount || 0}</span>
                        <span>·</span>
                        <span>MIME: {file.fileType}</span>
                        <span>·</span>
                        <span>Uploaded: {formatDate(file.createdAt)}</span>
                      </div>

                      <div className="doc-summary-box">
                        <span className="box-label">Analytical Summary</span>
                        <p className="doc-summary-text">
                          {file.summary || 'No text summary extracted.'}
                        </p>

                        {file.keyFindings && file.keyFindings.length > 0 && (
                          <ul className="findings-list">
                            {file.keyFindings.map((point, idx) => (
                              <li key={idx}>{point}</li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {file.keywords && file.keywords.length > 0 && (
                        <div className="keyword-row">
                          <span className="kw-prefix">Keywords:</span>
                          {file.keywords.map((kw, idx) => (
                            <button
                              key={idx}
                              type="button"
                              className="kw-tag"
                              onClick={() => setSearchQuery(kw)}
                              title="Filter by this keyword"
                            >
                              {kw}
                            </button>
                          ))}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'multiple' && (
            <div className="document-list">
              {multipleFiles.length === 0 ? (
                <div className="empty-state">
                  No batch collections uploaded yet.
                </div>
              ) : (
                multipleFiles.map((batch) => (
                  <article key={batch._id} className="doc-card">
                    <div className="doc-card-top">
                      <div className="doc-title-row">
                        <span className="badge badge-tech">
                          {batch.files.length} files
                        </span>
                        <h3 className="doc-filename">{batch.title}</h3>
                      </div>
                      <span className="doc-specs">
                        {formatDate(batch.createdAt)}
                      </span>
                    </div>

                    {batch.batchSummary && (
                      <p className="doc-summary-text batch-note">
                        {batch.batchSummary}
                      </p>
                    )}

                    <table className="batch-table">
                      <thead>
                        <tr>
                          <th>File Name</th>
                          <th>Category</th>
                          <th>Words</th>
                          <th>Size</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {batch.files.map((item, idx) => (
                          <tr key={idx}>
                            <td className="mono-cell">{item.fileName}</td>
                            <td>{item.category}</td>
                            <td className="mono-cell">{item.wordCount}</td>
                            <td className="mono-cell">{item.fileSize}</td>
                            <td className="table-actions">
                              <button
                                type="button"
                                className="btn-preview"
                                onClick={() => setPreviewDoc(item)}
                              >
                                Preview
                              </button>
                              <a
                                href={`/${item.filePath}`}
                                target="_blank"
                                rel="noreferrer"
                                className="link-raw"
                              >
                                Raw
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </article>
                ))
              )}
            </div>
          )}
        </section>
      </main>

      {previewDoc && (
        <div className="modal-backdrop" onClick={() => setPreviewDoc(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className={getCategoryClass(previewDoc.category)}>
                  {previewDoc.category || 'General Document'}
                </span>
                <h3 className="modal-title">{previewDoc.fileName}</h3>
              </div>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setPreviewDoc(null)}
              >
                Close
              </button>
            </div>

            <div className="doc-specs">
              <span>Size: {previewDoc.fileSize}</span>
              <span>·</span>
              <span>Words: {previewDoc.wordCount || 0}</span>
              <span>·</span>
              <span>Type: {previewDoc.fileType}</span>
            </div>

            <div className="doc-summary-box">
              <span className="box-label">Summary</span>
              <p className="doc-summary-text">{previewDoc.summary}</p>
            </div>

            <div className="modal-body">
              <span className="box-label">Extracted Document Content</span>
              <pre className="extracted-pre">
                {previewDoc.extractedText || previewDoc.summary || 'No text content stored.'}
              </pre>
            </div>

            <div className="modal-footer">
              <a
                href={`/${previewDoc.filePath}`}
                target="_blank"
                rel="noreferrer"
                className="btn-primary modal-link"
              >
                Open Original File in New Tab
              </a>
            </div>
          </div>
        </div>
      )}

      <footer className="app-footer">
        <span>DocAnalyzer MERN Client · Academic Coursework Build (2026)</span>
        <span>Backend Proxy: http://localhost:5001/api</span>
      </footer>
    </div>
  );
}

export default App;

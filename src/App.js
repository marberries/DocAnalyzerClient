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
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [activeTab, setActiveTab] = useState('single');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [apiConnected, setApiConnected] = useState(true);
  const [loading, setLoading] = useState(true);

  const loadAllData = async (autoSelectFirst = false) => {
    try {
      const [singles, batches] = await Promise.all([
        getSingleFiles(),
        getMultipleFiles(),
      ]);
      setSingleFiles(singles);
      setMultipleFiles(batches);
      setApiConnected(true);
      if (autoSelectFirst && singles.length > 0) {
        setSelectedDoc(singles[0]);
      }
    } catch (error) {
      setApiConnected(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData(true);
  }, []);

  const handleSingleAnalyzed = (newDoc) => {
    setActiveTab('single');
    setSelectedCategory('All');
    setSearchQuery('');
    setSelectedDoc(newDoc);
    loadAllData(false);
  };

  const handleBatchAnalyzed = (newBatch) => {
    setActiveTab('multiple');
    if (newBatch && newBatch.files && newBatch.files.length > 0) {
      setSelectedDoc(newBatch.files[0]);
    }
    loadAllData(false);
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await deleteSingleFile(id);
      const updated = singleFiles.filter((item) => item._id !== id);
      setSingleFiles(updated);
      if (selectedDoc && selectedDoc._id === id) {
        setSelectedDoc(updated.length > 0 ? updated[0] : null);
      }
    } catch (error) {
      alert('Failed to delete record from database.');
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
    if (!isoString) return 'Just now';
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
              Intelligent Document Parsing & Metadata Registry
            </span>
          </div>

          <div className="topbar-meta">
            <span className="meta-counter">
              Database: <strong>{singleFiles.length}</strong> docs ·{' '}
              <strong>{multipleFiles.length}</strong> batches
            </span>
            <span
              className={`connection-pill ${
                apiConnected ? 'pill-online' : 'pill-offline'
              }`}
            >
              <span className="dot" />
              {apiConnected ? 'Backend :5001 Online' : 'Backend Offline'}
            </span>
          </div>
        </div>
      </header>

      <main className="workspace">
        <FileUploadScreen
          onSingleAnalyzed={handleSingleAnalyzed}
          onBatchAnalyzed={handleBatchAnalyzed}
        />

        <div className="content-column">
          {/* STEP 2: ACTIVE ANALYSIS RESULT SPOTLIGHT */}
          <section className="result-spotlight">
            <div className="spotlight-header">
              <div>
                <div className="step-badge">STEP 2 · ANALYSIS OUTPUT</div>
                {selectedDoc ? (
                  <div className="spotlight-title-row">
                    <h2 className="spotlight-title">{selectedDoc.fileName}</h2>
                    <span className={getCategoryClass(selectedDoc.category)}>
                      {selectedDoc.category || 'General Document'}
                    </span>
                    <span
                      className={`ai-pill ${
                        selectedDoc.aiAnalyzed ? 'ai-yes' : 'ai-no'
                      }`}
                    >
                      {selectedDoc.aiAnalyzed
                        ? 'Gemini AI Verified'
                        : 'Local Text Parser'}
                    </span>
                  </div>
                ) : (
                  <h2 className="spotlight-title">
                    No Document Selected Yet
                  </h2>
                )}
              </div>

              {selectedDoc && selectedDoc.filePath && (
                <a
                  href={`/${selectedDoc.filePath}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-outline"
                >
                  Download / Open Original
                </a>
              )}
            </div>

            {!selectedDoc ? (
              <div className="empty-spotlight">
                Upload a document on the left panel or click any item in the archive below to view its structured analysis here.
              </div>
            ) : (
              <div className="spotlight-body">
                <div className="metrics-strip">
                  <div className="metric-item">
                    <span className="metric-label">Word Count</span>
                    <span className="metric-value">
                      {selectedDoc.wordCount || 0}
                    </span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">File Size</span>
                    <span className="metric-value">{selectedDoc.fileSize}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Keywords Found</span>
                    <span className="metric-value">
                      {selectedDoc.keywords ? selectedDoc.keywords.length : 0}
                    </span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Processed At</span>
                    <span className="metric-value">
                      {formatDate(selectedDoc.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="analysis-grid">
                  <div className="analysis-block">
                    <span className="box-label">Executive Summary</span>
                    <p className="summary-paragraph">
                      {selectedDoc.summary || 'No summary generated.'}
                    </p>

                    {selectedDoc.keyFindings &&
                      selectedDoc.keyFindings.length > 0 && (
                        <>
                          <span className="box-label findings-heading">
                            Key Takeaways
                          </span>
                          <ul className="findings-list">
                            {selectedDoc.keyFindings.map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        </>
                      )}

                    {selectedDoc.keywords &&
                      selectedDoc.keywords.length > 0 && (
                        <div className="keyword-row">
                          <span className="kw-prefix">Extracted Tags:</span>
                          {selectedDoc.keywords.map((kw, idx) => (
                            <button
                              key={idx}
                              type="button"
                              className="kw-tag"
                              onClick={() => setSearchQuery(kw)}
                            >
                              {kw}
                            </button>
                          ))}
                        </div>
                      )}
                  </div>

                  <div className="analysis-block">
                    <span className="box-label">
                      Extracted Document Text (Readable View)
                    </span>
                    <div className="extracted-text-box">
                      {selectedDoc.extractedText ||
                        'No plain text content was extracted from this file.'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* STEP 3: ARCHIVE & FILTERING */}
          <section className="registry-panel">
            <div className="step-badge">STEP 3 · INDEXED ARCHIVE</div>
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
                  className={`tab-btn ${
                    activeTab === 'multiple' ? 'active' : ''
                  }`}
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
                    placeholder="Search archive..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="clear-search"
                      onClick={() => setSearchQuery('')}
                    >
                      Reset
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
                  <div className="empty-state">Loading records...</div>
                ) : filteredSingleFiles.length === 0 ? (
                  <div className="empty-state">
                    No documents found for this filter.
                  </div>
                ) : (
                  <div className="archive-list">
                    {filteredSingleFiles.map((file) => {
                      const isSelected =
                        selectedDoc && selectedDoc._id === file._id;
                      return (
                        <div
                          key={file._id}
                          className={`archive-row ${
                            isSelected ? 'selected-row' : ''
                          }`}
                          onClick={() => setSelectedDoc(file)}
                        >
                          <div className="archive-row-main">
                            <span className={getCategoryClass(file.category)}>
                              {file.category || 'General Document'}
                            </span>
                            <span className="archive-filename">
                              {file.fileName}
                            </span>
                            <span className="archive-meta">
                              {file.wordCount || 0} words · {file.fileSize}
                            </span>
                          </div>

                          <div className="archive-row-actions">
                            <button
                              type="button"
                              className="btn-inspect"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDoc(file);
                              }}
                            >
                              {isSelected ? 'Viewing' : 'Inspect'}
                            </button>
                            <button
                              type="button"
                              className="btn-delete"
                              onClick={(e) => handleDelete(file._id, e)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {activeTab === 'multiple' && (
              <div className="archive-list">
                {multipleFiles.length === 0 ? (
                  <div className="empty-state">
                    No batch collections indexed yet.
                  </div>
                ) : (
                  multipleFiles.map((batch) => (
                    <div key={batch._id} className="doc-card">
                      <div className="doc-card-top">
                        <div className="doc-title-row">
                          <span className="badge badge-tech">
                            {batch.files.length} files
                          </span>
                          <h3 className="doc-filename">{batch.title}</h3>
                        </div>
                        <span className="archive-meta">
                          {formatDate(batch.createdAt)}
                        </span>
                      </div>

                      <table className="batch-table">
                        <thead>
                          <tr>
                            <th>File Name</th>
                            <th>Category</th>
                            <th>Words</th>
                            <th>Size</th>
                            <th>Inspect</th>
                          </tr>
                        </thead>
                        <tbody>
                          {batch.files.map((item, idx) => (
                            <tr
                              key={idx}
                              className="clickable-tr"
                              onClick={() => setSelectedDoc(item)}
                            >
                              <td className="mono-cell">{item.fileName}</td>
                              <td>{item.category}</td>
                              <td className="mono-cell">{item.wordCount}</td>
                              <td className="mono-cell">{item.fileSize}</td>
                              <td>
                                <button
                                  type="button"
                                  className="btn-inspect"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedDoc(item);
                                  }}
                                >
                                  Inspect
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))
                )}
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="app-footer">
        <span>DocAnalyzer MERN Client · Full-Stack Document Analysis System</span>
        <span>API Proxy: /api → http://localhost:5001</span>
      </footer>
    </div>
  );
}

export default App;

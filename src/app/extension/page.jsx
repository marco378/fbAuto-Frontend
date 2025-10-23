"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import axiosInstance from '../../lib/axios';
import './extension.css';

export default function ExtensionSetup() {
  const router = useRouter();
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [newTokenName, setNewTokenName] = useState('');
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [newToken, setNewToken] = useState(null);

  useEffect(() => {
    // Check auth by calling /auth/profile
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      await axiosInstance.get('/auth/profile', { withCredentials: true });
      // User is authenticated, fetch tokens
      await fetchTokens();
    } catch (error) {
      // Not authenticated, redirect to login
      toast.error('Please login first');
      router.push('/auth/login');
    }
  };

  const fetchTokens = async () => {
    try {
      const response = await axiosInstance.get('/extension/tokens', {
        withCredentials: true
      });
      setTokens(response.data.tokens);
    } catch (error) {
      console.error('Failed to fetch tokens:', error);
      toast.error('Failed to load tokens');
    } finally {
      setLoading(false);
    }
  };

  const generateToken = async () => {
    setGenerating(true);
    try {
      const response = await axiosInstance.post(
        '/extension/tokens/generate',
        { name: newTokenName || `Browser - ${new Date().toLocaleDateString()}` },
        { withCredentials: true }
      );
      
      setNewToken(response.data.token);
      setShowTokenModal(true);
      setNewTokenName('');
      await fetchTokens();
      toast.success('Token generated successfully!');
    } catch (error) {
      toast.error('Failed to generate token');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Token copied to clipboard!');
  };

  const revokeToken = async (tokenId) => {
    if (!confirm('Are you sure you want to revoke this token?')) return;
    
    try {
      await axiosInstance.delete(`/extension/tokens/${tokenId}`, {
        withCredentials: true
      });
      await fetchTokens();
      toast.success('Token revoked successfully');
    } catch (error) {
      toast.error('Failed to revoke token');
    }
  };

  const downloadExtension = () => {
    window.location.href = '/extension.zip';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="extension-setup">
      <div className="header">
        <h1>🔌 Browser Extension Setup</h1>
        <p>Automate job posting directly from your browser</p>
      </div>

      {/* Step 1: Download */}
      <div className="setup-card">
        <div className="step-badge">1</div>
        <div className="step-content">
          <h2>Download Extension</h2>
          <p>Download and install the Chrome extension</p>
          <button onClick={downloadExtension} className="btn btn-primary">
            📥 Download Extension
          </button>
          <details className="install-instructions">
            <summary>Installation Instructions</summary>
            <ol>
              <li>Unzip the downloaded file</li>
              <li>Open Chrome and go to <code>chrome://extensions/</code></li>
              <li>Enable "Developer mode" (top right)</li>
              <li>Click "Load unpacked"</li>
              <li>Select the unzipped folder</li>
            </ol>
          </details>
        </div>
      </div>

      {/* Step 2: Generate Token */}
      <div className="setup-card">
        <div className="step-badge">2</div>
        <div className="step-content">
          <h2>Generate Authentication Token</h2>
          <p>Create a secure token for the extension</p>
          
          <div className="token-generator">
            <input
              type="text"
              placeholder="Token name (optional)"
              value={newTokenName}
              onChange={(e) => setNewTokenName(e.target.value)}
              className="token-input"
            />
            <button 
              onClick={generateToken} 
              disabled={generating}
              className="btn btn-primary"
            >
              {generating ? '⏳ Generating...' : '🔑 Generate Token'}
            </button>
          </div>
        </div>
      </div>

      {/* Step 3: Activate */}
      <div className="setup-card">
        <div className="step-badge">3</div>
        <div className="step-content">
          <h2>Activate Extension</h2>
          <ol>
            <li>Click the extension icon in your browser toolbar</li>
            <li>Paste your token in the input field</li>
            <li>Click "Activate"</li>
            <li>Extension will start working automatically!</li>
          </ol>
        </div>
      </div>

      {/* Active Tokens */}
      <div className="tokens-section">
        <h2>Your Active Tokens</h2>
        {tokens.length === 0 ? (
          <div className="empty-state">
            <p>No tokens generated yet</p>
            <p>Generate a token above to get started</p>
          </div>
        ) : (
          <div className="tokens-grid">
            {tokens.map(token => (
              <div key={token.id} className={`token-card ${token.isActive ? 'active' : 'inactive'}`}>
                <div className="token-header">
                  <h3>{token.name}</h3>
                  <span className={`status-badge ${token.isActive ? 'active' : 'inactive'}`}>
                    {token.isActive ? '✅ Active' : '❌ Revoked'}
                  </span>
                </div>
                
                <div className="token-body">
                  <code className="token-value">{token.token}</code>
                  <button 
                    onClick={() => copyToClipboard(token.token)}
                    className="copy-btn"
                  >
                    📋 Copy
                  </button>
                </div>
                
                <div className="token-footer">
                  <small>Created: {new Date(token.createdAt).toLocaleDateString()}</small>
                  <small>Last used: {new Date(token.lastUsedAt).toLocaleString()}</small>
                  {token.isActive && (
                    <button 
                      onClick={() => revokeToken(token.id)}
                      className="revoke-btn"
                    >
                      🗑️ Revoke
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Token Modal */}
      {showTokenModal && newToken && (
        <div className="modal-overlay" onClick={() => setShowTokenModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>🎉 Token Generated!</h2>
            <p>Copy this token and paste it in the extension</p>
            <div className="token-display">
              <code>{newToken.token}</code>
              <button onClick={() => copyToClipboard(newToken.token)} className="btn btn-primary">
                📋 Copy Token
              </button>
            </div>
            <p className="warning">
              ⚠️ Save this token securely. You won't be able to see it again.
            </p>
            <button onClick={() => setShowTokenModal(false)} className="btn btn-secondary">
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

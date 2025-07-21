import React, { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'https://ytnrpehg76.execute-api.ap-southeast-1.amazonaws.com/prod/GetPhishingEmail';

const UploadEmail = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [convertText, setConvertText] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setAnalysis(null);
    setConvertText(null);

    if (!file) {
      setSelectedFile(null);
      setUploadStatus('');
      return;
    }

    if (file.name.endsWith('.eml')) {
      setSelectedFile(file);
      setUploadStatus('');
    } else if (file.name.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = function (ev) {
        setConvertText(ev.target.result);
        setSelectedFile(null);
        setUploadStatus('Convert your .txt to .eml before uploading.');
      };
      reader.readAsText(file);
    } else {
      setSelectedFile(null);
      setUploadStatus('Please select a .eml or .txt file');
    }
  };

  const handleConvertToEml = () => {
    if (!convertText) return;
    const blob = new Blob([convertText], { type: "message/rfc822" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = "converted.eml";
    link.click();
    setConvertText(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAnalysis(null);
    if (!selectedFile) {
      setUploadStatus('No file selected');
      return;
    }
    try {
      setUploadStatus('Uploading...');
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await fetch(API_URL, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      setAnalysis(data);
      setUploadStatus('Upload successful!');
    } catch (err) {
      console.error(err);
      setUploadStatus('Upload failed: ' + (err.message || 'Network error'));
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#191d24", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div style={{
        background: "#242b36", borderRadius: "1.5rem", padding: "2rem", minWidth: 340, boxShadow: "0 10px 36px #0007"
      }}>
        <h2 style={{ color: "#fff", textAlign: "center", marginBottom: 18 }}>Phishing Email Analyzer</h2>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <input type="file" accept=".eml,.txt" onChange={handleFileChange} style={{ background: "#23272f", color: "#fff", border: 0, borderRadius: 6, padding: "0.5em" }} />
          <button type="submit" style={{ padding: "0.5em", borderRadius: 6, background: "#2563eb", color: "#fff", border: 0, fontWeight: 600 }}>Upload & Analyze</button>
        </form>
        <div style={{ color: "#eee", marginTop: 12 }}>{uploadStatus}</div>
        {convertText && (
          <div style={{ marginTop: 18 }}>
            <button onClick={handleConvertToEml} style={{
              padding: "0.5em", borderRadius: 6, background: "#7c3aed", color: "#fff", border: 0, fontWeight: 600
            }}>
              Download as .eml and re-upload
            </button>
          </div>
        )}
        {analysis &&
          <div style={{
            background: "#181e25", borderRadius: "1rem", marginTop: 18, padding: 18, color: "#d8e7ff"
          }}>
            <div><b>Verdict:</b> <span style={{ color: "#60a5fa" }}>{analysis.verdict}</span></div>
            <div><b>Risk Score:</b> <span>{analysis.risk_score}</span></div>
            <div><b>Flags:</b>
              <ul>
                {analysis.flags.map((flag, i) => <li key={i}>{flag}</li>)}
              </ul>
            </div>
            <div><b>Subject:</b> {analysis.email_data.subject}</div>
            <div><b>From:</b> {analysis.email_data.from}</div>
            <div><b>To:</b> {analysis.email_data.to}</div>
            <div><b>Date:</b> {analysis.email_data.date}</div>
          </div>
        }
      </div>
    </div>
  );
};

export default UploadEmail;

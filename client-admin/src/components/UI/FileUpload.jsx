import React, { useCallback, useState } from 'react';
import { IoCloudUploadOutline, IoDocumentTextOutline, IoImageOutline, IoVideocamOutline, IoCloseCircle } from 'react-icons/io5';

export default function FileUpload({ onFilesSelected, maxLimitMB = 300 }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    validateAndAddFiles(files);
  };

  const validateAndAddFiles = (files) => {
    setError('');
    const validFiles = [];
    const maxBytes = maxLimitMB * 1024 * 1024;
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf', '.mp4', '.mov'];

    for (const file of files) {
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      
      if (!allowedExtensions.includes(ext)) {
        setError(`ไม่รองรับประเภทไฟล์ ${ext} (รองรับเฉพาะ: ${allowedExtensions.join(', ')})`);
        return;
      }

      if (file.size > maxBytes) {
        setError(`ไฟล์ '${file.name}' มีขนาดเกิน ${maxLimitMB} MB`);
        return;
      }

      validFiles.push(file);
    }

    const updated = [...selectedFiles, ...validFiles];
    setSelectedFiles(updated);
    onFilesSelected(updated);
  };

  const removeFile = (index) => {
    const updated = [...selectedFiles];
    updated.splice(index, 1);
    setSelectedFiles(updated);
    onFilesSelected(updated);
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return <IoImageOutline size={20} />;
    if (fileType.startsWith('video/')) return <IoVideocamOutline size={20} />;
    return <IoDocumentTextOutline size={20} />;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      <div
        style={{
          border: '2px dashed var(--glass-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-xl)',
          textAlign: 'center',
          cursor: 'pointer',
          background: 'rgba(255, 255, 255, 0.02)',
          transition: 'all var(--transition-normal)'
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          validateAndAddFiles(Array.from(e.dataTransfer.files));
        }}
        onClick={() => document.getElementById('file-upload-input').click()}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-primary-dim)';
          e.currentTarget.style.background = 'rgba(0, 178, 255, 0.02)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--glass-border)';
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
        }}
      >
        <input
          type="file"
          id="file-upload-input"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <IoCloudUploadOutline size={40} style={{ color: 'var(--color-primary)', marginBottom: 'var(--space-sm)' }} />
        <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' }}>
          ลากไฟล์มาวางที่นี่ หรือคลิกเพื่ออัปโหลด
        </p>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          รองรับรูปภาพ, PDF, วิดีโอ (สูงสุด {maxLimitMB} MB ต่อไฟล์)
        </p>
      </div>

      {error && (
        <span style={{ fontSize: '0.8rem', color: 'var(--color-danger)', fontWeight: 500 }}>
          ⚠️ {error}
        </span>
      )}

      {selectedFiles.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {selectedFiles.map((file, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                <span style={{ color: 'var(--color-accent)' }}>{getFileIcon(file.type)}</span>
                <span style={{ fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>
                  {file.name}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeFile(idx)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', display: 'flex', cursor: 'pointer' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-danger)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                <IoCloseCircle size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

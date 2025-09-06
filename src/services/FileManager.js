import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class FileManager {
  constructor() {
    this.files = new Map(); // In-memory storage for demo purposes
    this.tempDir = path.join(__dirname, '../../temp');
    this.maxFileAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    // Create temp directory if it doesn't exist
    this.ensureTempDir();
    
    // Clean up expired files every hour
    this.startCleanupInterval();
  }

  /**
   * Ensure temp directory exists
   */
  ensureTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Generate unique file ID
   * @returns {string} - Unique file identifier
   */
  generateFileId() {
    return crypto.randomUUID();
  }

  /**
   * Save file data and return file ID
   * @param {Buffer} buffer - File data buffer
   * @param {string} format - File format (stl, gltf, etc.)
   * @param {string} fileName - Original file name
   * @returns {string} - File ID for retrieval
   */
  saveFile(buffer, format, fileName) {
    const fileId = this.generateFileId();
    const timestamp = Date.now();
    const filePath = path.join(this.tempDir, `${fileId}.${format}`);
    
    console.log('Saving file:', {
      fileId,
      format,
      fileName,
      bufferLength: buffer.length,
      bufferType: typeof buffer
    });
    
    // Save file to disk
    fs.writeFileSync(filePath, buffer);
    
    // Store file metadata in memory
    this.files.set(fileId, {
      fileId,
      filePath,
      format,
      fileName: `${fileName}.${format}`,
      mimeType: this.getMimeType(format),
      buffer,
      createdAt: timestamp,
      expiresAt: timestamp + this.maxFileAge
    });

    console.log('File saved successfully:', fileId);
    return fileId;
  }

  /**
   * Get file data by ID
   * @param {string} fileId - File identifier
   * @returns {Object|null} - File data or null if not found/expired
   */
  getFile(fileId) {
    const fileData = this.files.get(fileId);
    
    if (!fileData) {
      return null;
    }

    // Check if file has expired
    if (Date.now() > fileData.expiresAt) {
      this.deleteFile(fileId);
      return null;
    }

    // Check if file still exists on disk
    if (!fs.existsSync(fileData.filePath)) {
      this.files.delete(fileId);
      return null;
    }

    return {
      buffer: fileData.buffer,
      format: fileData.format,
      fileName: fileData.fileName,
      mimeType: fileData.mimeType,
      createdAt: fileData.createdAt,
      expiresAt: fileData.expiresAt
    };
  }

  /**
   * Delete file by ID
   * @param {string} fileId - File identifier
   */
  deleteFile(fileId) {
    const fileData = this.files.get(fileId);
    
    if (fileData) {
      // Remove from disk
      try {
        if (fs.existsSync(fileData.filePath)) {
          fs.unlinkSync(fileData.filePath);
        }
      } catch (error) {
        console.warn(`Failed to delete file ${fileId}:`, error.message);
      }
      
      // Remove from memory
      this.files.delete(fileId);
    }
  }

  /**
   * Get MIME type for format
   * @param {string} format - File format
   * @returns {string} - MIME type
   */
  getMimeType(format) {
    const mimeTypes = {
      stl: 'application/octet-stream',
      gltf: 'application/octet-stream',
      '3mf': 'application/octet-stream',
      obj: 'text/plain'
    };
    
    return mimeTypes[format] || 'application/octet-stream';
  }

  /**
   * Clean up expired files
   */
  cleanupExpiredFiles() {
    const now = Date.now();
    const expiredFiles = [];
    
    for (const [fileId, fileData] of this.files.entries()) {
      if (now > fileData.expiresAt) {
        expiredFiles.push(fileId);
      }
    }
    
    expiredFiles.forEach(fileId => {
      this.deleteFile(fileId);
    });
    
    if (expiredFiles.length > 0) {
      console.log(`Cleaned up ${expiredFiles.length} expired files`);
    }
  }

  /**
   * Start cleanup interval
   */
  startCleanupInterval() {
    // Run cleanup every hour
    setInterval(() => {
      this.cleanupExpiredFiles();
    }, 60 * 60 * 1000);
  }

  /**
   * Get file statistics
   * @returns {Object} - File statistics
   */
  getStats() {
    const now = Date.now();
    let totalSize = 0;
    let expiredCount = 0;
    
    for (const fileData of this.files.values()) {
      totalSize += fileData.buffer.length;
      if (now > fileData.expiresAt) {
        expiredCount++;
      }
    }
    
    return {
      totalFiles: this.files.size,
      expiredFiles: expiredCount,
      totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2)
    };
  }

  /**
   * Clear all files (for testing/cleanup)
   */
  clearAll() {
    for (const fileId of this.files.keys()) {
      this.deleteFile(fileId);
    }
  }
}

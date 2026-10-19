import { $http } from '../http';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Shared file utilities for AI platform services
 * 
 * This module provides common file handling functionality that can be used
 * across different AI platform implementations (Doubao, DeepSeek, etc.)
 * 
 * @example
 * ```typescript
 * // Download a file from URL or local path
 * const { buffer, fileName, fileExtension, fileSize } = await downloadFile(
 *   'https://example.com/document.pdf',
 *   'my-document', // optional custom name
 *   'pdf'          // optional custom extension
 * );
 * 
 * // Use in your platform service
 * private async uploadAttachment(attachment: SendAttachment) {
 *   const { buffer, fileName, fileExtension, fileSize } = await downloadFile(
 *     attachment.filePath,
 *     attachment.name,
 *     attachment.type
 *   );
 *   // ... proceed with platform-specific upload logic
 * }
 * ```
 */

/**
 * File information returned after downloading
 */
export interface FileDownloadResult {
  buffer: Buffer;
  fileName: string;
  fileExtension: string;
  fileSize: number;
}

/**
 * Downloads a file from either a local path or a URL
 * @param filePath - Local file path or HTTP(S) URL
 * @param providedName - Optional name to use instead of extracting from path
 * @param providedType - Optional file extension to use instead of extracting from path
 * @returns FileDownloadResult containing buffer and metadata
 */
export async function downloadFile(
  filePath: string,
  providedName?: string,
  providedType?: string,
): Promise<FileDownloadResult> {
  let fileBuffer: Buffer;
  let fileName: string;
  let fileExtension: string;

  // Check if filePath is a URL
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    // Download from URL
    const response = await $http.get(filePath, { responseType: 'arraybuffer' });
    fileBuffer = Buffer.from(response.data);

    // Extract filename from URL or use provided name
    if (providedName) {
      fileName = providedName;
    } else {
      // Try to extract filename from URL
      const urlPath = new URL(filePath).pathname;
      fileName = path.basename(urlPath) || 'downloaded-file';
    }
  } else {
    // Read from local file system
    fileBuffer = await fs.readFile(filePath);
    fileName = providedName || path.basename(filePath);
  }

  // Determine file extension
  if (providedType) {
    fileExtension = providedType;
  } else {
    fileExtension = path.extname(fileName).replace('.', '');
    // If no extension found, try to infer from filename
    if (!fileExtension && fileName.includes('.')) {
      fileExtension = fileName.split('.').pop() || '';
    }
  }

  const fileSize = fileBuffer.length;

  return {
    buffer: fileBuffer,
    fileName,
    fileExtension,
    fileSize,
  };
}

/**
 * Validates if a file path is a URL
 * @param filePath - Path to check
 * @returns true if the path is a URL
 */
export function isUrl(filePath: string): boolean {
  return filePath.startsWith('http://') || filePath.startsWith('https://');
}

/**
 * Extracts file extension from a filename or path
 * @param fileName - File name or path
 * @returns File extension without the dot
 */
export function getFileExtension(fileName: string): string {
  const ext = path.extname(fileName).replace('.', '');
  if (!ext && fileName.includes('.')) {
    return fileName.split('.').pop() || '';
  }
  return ext;
}

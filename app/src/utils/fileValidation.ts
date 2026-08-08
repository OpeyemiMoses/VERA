export interface FileValidationResult {
  isSupported: boolean;
  fileKind: 'IMAGE' | 'CODE' | 'PDF' | 'ARCHIVE' | 'UNSUPPORTED';
  extension: string;
  errorMessage?: string;
}

export const ALLOWED_EXTENSIONS = [
  // Images
  'png', 'jpg', 'jpeg', 'svg', 'webp', 'gif',
  // Code & Text
  'ts', 'tsx', 'js', 'jsx', 'sol', 'json', 'md', 'txt', 'py', 'html', 'css', 'yaml', 'yml',
  // Documents
  'pdf',
  // Archives & Design Packs
  'zip', 'tar', 'gz', 'fig',
];

export const BLOCKED_EXTENSIONS = [
  'exe', 'bat', 'cmd', 'sh', 'vbs', 'dll', 'dmg', 'iso', 'msi', 'scr', 'com', 'sys', 'bin', 'jar'
];

export function validateDeliverableFile(file: File | { name: string; type?: string }): FileValidationResult {
  const fileName = file.name.toLowerCase();
  const parts = fileName.split('.');
  const ext = parts.length > 1 ? parts[parts.length - 1] : '';

  if (BLOCKED_EXTENSIONS.includes(ext)) {
    return {
      isSupported: false,
      fileKind: 'UNSUPPORTED',
      extension: ext,
      errorMessage: `Blocked File Type (.${ext.toUpperCase()}) — Executables and binaries are restricted for security reasons.`,
    };
  }

  if (ALLOWED_EXTENSIONS.includes(ext) || file.type?.startsWith('image/') || file.type === 'application/pdf') {
    let kind: FileValidationResult['fileKind'] = 'ARCHIVE';
    if (['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif'].includes(ext) || file.type?.startsWith('image/')) {
      kind = 'IMAGE';
    } else if (['ts', 'tsx', 'js', 'jsx', 'sol', 'json', 'md', 'txt', 'py', 'html', 'css', 'yaml', 'yml'].includes(ext)) {
      kind = 'CODE';
    } else if (ext === 'pdf' || file.type === 'application/pdf') {
      kind = 'PDF';
    } else if (['zip', 'tar', 'gz', 'fig'].includes(ext)) {
      kind = 'ARCHIVE';
    }

    return {
      isSupported: true,
      fileKind: kind,
      extension: ext,
    };
  }

  // If extension is unlisted but not explicitly blocked, flag warning if it looks like a binary script
  return {
    isSupported: false,
    fileKind: 'UNSUPPORTED',
    extension: ext || 'unknown',
    errorMessage: `Unsupported File Type (.${ext.toUpperCase() || 'RAW'}) — Please upload a supported image, code file, PDF, or zip archive.`,
  };
}

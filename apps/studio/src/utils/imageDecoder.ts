export interface ImageMeta {
  url: string;
  blob?: Blob;
  width: number;
  height: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

/**
 * 格式化字节尺寸为可读字符串 (B / KB / MB)
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * 将 File / Blob 转换为 Base64 Data URL
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read image blob as Data URL'));
    reader.readAsDataURL(blob);
  });
}

/**
 * 使用浏览器现代原生 Image.decode() 异步高效提取本地 File 天然物理分辨率
 */
export async function parseImageFile(file: File): Promise<ImageMeta> {
  if (!file.type.startsWith('image/')) {
    throw new Error(`Unsupported file type: ${file.type}. Please upload a valid image (PNG/JPEG/WEBP/SVG).`);
  }

  const blobUrl = URL.createObjectURL(file);
  const img = new Image();
  img.src = blobUrl;

  try {
    // 现代浏览器原生异步解码，不阻塞主 UI 线程
    await img.decode();
    return {
      url: blobUrl,
      blob: file,
      width: img.naturalWidth || 1920,
      height: img.naturalHeight || 1080,
      fileName: file.name.replace(/\.[^/.]+$/, ''), // 去除后缀的文件名
      fileSize: file.size,
      mimeType: file.type,
    };
  } catch {
    // 降级回退处理 (某些 SVG 格式可能在 decode() 报错)
    return new Promise((resolve, reject) => {
      img.onload = () => {
        resolve({
          url: blobUrl,
          blob: file,
          width: img.naturalWidth || 1920,
          height: img.naturalHeight || 1080,
          fileName: file.name.replace(/\.[^/.]+$/, ''),
          fileSize: file.size,
          mimeType: file.type,
        });
      };
      img.onerror = () => {
        URL.revokeObjectURL(blobUrl);
        reject(new Error('Failed to decode uploaded image.'));
      };
    });
  }
}

/**
 * 嗅探并提取远程公开图片 URL 的物理分辨率与元数据
 */
export async function parseImageUrl(url: string, defaultName = 'remote-architecture-image'): Promise<ImageMeta> {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = url;

  try {
    await img.decode();
    return {
      url,
      width: img.naturalWidth || 1920,
      height: img.naturalHeight || 1080,
      fileName: defaultName,
      fileSize: 0,
      mimeType: 'image/jpeg',
    };
  } catch {
    return new Promise((resolve, reject) => {
      img.onload = () => {
        resolve({
          url,
          width: img.naturalWidth || 1920,
          height: img.naturalHeight || 1080,
          fileName: defaultName,
          fileSize: 0,
          mimeType: 'image/jpeg',
        });
      };
      img.onerror = () => {
        reject(new Error('Failed to load or parse remote image URL.'));
      };
    });
  }
}

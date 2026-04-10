import { Injectable } from '@angular/core';


export interface OptimizedImageResult {
  base64: string;
  width: number;
  height: number;
  sizeInBytes: number;
  contentType: string;
  fileName: string;
}

@Injectable({
  providedIn: 'root',
})
export class ImageOptimizer {

    async optimizeFile(
    file: File,
    options?: {
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
      outputType?: 'image/jpeg' | 'image/webp';
    }
  ): Promise<OptimizedImageResult> {
    const {
      maxWidth = 800,
      maxHeight = 800,
      quality = 0.72,
      outputType = 'image/jpeg'
    } = options || {};

    const dataUrl = await this.fileToDataUrl(file);
    return this.optimizeDataUrl(dataUrl, {
      maxWidth,
      maxHeight,
      quality,
      outputType,
      fileName: file.name
    });
  }

  async optimizeDataUrl(
    dataUrl: string,
    options?: {
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
      outputType?: 'image/jpeg' | 'image/webp';
      fileName?: string;
    }
  ): Promise<OptimizedImageResult> {
    const {
      maxWidth = 800,
      maxHeight = 800,
      quality = 0.72,
      outputType = 'image/jpeg',
      fileName = `img_${Date.now()}.jpg`
    } = options || {};

    const image = await this.loadImage(dataUrl);

    const { width, height } = this.getResizedDimensions(
      image.width,
      image.height,
      maxWidth,
      maxHeight
    );

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Impossible de créer le contexte canvas');
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(image, 0, 0, width, height);

    const optimizedBase64 = canvas.toDataURL(outputType, quality);
    const sizeInBytes = this.base64Size(optimizedBase64);

    return {
      base64: optimizedBase64,
      width,
      height,
      sizeInBytes,
      contentType: outputType,
      fileName
    };
  }

  private fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  private getResizedDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    let width = originalWidth;
    let height = originalHeight;

    if (width <= maxWidth && height <= maxHeight) {
      return { width, height };
    }

    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);

    return { width, height };
  }

  private base64Size(base64: string): number {
    const stripped = base64.split(',')[1] || '';
    return Math.round((stripped.length * 3) / 4);
  }


}

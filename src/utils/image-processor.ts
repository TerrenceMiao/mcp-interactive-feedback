/**
 * MCP Feedback Collector - Image Processing Tool
 */

import sharp from 'sharp';
import { promises as fs } from 'fs';
import { MCPError, ImageData } from '../types/index.js';
import { logger } from './logger.js';

/**
 * Supported image formats
 */
const SUPPORTED_FORMATS = ['jpeg', 'jpg', 'png', 'gif', 'webp', 'bmp', 'tiff'];

/**
 * Image Processor Class
 */
export class ImageProcessor {
  private maxFileSize: number;
  private maxWidth: number;
  private maxHeight: number;

  constructor(options: {
    maxFileSize?: number;
    maxWidth?: number;
    maxHeight?: number;
  } = {}) {
    this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB
    this.maxWidth = options.maxWidth || 2048;
    this.maxHeight = options.maxHeight || 2048;
  }

  /**
   * Validate image format
   */
  validateImageFormat(filename: string, mimeType: string): boolean {
    // Check file extension
    const ext = filename.toLowerCase().split('.').pop();
    if (!ext || !SUPPORTED_FORMATS.includes(ext)) {
      return false;
    }

    // Check MIME type
    const validMimeTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
      'image/tiff'
    ];

    return validMimeTypes.includes(mimeType.toLowerCase());
  }

  /**
   * Validate image size
   */
  validateImageSize(size: number): boolean {
    return size > 0 && size <= this.maxFileSize;
  }

  /**
   * Extract image information from Base64 data
   */
  async getImageInfoFromBase64(base64Data: string): Promise<{
    format: string;
    width: number;
    height: number;
    size: number;
    hasAlpha: boolean;
  }> {
    try {
      // Remove Base64 prefix
      const base64Content = base64Data.replace(/^data:image\/[^;]+;base64,/, '');
      const buffer = Buffer.from(base64Content, 'base64');

      const metadata = await sharp(buffer).metadata();

      return {
        format: metadata.format || 'unknown',
        width: metadata.width || 0,
        height: metadata.height || 0,
        size: buffer.length,
        hasAlpha: metadata.hasAlpha || false
      };
    } catch (error) {
      logger.error('Failed to get image information:', error);
      throw new MCPError(
        'Failed to get image information',
        'IMAGE_INFO_ERROR',
        error
      );
    }
  }

  /**
   * Compress image
   */
  async compressImage(base64Data: string, options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp';
  } = {}): Promise<string> {
    try {
      const base64Content = base64Data.replace(/^data:image\/[^;]+;base64,/, '');
      const buffer = Buffer.from(base64Content, 'base64');

      const {
        maxWidth = this.maxWidth,
        maxHeight = this.maxHeight,
        quality = 85,
        format = 'jpeg'
      } = options;

      let processor = sharp(buffer);

      // Resize dimensions
      const metadata = await processor.metadata();
      if (metadata.width && metadata.height) {
        if (metadata.width > maxWidth || metadata.height > maxHeight) {
          processor = processor.resize(maxWidth, maxHeight, {
            fit: 'inside',
            withoutEnlargement: true
          });
        }
      }

      // Convert format and compress
      let outputBuffer: Buffer;
      switch (format) {
        case 'jpeg':
          outputBuffer = await processor.jpeg({ quality }).toBuffer();
          break;
        case 'png':
          outputBuffer = await processor.png({ compressionLevel: 9 }).toBuffer();
          break;
        case 'webp':
          outputBuffer = await processor.webp({ quality }).toBuffer();
          break;
        default:
          outputBuffer = await processor.jpeg({ quality }).toBuffer();
      }

      // Convert back to Base64
      const compressedBase64 = `data:image/${format};base64,${outputBuffer.toString('base64')}`;
      
      logger.debug(`Image compression completed: ${buffer.length} -> ${outputBuffer.length} bytes`);
      
      return compressedBase64;
    } catch (error) {
      logger.error('Image compression failed:', error);
      throw new MCPError(
        'Failed to compress image',
        'IMAGE_COMPRESSION_ERROR',
        error
      );
    }
  }

  /**
   * Validate and process image data
   */
  async validateAndProcessImage(imageData: ImageData): Promise<ImageData> {
    try {
      // Validate basic information
      if (!imageData.name || !imageData.data || !imageData.type) {
        throw new MCPError(
          'Invalid image data: missing required fields',
          'INVALID_IMAGE_DATA'
        );
      }

      // Validate format
      if (!this.validateImageFormat(imageData.name, imageData.type)) {
        throw new MCPError(
          `Unsupported image format: ${imageData.type}`,
          'UNSUPPORTED_FORMAT'
        );
      }

      // Validate size
      if (!this.validateImageSize(imageData.size)) {
        throw new MCPError(
          `Image size ${imageData.size} exceeds limit ${this.maxFileSize}`,
          'IMAGE_TOO_LARGE'
        );
      }

      // Get detailed image information
      const info = await this.getImageInfoFromBase64(imageData.data);
      
      // Check image dimensions
      if (info.width > this.maxWidth || info.height > this.maxHeight) {
        logger.info(`Image dimensions too large (${info.width}x${info.height}), compressing...`);
        
        const compressedData = await this.compressImage(imageData.data, {
          maxWidth: this.maxWidth,
          maxHeight: this.maxHeight,
          quality: 85
        });

        const compressedInfo = await this.getImageInfoFromBase64(compressedData);
        
        return {
          ...imageData,
          data: compressedData,
          size: compressedInfo.size,
          type: `image/${compressedInfo.format}`
        };
      }

      return imageData;
    } catch (error) {
      if (error instanceof MCPError) {
        throw error;
      }
      
      logger.error('Image validation and processing failed:', error);
      throw new MCPError(
        'Failed to validate and process image',
        'IMAGE_PROCESSING_ERROR',
        error
      );
    }
  }

  /**
   * Batch process images
   */
  async processImages(images: ImageData[]): Promise<ImageData[]> {
    const results: ImageData[] = [];
    
    for (let i = 0; i < images.length; i++) {
      try {
        logger.debug(`Processing image ${i + 1}/${images.length}: ${images[i]?.name}`);
        const processedImage = await this.validateAndProcessImage(images[i]!);
        results.push(processedImage);
      } catch (error) {
        logger.error(`Failed to process image ${images[i]?.name}:`, error);
        // Continue processing other images, but record the error
        throw error;
      }
    }
    
    logger.info(`Successfully processed ${results.length}/${images.length} images`);
    return results;
  }

  /**
   * Generate image thumbnail
   */
  async generateThumbnail(base64Data: string, size: number = 150): Promise<string> {
    try {
      const base64Content = base64Data.replace(/^data:image\/[^;]+;base64,/, '');
      const buffer = Buffer.from(base64Content, 'base64');

      const thumbnailBuffer = await sharp(buffer)
        .resize(size, size, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 80 })
        .toBuffer();

      return `data:image/jpeg;base64,${thumbnailBuffer.toString('base64')}`;
    } catch (error) {
      logger.error('Failed to generate thumbnail:', error);
      throw new MCPError(
        'Failed to generate thumbnail',
        'THUMBNAIL_ERROR',
        error
      );
    }
  }

  /**
   * Get image statistics
   */
  getImageStats(images: ImageData[]): {
    totalCount: number;
    totalSize: number;
    averageSize: number;
    formats: Record<string, number>;
  } {
    const stats = {
      totalCount: images.length,
      totalSize: 0,
      averageSize: 0,
      formats: {} as Record<string, number>
    };

    for (const image of images) {
      stats.totalSize += image.size;
      
      const format = image.type.split('/')[1] || 'unknown';
      stats.formats[format] = (stats.formats[format] || 0) + 1;
    }

    stats.averageSize = stats.totalCount > 0 ? stats.totalSize / stats.totalCount : 0;

    return stats;
  }
}

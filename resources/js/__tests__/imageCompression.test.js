import { validateImageFile, formatFileSize, processImageForUpload } from '../utils/imageCompression';

describe('Image Compression Utilities', () => {
    describe('validateImageFile', () => {
        it('should accept valid JPEG files under 10MB', () => {
            const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
            Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 });
            
            const result = validateImageFile(file);
            expect(result.valid).toBe(true);
        });

        it('should accept valid PNG files under 10MB', () => {
            const file = new File([''], 'test.png', { type: 'image/png' });
            Object.defineProperty(file, 'size', { value: 3 * 1024 * 1024 });
            
            const result = validateImageFile(file);
            expect(result.valid).toBe(true);
        });

        it('should accept valid WebP files under 10MB', () => {
            const file = new File([''], 'test.webp', { type: 'image/webp' });
            Object.defineProperty(file, 'size', { value: 2 * 1024 * 1024 });
            
            const result = validateImageFile(file);
            expect(result.valid).toBe(true);
        });

        it('should accept valid GIF files under 10MB', () => {
            const file = new File([''], 'test.gif', { type: 'image/gif' });
            Object.defineProperty(file, 'size', { value: 1 * 1024 * 1024 });
            
            const result = validateImageFile(file);
            expect(result.valid).toBe(true);
        });

        it('should reject files exceeding 10MB', () => {
            const file = new File([''], 'large.jpg', { type: 'image/jpeg' });
            Object.defineProperty(file, 'size', { value: 15 * 1024 * 1024 });
            
            const result = validateImageFile(file);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('exceeds the maximum');
        });

        it('should reject non-image files', () => {
            const file = new File([''], 'document.pdf', { type: 'application/pdf' });
            Object.defineProperty(file, 'size', { value: 1 * 1024 * 1024 });
            
            const result = validateImageFile(file);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('Invalid file type');
        });

        it('should reject SVG files', () => {
            const file = new File([''], 'image.svg', { type: 'image/svg+xml' });
            Object.defineProperty(file, 'size', { value: 100 * 1024 });
            
            const result = validateImageFile(file);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('Invalid file type');
        });
    });

    describe('formatFileSize', () => {
        it('should format bytes correctly', () => {
            expect(formatFileSize(500)).toBe('500 B');
        });

        it('should format kilobytes correctly', () => {
            expect(formatFileSize(1536)).toBe('1.5 KB');
        });

        it('should format megabytes correctly', () => {
            expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.50 MB');
        });
    });

    describe('processImageForUpload', () => {
        it('should reject files exceeding 10MB before processing', async () => {
            const file = new File([''], 'large.jpg', { type: 'image/jpeg' });
            Object.defineProperty(file, 'size', { value: 15 * 1024 * 1024 });
            
            await expect(processImageForUpload(file)).rejects.toThrow('exceeds the maximum');
        });

        it('should reject non-image files before processing', async () => {
            const file = new File([''], 'doc.pdf', { type: 'application/pdf' });
            Object.defineProperty(file, 'size', { value: 1 * 1024 * 1024 });
            
            await expect(processImageForUpload(file)).rejects.toThrow('Invalid file type');
        });
    });
});

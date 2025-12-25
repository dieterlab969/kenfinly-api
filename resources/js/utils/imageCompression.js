const MAX_ORIGINAL_SIZE_MB = 10;
const TARGET_SIZE_KB = 500;
const MAX_SIZE_KB = 800;
const MAX_DIMENSION = 2048;
const QUALITY_STEPS = [0.9, 0.8, 0.7, 0.6, 0.5, 0.4];

export const validateImageFile = (file) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (!allowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'
        };
    }
    
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > MAX_ORIGINAL_SIZE_MB) {
        return {
            valid: false,
            error: `File size (${sizeMB.toFixed(2)} MB) exceeds the maximum allowed size of ${MAX_ORIGINAL_SIZE_MB} MB.`
        };
    }
    
    return { valid: true };
};

const loadImage = (file) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(file);
    });
};

const calculateScaledDimensions = (width, height, maxDimension) => {
    if (width <= maxDimension && height <= maxDimension) {
        return { width, height };
    }
    
    const ratio = Math.min(maxDimension / width, maxDimension / height);
    return {
        width: Math.round(width * ratio),
        height: Math.round(height * ratio)
    };
};

const compressImage = async (file, quality = 0.8, forceJpeg = false) => {
    const img = await loadImage(file);
    const { width, height } = calculateScaledDimensions(img.width, img.height, MAX_DIMENSION);
    
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    
    URL.revokeObjectURL(img.src);
    
    const outputType = forceJpeg ? 'image/jpeg' : 'image/jpeg';
    
    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            resolve(blob);
        }, outputType, quality);
    });
};

export const processImageForUpload = async (file, onProgress = null) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
        throw new Error(validation.error);
    }
    
    const originalSizeKB = file.size / 1024;
    
    if (onProgress) onProgress({ stage: 'validating', progress: 10 });
    
    if (originalSizeKB <= TARGET_SIZE_KB) {
        if (onProgress) onProgress({ stage: 'complete', progress: 100 });
        return {
            file: file,
            originalSize: file.size,
            compressedSize: file.size,
            wasCompressed: false
        };
    }
    
    if (onProgress) onProgress({ stage: 'compressing', progress: 30 });
    
    let compressedBlob = null;
    let finalQuality = 1;
    
    for (const quality of QUALITY_STEPS) {
        compressedBlob = await compressImage(file, quality, true);
        finalQuality = quality;
        
        const compressedSizeKB = compressedBlob.size / 1024;
        
        if (onProgress) {
            const progressPercent = 30 + (QUALITY_STEPS.indexOf(quality) / QUALITY_STEPS.length) * 60;
            onProgress({ stage: 'compressing', progress: progressPercent, quality });
        }
        
        if (compressedSizeKB <= TARGET_SIZE_KB) {
            break;
        }
        
        if (compressedSizeKB <= MAX_SIZE_KB && quality <= 0.6) {
            break;
        }
    }
    
    if (!compressedBlob || compressedBlob.size / 1024 > MAX_SIZE_KB) {
        compressedBlob = await compressImage(file, 0.3, true);
        
        if (compressedBlob.size / 1024 > MAX_SIZE_KB) {
            throw new Error(
                `Unable to compress image below ${MAX_SIZE_KB} KB. ` +
                `Please try a smaller image or reduce the dimensions manually.`
            );
        }
    }
    
    const originalName = file.name.replace(/\.[^/.]+$/, '');
    const compressedFile = new File(
        [compressedBlob],
        `${originalName}_compressed.jpg`,
        { type: 'image/jpeg' }
    );
    
    if (onProgress) onProgress({ stage: 'complete', progress: 100 });
    
    return {
        file: compressedFile,
        originalSize: file.size,
        compressedSize: compressedFile.size,
        wasCompressed: true,
        compressionRatio: ((1 - compressedFile.size / file.size) * 100).toFixed(1)
    };
};

export const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export default {
    validateImageFile,
    processImageForUpload,
    formatFileSize,
    MAX_ORIGINAL_SIZE_MB,
    TARGET_SIZE_KB,
    MAX_SIZE_KB
};

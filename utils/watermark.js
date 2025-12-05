// Advanced Watermark Removal using OpenCV.js
class WatermarkRemover {
    constructor() {
        this.cv = cv;
        this.initialized = false;
        this.initOpenCV();
    }

    async initOpenCV() {
        if (typeof cv !== 'undefined') {
            this.cv = cv;
            this.initialized = true;
            console.log('OpenCV initialized');
        } else {
            console.warn('OpenCV not loaded yet');
            setTimeout(() => this.initOpenCV(), 100);
        }
    }

    // AI Auto-detection of watermarks
    async detectWatermark(canvas) {
        if (!this.initialized) {
            throw new Error('OpenCV not initialized');
        }

        const src = cv.imread(canvas);
        const dst = new cv.Mat();
        const mask = new cv.Mat();
        
        try {
            // Convert to grayscale
            cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY, 0);
            
            // Apply edge detection
            cv.Canny(dst, mask, 50, 200);
            
            // Find contours
            const contours = new cv.MatVector();
            const hierarchy = new cv.Mat();
            cv.findContours(mask, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
            
            // Find largest rectangle (likely watermark)
            let maxArea = 0;
            let watermarkRect = null;
            
            for (let i = 0; i < contours.size(); i++) {
                const contour = contours.get(i);
                const rect = cv.boundingRect(contour);
                const area = rect.width * rect.height;
                
                // Filter small areas and edges
                if (area > maxArea && area < (canvas.width * canvas.height * 0.3)) {
                    maxArea = area;
                    watermarkRect = rect;
                }
            }
            
            // Cleanup
            src.delete();
            dst.delete();
            mask.delete();
            contours.delete();
            hierarchy.delete();
            
            return watermarkRect;
            
        } catch (error) {
            console.error('Detection error:', error);
            
            // Cleanup on error
            src.delete();
            dst.delete();
            mask.delete();
            throw error;
        }
    }

    // Advanced inpainting with AI
    async removeWatermark(canvas, rect, method = 'TELEA') {
        if (!this.initialized) {
            throw new Error('OpenCV not initialized');
        }

        const src = cv.imread(canvas);
        const mask = new cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC1);
        const dst = new cv.Mat();
        
        try {
            // Create mask from rectangle
            const point1 = new cv.Point(rect.x, rect.y);
            const point2 = new cv.Point(rect.x + rect.width, rect.y + rect.height);
            const color = new cv.Scalar(255);
            
            cv.rectangle(mask, point1, point2, color, cv.FILLED);
            
            // Apply Gaussian blur to mask edges for smoother results
            const blurredMask = new cv.Mat();
            cv.GaussianBlur(mask, blurredMask, new cv.Size(5, 5), 0);
            
            // Choose inpainting method
            const inpaintMethod = method === 'NS' ? cv.INPAINT_NS : cv.INPAINT_TELEA;
            
            // Perform inpainting
            cv.inpaint(src, blurredMask, dst, 3, inpaintMethod);
            
            // Convert result back to ImageData
            const resultCanvas = document.createElement('canvas');
            resultCanvas.width = src.cols;
            resultCanvas.height = src.rows;
            
            cv.imshow(resultCanvas, dst);
            const imageData = resultCanvas.getContext('2d').getImageData(0, 0, src.cols, src.rows);
            
            // Cleanup
            src.delete();
            mask.delete();
            dst.delete();
            blurredMask.delete();
            resultCanvas.remove();
            
            return {
                imageData: imageData,
                width: src.cols,
                height: src.rows
            };
            
        } catch (error) {
            console.error('Removal error:', error);
            
            // Cleanup on error
            src.delete();
            mask.delete();
            dst.delete();
            throw error;
        }
    }

    // Batch processing for multiple watermarks
    async removeMultipleWatermarks(canvas, rects) {
        if (!this.initialized) {
            throw new Error('OpenCV not initialized');
        }

        let result = cv.imread(canvas);
        
        try {
            for (const rect of rects) {
                const mask = new cv.Mat.zeros(result.rows, result.cols, cv.CV_8UC1);
                const temp = new cv.Mat();
                
                // Create mask for current rectangle
                const point1 = new cv.Point(rect.x, rect.y);
                const point2 = new cv.Point(rect.x + rect.width, rect.y + rect.height);
                const color = new cv.Scalar(255);
                
                cv.rectangle(mask, point1, point2, color, cv.FILLED);
                
                // Inpaint this area
                cv.inpaint(result, mask, temp, 3, cv.INPAINT_TELEA);
                
                // Update result
                result.delete();
                result = temp.clone();
                temp.delete();
                mask.delete();
            }
            
            // Convert to ImageData
            const resultCanvas = document.createElement('canvas');
            resultCanvas.width = result.cols;
            resultCanvas.height = result.rows;
            
            cv.imshow(resultCanvas, result);
            const imageData = resultCanvas.getContext('2d').getImageData(0, 0, result.cols, result.rows);
            
            result.delete();
            resultCanvas.remove();
            
            return {
                imageData: imageData,
                width: result.cols,
                height: result.rows
            };
            
        } catch (error) {
            console.error('Batch removal error:', error);
            result.delete();
            throw error;
        }
    }

    // Video frame processing
    async processVideoFrame(videoFrameCanvas, rect) {
        return await this.removeWatermark(videoFrameCanvas, rect);
    }

    // Manual selection enhancement
    enhanceManualSelection(canvas, rect) {
        // Expand rectangle slightly for better coverage
        const padding = 5;
        return {
            x: Math.max(0, rect.x - padding),
            y: Math.max(0, rect.y - padding),
            width: Math.min(canvas.width - rect.x, rect.width + (padding * 2)),
            height: Math.min(canvas.height - rect.y, rect.height + (padding * 2))
        };
    }
}

// Global instance
const watermarkAI = new WatermarkRemover();

// Main processing function
async function removeWatermarkAI(canvas, mode = 'auto', precision = 0.85) {
    try {
        let watermarkRect;
        
        switch (mode) {
            case 'auto':
                watermarkRect = await watermarkAI.detectWatermark(canvas);
                if (!watermarkRect) {
                    throw new Error('No watermark detected automatically. Try manual mode.');
                }
                break;
                
            case 'manual':
                // For manual mode, we need selection coordinates
                // This would come from user interaction
                const manualRect = getManualSelection(); // Implement this based on UI
                watermarkRect = watermarkAI.enhanceManualSelection(canvas, manualRect);
                break;
                
            case 'batch':
                // Multiple watermarks
                const detections = await detectMultipleWatermarks(canvas);
                return await watermarkAI.removeMultipleWatermarks(canvas, detections);
                
            default:
                throw new Error(`Unknown mode: ${mode}`);
        }
        
        // Apply precision threshold
        if (precision < 0.9) {
            watermarkRect.width = Math.floor(watermarkRect.width * precision);
            watermarkRect.height = Math.floor(watermarkRect.height * precision);
        }
        
        return await watermarkAI.removeWatermark(canvas, watermarkRect);
        
    } catch (error) {
        console.error('AI Processing error:', error);
        throw error;
    }
}

// Helper function for manual selection
function getManualSelection() {
    // This should get coordinates from UI
    // For now, return default
    return {
        x: 100,
        y: 100,
        width: 200,
        height: 50
    };
}

// Multiple watermark detection
async function detectMultipleWatermarks(canvas) {
    // Implement based on your needs
    return [];
}

// Export for use
window.removeWatermarkAI = removeWatermarkAI;
window.watermarkAI = watermarkAI;

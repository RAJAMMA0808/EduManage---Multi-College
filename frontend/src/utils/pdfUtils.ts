
/**
 * Utility to handle PDF viewing and downloading from Data URLs or Blobs.
 */

/**
 * Converts a Data URL to a Blob object.
 */
export const dataUrlToBlob = (dataUrl: string): Blob | null => {
    if (!dataUrl || !dataUrl.startsWith('data:')) return null;
    
    try {
        const parts = dataUrl.split(',');
        if (parts.length < 2) return null;
        
        const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/pdf';
        const b64 = atob(parts[1]);
        let n = b64.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = b64.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    } catch (e) {
        console.error("Failed to convert Data URL to Blob:", e);
        return null;
    }
};

/**
 * Opens a PDF in a new tab.
 */
export const viewPdf = (dataUrl: string) => {
    if (!dataUrl) return;
    
    try {
        let url = dataUrl;
        let isBlob = false;

        if (dataUrl.startsWith('data:')) {
            const blob = dataUrlToBlob(dataUrl);
            if (blob) {
                url = URL.createObjectURL(blob);
                isBlob = true;
            }
        }

        const newWindow = window.open(url, '_blank');
        if (!newWindow) {
            alert('Please allow popups to view the PDF.');
        }

        // We don't revoke immediately for viewing as the new tab needs it to load
        // Browsers usually clean up blob URLs when the tab is closed or after some time
    } catch (e) {
        console.error("Failed to view PDF:", e);
        window.open(dataUrl, '_blank');
    }
};

/**
 * Downloads a PDF file.
 */
export const downloadPdf = (dataUrl: string, fileName: string) => {
    if (!dataUrl) return;
    
    try {
        let url = dataUrl;
        let isBlob = false;

        if (dataUrl.startsWith('data:')) {
            const blob = dataUrlToBlob(dataUrl);
            if (blob) {
                url = URL.createObjectURL(blob);
                isBlob = true;
            }
        }

        const link = document.createElement('a');
        link.href = url;
        link.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        if (isBlob && url.startsWith('blob:')) {
            // Revoke after a delay to ensure download started
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
    } catch (e) {
        console.error("Failed to download PDF:", e);
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

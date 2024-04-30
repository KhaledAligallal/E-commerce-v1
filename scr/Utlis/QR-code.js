import QRCode from 'qrcode'; // Import the QRCode library

// Async function to generate a QR code from data
export async function qrCodeGeneration(data) {
    // Generate QR code image data URL with the provided data
    // Set error correction level to 'H' (highest level)
    const qrCode = await QRCode.toDataURL(data, { errorCorrectionLevel: 'H' });
    return qrCode; // Return the generated QR code image data URL
}

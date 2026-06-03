import QRCode from 'qrcode'; // Đảm bảo đã chạy lệnh: npm install qrcode

export const generateQR = async (text) => {
  try {
    const dataUrl = await QRCode.toDataURL(text); 
    return dataUrl; 
  } catch (err) {
    console.error("Lỗi chi tiết khi sinh mã QR từ thư viện:", err);
    return ""; // Trả về chuỗi rỗng để tránh làm sập API nếu lỗi
  }
};
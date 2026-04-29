import { io } from "socket.io-client";

console.log("=== BẮT ĐẦU TEST BƯỚC 1: WEBSOCKET SCANNER ===");

const roomId = "pos_test_room_123";

// 1. Tạo Socket đại diện cho Máy tính POS (PC)
const pcSocket = io("http://localhost:3000/scanner");

pcSocket.on("connect", () => {
    console.log("💻 [PC] Đã kết nối Gateway! Socket ID:", pcSocket.id);
    
    // PC join room
    pcSocket.emit("join-room", roomId);
    console.log("💻 [PC] Đã gửi lệnh tham gia phòng...");

    // Sau khi PC join xong, mới bật Socket của Điện thoại
    setTimeout(startMobileSimulation, 1000);
});

// PC lắng nghe barcode truyền tới
pcSocket.on("receive-barcode", (data) => {
    console.log("\n🔥 BÍP! [PC] Nhận được mã vạch truyền từ điện thoại:", data.barcode);
    console.log("=== TEST THÀNH CÔNG RỰC RỠ! ===");
    
    setTimeout(() => {
        pcSocket.disconnect();
        process.exit(0);
    }, 1000);
});

// 2. Tạo Socket đại diện cho Điện thoại Scanner
function startMobileSimulation() {
    const mobileSocket = io("http://localhost:3000/scanner");

    mobileSocket.on("connect", () => {
        console.log("📱 [Điện Thoại] Đã kết nối Gateway! Socket ID:", mobileSocket.id);
        
        // Điện thoại join room
        mobileSocket.emit("join-room", roomId);
        console.log("📱 [Điện Thoại] Đã gửi lệnh tham gia cùng phòng với PC...");
        
        // Điện thoại quét mã vạch và gửi
        console.log("📱 [Điện Thoại] Đang mô phỏng thao tác quét mã...");
        setTimeout(() => {
            const scannedCode = "8935243101234";
            console.log(`📱 [Điện Thoại] Đã quét được mã: ${scannedCode}. Bắn sang PC ngay!`);
            mobileSocket.emit("send-barcode", { roomId: roomId, barcode: scannedCode });
        }, 1000);
    });
}

const { Server } = require("socket.io");
const Chat = require("./chat.model");
const ChatList = require("./chatlist.model"); // sesuaikan path kamu


const createSocketServer = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("joinRoom", (userId) => {
      socket.join(userId);
      console.log(`Socket ${socket.id} joined room: ${userId}`);
    });

    
    socket.on("resetUnreadCount", async ({ chatId, userId }) => {
      try {
        const chat = await ChatList.findById(chatId);

        if (!chat) {
          console.warn("ChatList tidak ditemukan:", chatId);
          return;
        }

        // Reset unread count
        chat.unreadCount[userId] = 0;
        await chat.save();

        // Emit ke user terkait agar UI update
        io.to(userId).emit("unreadCountUpdated", {
          chatId,
          unreadCount: chat.unreadCount,
        });

        // Emit ke peserta lain jika mau
        const otherUserId = Object.keys(chat.unreadCount).find(
          (id) => id !== userId
        );
        if (otherUserId) {
          io.to(otherUserId).emit("unreadCountUpdated", {
            chatId,
            unreadCount: chat.unreadCount,
          });
        }
      } catch (error) {
        console.error("Gagal reset unread count:", error.message);
      }
    });
    

    socket.on("chat message", async (msg) => {
      try {
        if (!msg.senderId || !msg.receiverId) {
          console.warn("Pesan tidak lengkap:", msg);
          return;
        }

        const chatList = await ChatList.findOne({
          "participants.user": { $all: [msg.senderId, msg.receiverId] },
        }).populate("jadwal");

        if (!chatList) {
          return socket.emit("errorMessage", {
            message: "Sesi chat tidak ditemukan.",
          });
        }

        const jadwal = chatList.jadwal;
        if (!jadwal) {
          return socket.emit("errorMessage", {
            message: "⛔ Jadwal tidak ditemukan.",
          });
        }

        console.log("Status konsul dari jadwal:", jadwal.status_konsul);
        if (jadwal.status_konsul === "selesai") {
          return socket.emit("errorMessage", {
            message:
              "⛔ Konsultasi telah selesai. Anda tidak dapat mengirim pesan.",
          });
        }

        // Kirim pesan
        const now = new Date();
        const newMsg = new Chat({
          text: msg.text || "",
          sender: msg.sender || "User",
          senderId: msg.senderId,
          receiverId: msg.receiverId,
          image: msg.image || null,
          type: msg.type || "text",
          role: msg.role || "unknown",
          waktu: msg.waktu || now,
        });

        const savedMsg = await newMsg.save();

        // Update chatlist
        chatList.lastMessage =
          msg.text || (msg.type === "image" ? "📷 Gambar" : "Pesan baru");
        chatList.lastMessageDate = now;
        const currentUnread = chatList.unreadCount.get(msg.receiverId) || 0;
        chatList.unreadCount.set(msg.receiverId, currentUnread + 1);
        await chatList.save();

        io.to(savedMsg.receiverId.toString()).emit("chat message", savedMsg);
        io.to(savedMsg.senderId.toString()).emit("chat message", savedMsg);
      } catch (err) {
        console.error("Error saat simpan pesan:", err.message);
      }
    });
    
        

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
};

module.exports = createSocketServer;

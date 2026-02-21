const express = require("express");
const axios = require("axios");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
} = require("@whiskeysockets/baileys");

const app = express();
app.use(express.json());

let statusLampu = "OFF";

// ===== SERVER ENDPOINTT =====
app.get("/", (req, res) => {
  res.send("Server WA + ESP32 Aktif 🚀");
});

app.get("/status", (req, res) => {
  res.send(statusLampu);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

// ===== WHATSAPP BOT =====
async function startWA() {
  const { state, saveCreds } = await useMultiFileAuthState("auth");

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "open") {
      console.log("WhatsApp Connected ✅");
    }

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;
      if (reason !== DisconnectReason.loggedOut) {
        startWA();
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    const msg = messages[0];
    if (!msg.message) return;

    const from = msg.key.remoteJid;
    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";

    const pesan = text.toLowerCase().trim();

    if (pesan === "kiri") statusLampu = "KIRI";
    else if (pesan === "kanan") statusLampu = "KANAN";
    else if (pesan === "hazard") statusLampu = "HAZARD";
    else if (pesan === "off") statusLampu = "OFF";
    else return;

    await sock.sendMessage(from, {
      text: `Lampu sekarang: ${statusLampu}`,
    });

    console.log("Status berubah:", statusLampu);
  });
}

startWA();

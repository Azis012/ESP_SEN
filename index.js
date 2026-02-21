// index.js
const express = require('express');
const { 
    makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason,
    fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const qrcode = require('qrcode-terminal');

const AUTH_INFO_DIR = './auth';
let statusLampu = 'OFF'; // status global

// ===== EXPRESS SERVER =====
const app = express();

app.get('/', (req, res) => {
    res.send('WA + ESP32 Server Aktif 🚀');
});

app.get('/status', (req, res) => {
    res.send(statusLampu);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server aktif di port ${PORT}`);
});

// ===== WHATSAPP BOT =====
async function startBot() {
    try {
        const { state, saveCreds } = await useMultiFileAuthState(AUTH_INFO_DIR);
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            auth: state,
        });

        // QR Code & koneksi
        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                console.log('📱 Pindai QR code ini untuk login:');
                qrcode.generate(qr, { small: true });
            }

            if (connection === 'close') {
                const shouldReconnect = new Boom(lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
                if (shouldReconnect) {
                    console.log('🔄 Koneksi terputus, mencoba reconnect...');
                    startBot();
                } else {
                    console.log('❌ WhatsApp terlogout, hapus folder auth/ untuk login ulang');
                }
            } else if (connection === 'open') {
                const userNumber = sock.user.id.split(':')[0];
                console.log(`✅ Koneksi WhatsApp Terhubung ke Nomor: ${userNumber}`);
            }
        });

        sock.ev.on('creds.update', saveCreds);

        // ===== MESSAGE HANDLER =====
        sock.ev.on('messages.upsert', async (m) => {
            const msg = m.messages[0];
            if (!msg.message || msg.key.fromMe) return;

            const from = msg.key.remoteJid;
            const body = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').trim();
            const bodyLower = body.toLowerCase();

            // ===== MENU LAMPU =====
            switch(bodyLower) {
                case 'kiri':
                    statusLampu = 'KIRI';
                    await sock.sendMessage(from, { text: 'Lampu KIRI aktif 🔥' });
                    break;
                case 'kanan':
                    statusLampu = 'KANAN';
                    await sock.sendMessage(from, { text: 'Lampu KANAN aktif 🔥' });
                    break;
                case 'hazard':
                    statusLampu = 'HAZARD';
                    await sock.sendMessage(from, { text: 'Lampu HAZARD aktif ⚠️' });
                    break;
                case 'off':
                    statusLampu = 'OFF';
                    await sock.sendMessage(from, { text: 'Lampu dimatikan ❌' });
                    break;
            }
        });

    } catch(err) {
        console.error('Error start WA:', err);
    }
}

// Jalankan WA bot
startBot();

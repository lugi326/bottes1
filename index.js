const { makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');

async function connectWhatsapp() {
  const auth = await useMultiFileAuthState("session");
  const socket = makeWASocket({
    printQRInTerminal: true,
    browser: ["DAPABOT", "", ""],
    auth: auth.state,
    logger: pino({ level: "silent" }),
  });

  socket.ev.on("creds.update", auth.saveCreds);
  socket.ev.on("connection.update", async ({ connection, qr }) => {
    if (connection === 'open') {
      console.log("WhatsApp Active..");
    } else if (connection === 'close') {
      console.log("WhatsApp Closed..");
      setTimeout(connectWhatsapp, 10000); // Reconnect after 10 seconds
    } else if (connection === 'connecting') {
      console.log('WhatsApp Connecting');
    }
    if (qr) {
      console.log('QR Code:', qr);
      // Save QR code to a file
      fs.writeFileSync('qr.txt', qr);
    }
  });

  socket.ev.on("messages.upsert", async ({ messages }) => {
    const pesan = messages[0].message?.conversation;
    const phone = messages[0].key.remoteJid;
    console.log(messages[0]);
    if (!messages[0].key.fromMe && pesan) {
      try {
        const response = await query({ "question": pesan });
        console.log(response);
        const { text } = response;
        await socket.sendMessage(phone, { text: text });
      } catch (error) {
        console.error('Error processing message:', error);
      }
    }
  });
}

async function query(data) {
  try {
    const response = await fetch(
      "https://geghnreb.cloud.sealos.io/api/v1/prediction/28a6b79e-bd21-436c-ae21-317eee710cb0",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      }
    );
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error in query:', error);
    throw error;
  }
}

connectWhatsapp();

module.exports = { connectWhatsapp };
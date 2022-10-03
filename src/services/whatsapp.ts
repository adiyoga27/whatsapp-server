import { Boom } from "@hapi/boom";
import { infoLog, emergecyLog } from './telegram'

import makeWASocket, {
  AnyMessageContent,
  delay,
  DisconnectReason,
  fetchLatestBaileysVersion,
  // makeCacheableSignalKeyStore,
  makeInMemoryStore,
  MessageRetryMap,
  useMultiFileAuthState,
} from "@adiwajshing/baileys";
import MAIN_LOGGER from "../utils/logger";
import { io } from "../index";
import * as pm2 from "./pm";
import * as fs from "fs";

//import express
import * as dotenv from "dotenv"; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();
const utils = require('util');

// init express

// ======================================= WHATSAPP LOGIC ========================================
const logger = MAIN_LOGGER.child({});
logger.level = "trace";
const qrcode = require("qrcode");

const useStore = !process.argv.includes("--no-store");
const doReplies = !process.argv.includes("--no-reply");

// external map to store retry counts of messages when decryption/encryption fails
// keep this out of the socket itself, so as to prevent a message decryption/encryption loop across socket restarts
const msgRetryCounterMap: MessageRetryMap = {};

// the store maintains the data of the WA connection in memory
// can be written out to a file & read from it
const store = useStore ? makeInMemoryStore({ logger }) : undefined;
store?.readFromFile("./keystore/baileys_store_multi.json");
// save every 10s
setInterval(() => {
  store?.writeToFile("./keystore/baileys_store_multi.json");
}, 10_000);
// start a connection
// start a connection
const startSock = async () => {
  const { state, saveCreds } = await useMultiFileAuthState(
    "./keystore/baileys_auth_info"
  );
  // fetch latest version of WA Web
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`using WA v${version.join(".")}, isLatest: ${isLatest}`);

  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: true,
    auth: state,
    msgRetryCounterMap,
    // generateHighQualityLinkPreview: true,
    // implement to handle retries
    getMessage: async (key) => {
      if (store) {
        const msg = await store.loadMessage(key.remoteJid!, key.id!, undefined);
        return msg?.message || undefined;
      }

      // only if store is present
      return {
        conversation: "hello",
      };
    },
  });

  store?.bind(sock.ev);
  const user = await sock.user;

  // the process function lets you process all events that just occurred
  // efficiently in a batch
  sock.ev.process(
    // events is a map for event name => event data
    async (events) => {
      // something about the connection changed
      // maybe it closed, or we received all offline message or connection opened
      if (events["connection.update"]) {
        const update = events["connection.update"];
        const { connection, lastDisconnect, qr, isNewLogin } = update;

        if (connection === "close") {
          const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
          console.log("\x1b[33m%s\x1b[0m", 'connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect)
          infoLog(JSON.stringify((lastDisconnect?.error as Boom)?.output));
          // reconnect if not logged out
          if (shouldReconnect) {
            startSock();
          } else {
            console.log("Connection closed. You are logged out.");
          }

          const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
          if (statusCode === DisconnectReason.restartRequired || statusCode === DisconnectReason.connectionClosed) {
            pm2.restartApp();
          }
          if ((lastDisconnect?.error as Boom)?.output?.statusCode === DisconnectReason.loggedOut) {
            if (fs.existsSync("./keystore")) {
              fs.rmSync("./keystore", {
                recursive: true,
                force: true,
              });
            }
            pm2.restartApp();
          }
        } else if (connection === "open") {
          io.emit("message", `Berhasil Login dengan user ${user?.name}`);
          io.emit("user", user);
          console.log("opened connection");

        }
        if (qr) {
          //Check QR CODE
          qrcode.toDataURL(qr, (err: any, url: any) => {
            io.emit("message", "QR Code received, scan please!");
            io.emit("qrcode", url);
            console.log("\x1b[33m%s\x1b[0m", qr);
          });
        }
        console.log("connection update", update);
      }

      // credentials updated -- save them
      if (events["creds.update"]) {
        await saveCreds();
      }
    }
  );

  return sock;
};



export const whatsappSocket = startSock();

import { infoLog, emergecyLog } from './telegram'
var pm2 = require('pm2');
const process = require('process');
require('dotenv').config()

export const restartApp = function () {
    console.log("\x1b[33m%s\x1b[0m", "Function Restart APP Running");
    console.log("\x1b[33m%s\x1b[0m", process.env.APP_NAME);

    pm2.connect(function (err: any) {
        if (err) {
            console.log(err)
            emergecyLog(err);
            return;
        }
        pm2.restart(process.env.APP_NAME, function (err: any, apps: any) {
            if (err) {
                console.log(err)
                emergecyLog(err);

                return;
            }
            infoLog("Success Restart")
            pm2.disconnect();
        });
    });
}
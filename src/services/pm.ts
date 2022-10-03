import * as pm2 from 'pm2';
import { infoLog, emergecyLog } from './telegram'
import * as dotenv from "dotenv";

const process = require('process');
require('dotenv').config()

export const restartApp = function () {
    console.log("\x1b[33m%s\x1b[0m", "Function Restart APP Running");
    console.log("\x1b[33m%s\x1b[0m", process.env.APP_NAME);

    pm2.connect(function (err) {
        if (err) {
            console.log(err)
            emergecyLog(err);
            return;
        }
        pm2.restart(process.env.APP_NAME, function (err, apps) {
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
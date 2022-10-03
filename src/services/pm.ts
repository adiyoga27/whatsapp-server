import * as pm2 from 'pm2';
import { infoLog, emergecyLog } from './telegram'
import * as dotenv from "dotenv";

const process = require('process');
require('dotenv').config()

export const restartApp = function (message: any) {
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
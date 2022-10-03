const process = require('process');
require('dotenv').config()

module.exports = {
    apps: [
        {
            name: process.env.APP_NAME,
            script: "npm",
            automation: false,
            args: "start",
            env: {
                NODE_ENV: "development"
            },
            env_production: {
                NODE_ENV: "production"
            }
        }
    ]
};
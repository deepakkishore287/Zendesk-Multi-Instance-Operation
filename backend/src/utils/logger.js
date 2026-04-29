
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const { combine, timestamp, printf, align } = winston.format;
const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}

// Configure Winston logger with Daily Rotate File
const logger = winston.createLogger({
    level: 'info',
    format: combine(
        timestamp({
            format: 'YYYY-MM-DD hh:mm:ss.SSS A',
        }),
        align(),
        printf(({ timestamp, level, message, ...metadata }) => {
            const metadataStr = metadata && Object.keys(metadata).length ? JSON.stringify(metadata) : '';
            return `[${timestamp}] [PID ${process.pid}] ${level}: ${message}${metadataStr ? `${metadataStr}` : ''}`;
        })        
    ),
    transports: [
        new DailyRotateFile({
            filename: path.join(logsDir, 'Auto_BigPandaE2EMonitoring-%DATE%'), 
            datePattern: 'YYYY-MM-DD',
            zippedArchive: false, // Optional: compresses old log files
            maxSize: '20m', // Optional: maximum size of each log file
            maxFiles: '14d', // Optional: keep logs for 14 days
            extension: '.log',
        }),
        new winston.transports.Console(), // Log to console
    ],
});

// Utility function to log errors with method name
const logErrorWithMethod = (methodName, error) => {
    logger.error(`Error in method ${methodName}: ${error.message}`, { stack: error.stack });
};

module.exports = { logger, logErrorWithMethod };

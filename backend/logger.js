/**
 * Logger utility for Desk.ai
 * Provides structured logging with different severity levels
 */

const fs = require('fs');
const path = require('path');

// Log levels
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  CRITICAL: 4
};

const LOG_LEVEL_NAMES = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL'];

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, 'logs');
    this.logFile = path.join(this.logDir, 'app.log');
    this.errorFile = path.join(this.logDir, 'error.log');
    this.maxLogSize = 10 * 1024 * 1024; // 10MB
    this.maxLogFiles = 5;
    
    // Ensure logs directory exists
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Format log entry
   */
  formatLog(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: LOG_LEVEL_NAMES[level],
      message,
      ...meta
    };
    
    return JSON.stringify(logEntry) + '\n';
  }

  /**
   * Write to log file
   */
  writeToFile(filename, content) {
    try {
      // Check file size and rotate if needed
      if (fs.existsSync(filename)) {
        const stats = fs.statSync(filename);
        if (stats.size > this.maxLogSize) {
          this.rotateLog(filename);
        }
      }
      
      fs.appendFileSync(filename, content);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  /**
   * Rotate log files
   */
  rotateLog(filename) {
    try {
      // Rename existing log files
      for (let i = this.maxLogFiles - 1; i >= 0; i--) {
        const oldFile = i === 0 ? filename : `${filename}.${i}`;
        const newFile = `${filename}.${i + 1}`;
        
        if (fs.existsSync(oldFile)) {
          if (i === this.maxLogFiles - 1) {
            fs.unlinkSync(oldFile); // Delete oldest
          } else {
            fs.renameSync(oldFile, newFile);
          }
        }
      }
    } catch (error) {
      console.error('Failed to rotate log file:', error);
    }
  }

  /**
   * Core logging method
   */
  log(level, message, meta = {}) {
    const logEntry = this.formatLog(level, message, meta);
    
    // Always write to main log file
    this.writeToFile(this.logFile, logEntry);
    
    // Also write errors to separate error log
    if (level >= LOG_LEVELS.ERROR) {
      this.writeToFile(this.errorFile, logEntry);
    }
    
    // Console output with colors
    const colors = {
      0: '\x1b[90m', // DEBUG - gray
      1: '\x1b[36m', // INFO - cyan
      2: '\x1b[33m', // WARN - yellow
      3: '\x1b[31m', // ERROR - red
      4: '\x1b[41m\x1b[37m' // CRITICAL - white on red
    };
    
    const reset = '\x1b[0m';
    console.log(`${colors[level]}[${LOG_LEVEL_NAMES[level]}]${reset} ${message}`, meta);
  }

  debug(message, meta) {
    this.log(LOG_LEVELS.DEBUG, message, meta);
  }

  info(message, meta) {
    this.log(LOG_LEVELS.INFO, message, meta);
  }

  warn(message, meta) {
    this.log(LOG_LEVELS.WARN, message, meta);
  }

  error(message, meta) {
    this.log(LOG_LEVELS.ERROR, message, meta);
  }

  critical(message, meta) {
    this.log(LOG_LEVELS.CRITICAL, message, meta);
  }

  /**
   * Get recent logs
   */
  getRecentLogs(lines = 100, errorOnly = false) {
    const filename = errorOnly ? this.errorFile : this.logFile;
    
    if (!fs.existsSync(filename)) {
      return [];
    }
    
    try {
      const content = fs.readFileSync(filename, 'utf8');
      const allLines = content.trim().split('\n');
      const recentLines = allLines.slice(-lines);
      
      return recentLines
        .filter(line => line.trim())
        .map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return { message: line, level: 'UNKNOWN' };
          }
        });
    } catch (error) {
      console.error('Failed to read log file:', error);
      return [];
    }
  }
}

// Export singleton instance
const logger = new Logger();
module.exports = logger;

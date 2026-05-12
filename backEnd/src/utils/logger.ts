type LogLevel = "info" | "warn" | "error" | "debug";

class Logger {
    private formatMessage(level: LogLevel, message: string) {
        return `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}`;
    }

    info(message: string) {
        console.log(this.formatMessage("info", message));
    }

    warn(message: string) {
        console.warn(this.formatMessage("warn", message));
    }

    error(message: string, error?: unknown) {
        console.error(this.formatMessage("error", message));

        if (error instanceof Error) {
            console.error(error.stack ?? error.message);
            return;
        }

        if (error !== undefined) {
            console.error(error);
        }
    }

    debug(message: string) {
        console.debug(this.formatMessage("debug", message));
    }
}

const logger = new Logger();

export default logger;
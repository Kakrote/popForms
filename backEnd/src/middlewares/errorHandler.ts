import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger.js";
import { AppError } from "../utils/appError.js";

// Optional runtime winston integration: if winston is installed we'll use it for file/console transports.
let winstonLogger: any = null;
(async function tryInitWinston() {
    try {
        // optional runtime import; suppress TS errors if winston types aren't installed
        // @ts-ignore
        const mod = await import("winston");
        const { createLogger, format, transports } = mod;
        winstonLogger = createLogger({
            level: process.env.LOG_LEVEL ?? "info",
            format: format.combine(format.timestamp(), format.json()),
            transports: [new transports.Console()],
        });
    } catch (_err) {
        // winston not installed — continue using the simple logger
        winstonLogger = null;
    }
})();

type AnyErr = Error & { statusCode?: number; status?: string; isOperational?: boolean };

export default function globalErrorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
    const error = err as AnyErr;

    // If AppError (operational), send structured response
    if (error instanceof AppError) {
        const meta = `${error.status?.toUpperCase() ?? "ERROR"} ${error.message}`;
        if (winstonLogger) winstonLogger.warn(meta);
        else logger.warn(meta);

        return res.status(error.statusCode).json({
            status: error.status,
            message: error.message,
        });
    }

    // Non-operational / unknown errors
    const statusCode = error.statusCode ?? 500;
    const message = process.env.NODE_ENV === "production" ? "Internal Server Error" : (error.message ?? "Internal Server Error");

    // Log with stack when available
    if (winstonLogger) {
        winstonLogger.error(message, { stack: (error as Error).stack });
    } else {
        logger.error(message, error);
    }

    res.status(statusCode).json({
        status: "error",
        message,
    });
}

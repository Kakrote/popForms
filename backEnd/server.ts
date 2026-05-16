import app from "./src/app"
import logger from "./src/utils/logger"
import seedAdmin from "./src/utils/seedAdmin"

const PORT = process.env.PORT || 5000;

(async () => {
    try {
        await seedAdmin();

        app.listen(PORT, () => {
            logger.info(`Server is running on port ${PORT}`);
        });
    } catch (err) {
        logger.error("Startup failed", err);
        process.exit(1);
    }
})();
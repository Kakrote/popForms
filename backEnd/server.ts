import app from "./src/app"
import logger from "./src/utils/logger"

const PORT=process.env.PORT || 5000;

app.listen(PORT,()=>{
    logger.info(`Server is running on port ${PORT}`);
})
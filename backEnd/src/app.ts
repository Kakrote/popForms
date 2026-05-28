import express from "express";
import router from "./routes/index.js"
import globalErrorHandler from "./middlewares/errorHandler.js"
import cors from "cors";


const app=express();

app.use(cors());
app.use(express.json());
app.use("/api",router);

app.get("/",(req:express.Request,res:express.Response)=>{
    res.send("hello world form express ");
})

// Global error handler (must be after routes)
app.use(globalErrorHandler);

export default app;
import express from "express";
import router from "./routes/index.js"


const app=express();

app.use(express.json());
app.use("/api",router);

app.get("/",(req:express.Request,res:express.Response)=>{
    res.send("hello world form express 5");
})

export default app;
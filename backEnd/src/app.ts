import express from "express";


const app=express();

app.use(express.json());

app.get("/",(req:express.Request,res:express.Response)=>{
    res.send("hello world form express 5");
})

export default app;
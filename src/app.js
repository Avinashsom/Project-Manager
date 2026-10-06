import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";


const app = express();

//basic configuration
app.use(express.json({ limit: "16kb" })); //support json data anyone send json data to the server
app.use(express.urlencoded({ extended: true , limit: "16kb" })); //support form data anyone send form url data to the server
app.use(express.static("public")); //support static files anyone send static files to the server

app.use(cookieParser()) //support cookie anyone send cookie to the server


//cors configuration,what url i allow to access my server
app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(",") || "https://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}))

//import routes
import healthCheckRouter from "./routes/healthcheck.routes.js"
import authRouter from "./routes/auth.routes.js"

//use routes
app.use("/api/v1/healthcheck", healthCheckRouter);
app.use("/api/v1/auth", authRouter);

app.get("/", (req, res) => {
  res.send('Hello World!')
});


export default app;
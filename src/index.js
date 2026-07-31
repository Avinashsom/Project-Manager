import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./db/index.js"
dotenv.config({
    path: "./.env"
});

const port = process.env.PORT || 3000;

connectDB()
.then(() => {
  app.listen(port, () => {
    console.log(`Server running on port http://localhost:${port}`)
  })
})
.catch((err) => {
  console.log("mongodb connection eror",err)
  process.exit(1);
})

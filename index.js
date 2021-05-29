import  express from "express"
import path from "path"
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import services from "./routes/services.js"
import login from "./routes/login.js"

const __dirname = dirname(fileURLToPath(import.meta.url));

const port = 3000

let app = express()


app.set('view engine', 'pug')

app.use("/login", login)

app.use("/services",services)

app.use("/static",express.static(path.join(__dirname,"assests")))

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
  })
import  express from "express"
import path from "path"
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import services from "./routes/services.js"
import login from "./routes/login.js"
import admin from "./routes/admin.js"

const port = 3000

let app = express()


app.set('view engine', 'pug')

app.use("/login", login)

app.use("/services",services)

app.use("/admin",admin)

app.use("/static",express.static(path.join(__dirname,"../","assests")))

app.get("/",(req,res) => { 
  res.redirect("/services/")
})

app.listen(port, () => {
    
})

export default app
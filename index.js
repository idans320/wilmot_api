import  express from "express"
import path from "path"
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const port = 3000

let app = express()

app.set('view engine', 'pug')

app.get('/', function (req, res) {
    res.render('index')
  })

app.use("/static",express.static(path.join(__dirname,"assests")))

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
  })
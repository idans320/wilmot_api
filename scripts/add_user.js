import db from "../shared/db.js";
import assert from "assert"

var args = process.argv.slice(2);

assert.strictEqual((args.length == 2),true,"USAGE: [USER] [PASSWORD]")

const [user,password] = args

db.users.register(user,password).then(()=>{ 
    console.log("added successfuly")
    process.exit()

},(e) => {
    console.log("already registered")
    process.exit()
})


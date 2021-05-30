import { Router } from "express"
import express from "express"
import db from "../shared/db.js"
import $ from "jquery"
import USER_MODEL from "../schema/user_model.js"
import Ajv from "ajv";
import { signToken } from "../shared/jws.js"

const route = Router();
const ajv = new Ajv()

route.use(express.json())

async function submitLogin(e) {
    e.preventDefault();
    let unindexed_array = $(e.target).serializeArray();
    let indexed_array = {};

    $.map(unindexed_array, function (n, i) {
        indexed_array[n['name']] = n['value'];
    });
    const result = await fetch("/login/", {
        method: "post", body: JSON.stringify(indexed_array), headers: {
            'Content-Type': 'application/json'
        }
    })
    if (result.status == 200) {
        const json = await result.json()
        console.log(json)
    }
    else {
        console.error("Invalid login")
    }
    return false
}

route.get("/", (req, res) => {
    console.log(submitLogin)
    res.render("login", { submit: submitLogin })
})

route.post("/", async (req, res) => {
    const validate = ajv.compile(USER_MODEL);
    if (!validate(req.body)) {
        return res.sendStatus(400)
    }
    const { username, password } = req.body
    const validLogin = await db.users.login(username, password)
    if (validLogin) {
        const token = await signToken(username)
        res.send({ "token": token })
    }
    else {
        res.sendStatus(401)
    }


})
export default route
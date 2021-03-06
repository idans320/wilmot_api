import { Router } from "express"
import express from "express"
import db from "../shared/db.js"
import USER_MODEL from "../schema/user_model.js"
import Ajv from "ajv";
import { signToken } from "../shared/jws.js"
import { admin } from "../shared/consts.js";
import { verify, sendAuthorization } from "../shared/jws.js"

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
        const {token} = json
        window.localStorage.setItem("token",token)
        window.location = "/services/"
    }
    else {
        alert("Invalid login")
    }
    return false
}

route.get("/", async (req, res) => {
    const token = req.headers.authorization
    const isValid = token ? await verify(token) : false
    res.render("login", { submit: submitLogin, sendAuthorization, isValid, tokenSent: Boolean(token) })
})

route.post("/", async (req, res) => {
    const validate = ajv.compile(USER_MODEL);
    if (!validate(req.body)) {
        return res.sendStatus(400)
    }
    const { username, password } = req.body
    const db_user = await db.users.login(username, password)
    if (db_user) {
        const editor = (db_user.role == admin)? true : db_user.editor
        const token = await signToken(username,db_user.role,editor)
        res.send({ "token": token })
    }
    else {
        res.sendStatus(401)
    }
})
export default route
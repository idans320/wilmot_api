import {Router} from "express"
import express from "express"
import db from "../shared/db.js"
import $ from "jquery"
import USER_MODEL from "../schema/user_model.js"
import Ajv from "ajv";

const route = Router();
const ajv = new Ajv()

route.use(express.json())

function submitLogin(e){
    e.preventDefault();
    let unindexed_array = $(e.target).serializeArray();
    let indexed_array = {};

    $.map(unindexed_array, function(n, i){
        indexed_array[n['name']] = n['value'];
    });
    console.log(indexed_array)
    return false
}

route.get("/", (req,res) => {
    console.log(submitLogin)
    res.render("login", {submit:submitLogin})
})

route.post("/", async (req,res) => {
    const validate = ajv.compile(USER_MODEL);
    if (!validate(req.body)){
        return res.sendStatus(409)
    }
    const {username, password} = req.body
    try{
        const token = await db.users.generateToken(username,password)
        res.send(token)
    } catch(e){
        res.sendStatus(401)
    }
})
export default route
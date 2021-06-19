import Ajv from "ajv";
import e, { Router } from "express"
import DATA_SERVICE_SCHEMA from "../schema/data_service.js"
import db from "../shared/db.js"
import express from "express"
import path from "path"
import { verify, decode, sendAuthorization } from "../shared/jws.js"
import { admin } from "../shared/consts.js";

const ajv = new Ajv()

let route = Router();

route.use(express.json())

route.get(/(.*)/, async function (req, res) {
    if (!req.originalUrl.endsWith("/")) {
        return res.redirect(req.originalUrl + "/")
    } else {
        req.next()
    }
})

const submitData = async function submitData(e, method) {
    e.preventDefault();
    const token = window.localStorage.getItem("token")

    let unindexed_array = $(e.target).serializeArray();
    let indexed_array = {};

    $.map(unindexed_array, function (n, i) {
        indexed_array[n['name']] = n['value'];
    });
    const url = window.location.pathname
    const body = JSON.stringify(indexed_array)
    const result = await fetch(url, {
        method: method, body: body, headers: {
            'Content-Type': 'application/json',
            "authorization": token
        }
    })
    if (result.status == 201) {
        console.log("Added successfuly")
        window.location.href = "../"
    }
    else {
        alert("Invalid Request")
    }
    return false
}

route.post(/(.*)/, async function (req, res) {
    const token = req.headers.authorization
    const isValid = token ? await verify(token) : false
    if (isValid) {
        const claims = await decode(token)
        const role = claims.role
        if (role === admin)
            return req.next()
        else
            return res.sendStatus(401)
    }
    return res.sendStatus(401)
})

const isAdmin = async (token) => {
    const isValid = token ? await verify(token) : false
    const isAdmin = isValid && ((await decode(token)).role == admin)
    const authorized = isValid && isAdmin
    return authorized
}

route.get("/", async (req, res) => {
    const token = req.headers.authorization
    const authorized = await isAdmin(token)
    res.render('admin', { isValid: authorized, tokenSent: Boolean(token), sendAuthorization, submitData })
})


route.get("/add_role", async (req, res) => {
    const token = req.headers.authorization
    const authorized = await isAdmin(token)
    res.render('admin/add_role', { isValid: authorized, tokenSent: Boolean(token), sendAuthorization: sendAuthorization, submitData: submitData })
})

route.get("/remove_role", async (req, res) => {
	const token = req.headers.authorization
	const authorized = await isAdmin(token)
	const roles = await db.roles.getRoles()
	res.render('admin/remove_role', { isValid: authorized, roles,  tokenSent: Boolean(token), sendAuthorization: sendAuthorization, submitData: submitData })

})


route.get("/add_user", async (req, res) => {
    const token = req.headers.authorization
    const authorized = await isAdmin(token)
    const roles = await db.roles.getRoles()
    res.render('admin/add_user', { isValid: authorized, roles, tokenSent: Boolean(token), sendAuthorization, submitData })
})

route.get("/remove_user", async (req, res) => {
    const token = req.headers.authorization
    const authorized = await isAdmin(token)
    const users = await db.users.getAllUsers()
    res.render('admin/remove_user', { isValid: authorized, users, tokenSent: Boolean(token), sendAuthorization, submitData })
})


route.post("/add_user", async (req, res) => {
    const authorized = await isAdmin(req.headers.authorization)
    if (authorized) {
        const { username, password, role, editor } = req.body
        if (username && password && role) {
            if ((await db.users.register(username, password, role, Boolean(editor)))) {
                res.sendStatus(201)
            } else
                res.sendStatus(409)
        } else {
            res.sendStatus(400)
        }
    }
    else {
        res.send(401)
    }
})

route.post("/remove_user", async (req, res) => {
    const authorized = await isAdmin(req.headers.authorization)
    if (authorized) {
        const { username } = req.body
        if (username) {
            if ((await db.users.delete(username)))
                res.sendStatus(201);
            else
                res.sendStatus(409)
        } else {
            res.sendStatus(400)
        }
    }
    else {
        res.send(401)
    }
}
)


route.post("/remove_role", async (req, res) => {
    const authorized = await isAdmin(req.headers.authorization)
    if (authorized) {
        const { roleName } = req.body
        if (roleName) {
            if ((await db.roles.deleteRole(roleName)))
                res.sendStatus(201)
            else
                res.sendStatus(409)
        }
        else {
            res.sendStatus(400)
        }
    }
    else {
        res.send(401)
    }
}
)

route.post("/add_role", async (req, res) => {
    const authorized = await isAdmin(req.headers.authorization)
    if (authorized) {
        const { roleName } = req.body
        console.log(req.body)
        if (roleName) {
            if (!(await db.roles.isRoleExist(roleName))) {
                await db.roles.addRole(roleName)
                res.sendStatus(201)
            } else
                res.sendStatus(409)
        } else {
            res.sendStatus(400)
        }
    }
    else {
        res.send(401)
    }
})

export default route

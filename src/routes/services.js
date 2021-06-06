import Ajv from "ajv";
import e, { Router } from "express"
import DATA_SERVICE_SCHEMA from "../schema/data_service.js"
import db from "../shared/db.js"
import express from "express"
import path from "path"
import { verify, signToken, sendAuthorization, decode } from "../shared/jws.js"
import { admin } from "../shared/consts.js";
import { send } from "process";

const ajv = new Ajv()

let route = Router();

const getServiceFromRoute = async (route) => {
    let dir = path.dirname(route)
    let name = path.basename(route)
    dir = dir.endsWith("/") ? dir : dir + "/"

    let service = await db.services.getServiceByRouteAndName(dir, name)

    return service
}

const submitData = async function submitData(e, method, service, send_body, send_data) {
    e.preventDefault();
    const token = window.localStorage.getItem("token")

    let unindexed_array = $(e.target).serializeArray();
    let indexed_array = {};

    $.map(unindexed_array, function (n, i) {
        indexed_array[n['name']] = n['value'];
    });
    const url = window.location.pathname + "../" + (service ? indexed_array["name"] : "")

    indexed_array["data"] = indexed_array["data"] ? JSON.parse(indexed_array["data"]) : {}
    const body = !send_body ? null : (send_data ? JSON.stringify(indexed_array.data) : JSON.stringify(indexed_array))
    const result = await fetch(url, {
        method: method, body: body, headers: {
            'Content-Type': 'application/json',
            "authorization": token
        }
    })
    if (result.status == 201) {
        window.location.href = window.location.pathname + "../"
    }
    else {
        alert("Invalid Request")
    }
    return false
}

const isAllowToEdit = async (token, role) => {
    let claims = await decode(token)
    if (claims.role == admin || (!role && claims.editor == true) || (claims.role == role && claims.editor == true)) {
        return true
    }
    return false
}

route.use(express.json({"json":"5mb"}))


route.get(/(.*)/, async function (req, res) {
    const route = getRoute(req)

    let service = await getServiceFromRoute(req.path)
    if (!req.originalUrl.endsWith("/") && !service) {
        return res.redirect(req.originalUrl + "/")
    } else {
        req.next()
    }
})

route.get('/:path*?/add_item', async function (req, res) {
    const token = await tryToGenerateToken(req.headers.authorization)
    const isValid = token ? await verify(token) && await isAllowToEdit(token) : false
    let status = 200
    let user_role
    const roles = await db.roles.getRoles()
    if (isValid)
        user_role = (await decode(token)).role;
    else
        status = 401;
    res.status(status).render("services/add_item", { isValid: isValid, roles, user_role, path: req.pathname, tokenSent: Boolean(token), sendAuthorization: sendAuthorization, submitData: submitData })
})

route.get('/:path*?/delete_item', async function (req, res) {
    const route = getRoute(req)
    const token = await tryToGenerateToken(req.headers.authorization)
    let role
    let status = 200
    const isValid = token ? await verify(token) && await isAllowToEdit(token) : false
    if (isValid)
        role = (await decode(token)).role;
    else
        status = 401;
    let services = (await db.services.getServicesInRoute(route)).filter((e) => (role == admin || e.role == role))
    res.status(status).render("services/delete_item", { isValid: isValid, path: req.pathname, services: services, tokenSent: Boolean(token), sendAuthorization: sendAuthorization, submitData: submitData })
})

route.get('/:path*?/replace_item', async function (req, res) {
    const route = getRoute(req)
    const token = await tryToGenerateToken(req.headers.authorization)
    let role
    let status = 200
    const isValid = token ? await verify(token) && await isAllowToEdit(token) : false
    if (isValid)
        role = (await decode(token)).role;
    else
        status = 401;
    let services = (await db.services.getServicesInRoute(route)).filter((e) => (role == admin || e.role == role))
    res.status(status).render("services/replace_item", { isValid: isValid, services: services, path: req.pathname, tokenSent: Boolean(token), sendAuthorization: sendAuthorization, submitData: submitData })
})

const getRoute = (req) => {
    let route = req.params["path"] ? ("/" + (req.params["path"]) + (req.params[0] ? req.params[0] : "")) : "/"
    return route.endsWith("/") ? route : route + "/"
}

const tryToGenerateToken = async (authorization) => {
    if (authorization == undefined)
        return undefined

    if (authorization.includes("Basic") == true) {
        const parsed_auth = Buffer.from(authorization.replace("Basic ", ""), "base64").toString().split(":")
        console.log(parsed_auth)
        const [username, password] = parsed_auth
        if (username && password) {
            if (await db.users.login(username, password)) {
                return await signToken(username)
            }
            else {
                return null
            }
        }
    }
    else {
        return authorization
    }
}
route.get('/:path*?', async function (req, res) {
    const token = await tryToGenerateToken(req.headers.authorization)
    const isValid = token ? await verify(token) : false
    let role, editor;
    if (isValid) {
        const decoded = (await decode(token))
        role = decoded.role;
        editor = decoded.editor;
    }
    else {
        role = null
        editor = false
    }

    const route = getRoute(req)
    let service = await getServiceFromRoute(route)
    let routes = await db.services.getChildrenRoutes(route)
    if (service) {
        let isAuthorized = (service.role == role || role == admin)
        if (req.headers["content-type"] == "application/json") {
            if (isAuthorized) {
                return res.send(service.data)
            }
            else {
                return res.sendStatus(401)
            }
        }
        let status = 200
        if (!isAuthorized) {
            status = 401
            return res.status(status).render('services/display', { data: JSON.stringify(service.data), isValid: isAuthorized, tokenSent: Boolean(token), sendAuthorization: sendAuthorization })
        }
        else {
            return res.json(service.data)
        }
    }
    else {
        let services = (await db.services.getServicesInRoute(route)).filter((e) => (role == admin || e.role == role))
        res.render('services', { services: services, routes: routes, isEditor: editor, path: route, isValid: isValid, tokenSent: Boolean(token), sendAuthorization: sendAuthorization })
    }
})

route.post("/:path?*", async function (req, res) {
    const token = await tryToGenerateToken(req.headers.authorization)
    const isValid = token ? await verify(token) : false
    if (isValid) {
        const route = getRoute(req)
        const data = req.body
        let service = await getServiceFromRoute(route)
        if (service) { return res.sendStatus(409) }
        data.route = route
        const validate = ajv.compile(DATA_SERVICE_SCHEMA)
        if (validate(data)) {
            const service = await db.services.getServiceByRouteAndName(route, data.name)
            const isAuthorized = await isAllowToEdit(token, data.role)
            if (service) { return res.sendStatus(409) }
            if (!isAuthorized) { return res.sendStatus(401) }
            else {
                res.sendStatus(201)
                db.services.addService(data)
            }
        } else {
            res.sendStatus(400)
        }
    } else {
        res.sendStatus(401)
    }
})

route.delete("/:path?*", async function (req, res) {
    const token = await tryToGenerateToken(req.headers.authorization)
    const isValid = token ? await verify(token) : false
    if (isValid) {
        const route = getRoute(req)
        let service = await getServiceFromRoute(route)
        if (service) {
            const isAuthorized = await isAllowToEdit(token, service.role)
            if (isAuthorized) {
                res.sendStatus(201)
                db.services.deleteService(service)
            } else {
                res.sendStatus(401)
            }
        } else {
            res.sendStatus(404)
        }
    }
    else {
        res.sendStatus(401)
    }
})

route.put("/:path?*", async function (req, res) {
    const token = await tryToGenerateToken(req.headers.authorization)
    const isValid = token ? await verify(token) : false
    if (isValid) {
        const data = req.body
        const route = getRoute(req)
        let service = await getServiceFromRoute(route)
        if (service) {
            const isAuthorized = await isAllowToEdit(token, service.role)
            if (isAuthorized) {
                if (Object.keys(data).length > 0) {
                    res.sendStatus(201)
                    db.services.replaceService(service.name, service.route, data)
                }
                else {
                    res.sendStatus(400)
                }
            }
            else {
                res.sendStatus(401)
            }
        } else {
            res.sendStatus(404)

        }
    } else {
        res.sendStatus(401)
    }
})

export default route

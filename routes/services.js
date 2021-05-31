import Ajv from "ajv";
import e, { Router } from "express"
import DATA_SERVICE_SCHEMA from "../schema/data_service.js"
import db from "../shared/db.js"
import express from "express"
import path from "path"
import { verify } from "../shared/jws.js"
import $ from "jquery"

const ajv = new Ajv()

let route = Router();

const getServiceFromRoute = async (route) => {
    let dir = path.dirname(route)
    let name = path.basename(route)
    dir = dir.endsWith("/") ? dir : dir + "/"

    let service = await db.services.getServiceByRouteAndName(dir, name)

    return service
}

const sendAuthorization = async function sendAuthorization(path, redirect) {
    const token = window.localStorage.getItem("token")
    if (token) {
        const request = await (await fetch(path, { headers: { authorization: token } })).text()
        document.open()
        document.write(request)
        document.close()
    }
    else if (redirect) {
        window.location.href = "/login/";
    }
}

const submitData = async function submitData(e, method, service, send_body) {
    e.preventDefault();
    const token = window.localStorage.getItem("token")

    let unindexed_array = $(e.target).serializeArray();
    let indexed_array = {};

    $.map(unindexed_array, function (n, i) {
        indexed_array[n['name']] = n['value'];
    });
    const url = window.location.pathname + "../" + (service ? indexed_array["name"] : "")
    indexed_array["data"] = indexed_array["data"] ? JSON.parse(indexed_array["data"]) : {}
    const body = !send_body ? null : JSON.stringify(indexed_array)
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

route.use(express.json())


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
    const token = req.headers.authorization
    const isValid = token ? await verify(token) : false
    res.render("services/add_item", { isValid: isValid, path: req.pathname, tokenSent: Boolean(token), sendAuthorization: sendAuthorization, submitData: submitData })
})

route.get('/:path*?/delete_item', async function (req, res) {
    const route = getRoute(req)
    const token = req.headers.authorization
    const isValid = token ? await verify(token) : false
    let services = await db.services.getServicesInRoute(route)
    res.render("services/delete_item", { isValid: isValid, path: req.pathname, services: services, tokenSent: Boolean(token), sendAuthorization: sendAuthorization, submitData: submitData })
})

route.get('/:path*?/replace_item', async function (req, res) {
    const route = getRoute(req)
    const token = req.headers.authorization
    const isValid = token ? await verify(token) : false
    let services = await db.services.getServicesInRoute(route)
    res.render("services/replace_item", { isValid: isValid, services: services, path: req.pathname, tokenSent: Boolean(token), sendAuthorization: sendAuthorization, submitData: submitData })
})

const getRoute = (req) => {
    let route = req.params["path"] ? ("/" + (req.params["path"]) + (req.params[0] ? req.params[0] : "")) : "/"
    return route.endsWith("/") ? route : route + "/"
}


route.get('/:path*?', async function (req, res) {
    const token = req.headers.authorization
    const isValid = token ? await verify(token) : false

    const route = getRoute(req)
    let service = await getServiceFromRoute(route)
    let routes = await db.services.getChildrenRoutes(route)
    if (service) {
        return res.send(service.data)
    }
    else {
        let services = await db.services.getServicesInRoute(route)
        res.render('services', { services: services, routes: routes, path: route, isValid: isValid, tokenSent: Boolean(token), sendAuthorization: sendAuthorization })
    }
})

route.post("/:path?*", async function (req, res) {
    const token = req.headers.authorization
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
            if (service) { res.sendStatus(409) }
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
    const token = req.headers.authorization
    const isValid = token ? await verify(token) : false
    if (isValid) {
        const route = getRoute(req)
        let service = await getServiceFromRoute(route)
        if (service) {
            res.sendStatus(201)
            db.services.deleteService(service)
        } else {
            res.sendStatus(404)
        }
    }
})

route.put("/:path?*", async function (req, res) {
    const token = req.headers.authorization
    const isValid = token ? await verify(token) : false
    if (isValid) {
        const data = req.body
        const route = getRoute(req)
        const validate = ajv.compile(DATA_SERVICE_SCHEMA)
        let service = await getServiceFromRoute(route)
        data.route = service.route
        if (validate(data)) {
            if (service) {
                res.sendStatus(201)
                db.services.replaceService(data)
            } else {
                res.sendStatus(404)
            }
        }
    }
})

export default route

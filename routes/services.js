import Ajv from "ajv";
import {Router} from "express"
import DATA_SERVICE_SCHEMA from "../schema/data_service.js"
import db from "../shared/db.js"
import express from "express"
import path from "path"

const ajv = new Ajv()

let route = Router();

const getServiceFromRoute = async (route) => { 
    let dir = path.dirname(route)
    let name = path.basename(route)
    let service = await db.services.getServiceByRouteAndName(dir,name)
    return service
}

route.use(express.json())

route.get('/:path*?', async function (req, res) {
    const route = (req.params["path"]? "/" + req.params["path"] : "/") + (req.params[0] ? req.params[0] : "")
    let service = await getServiceFromRoute(route)
    let routes = await db.services.getChildrenRoutes(route)
    if (service){
        return res.send(service.data)
    }
    else{
        let services = await db.services.getServicesInRoute(route)
        res.render('services', {services: services, routes : routes, path:route})
    }
})


route.post("/:path?*", async function (req, res){ 
    const route = (req.params["path"]? "/" + req.params["path"] : "/") + (req.params[0] ? req.params[0] : "")
    const data = req.body
    let service = await getServiceFromRoute(route)
    if (service){return res.sendStatus(409) }
    data.route = route
    const validate = ajv.compile(DATA_SERVICE_SCHEMA)
    if (validate(data)){
        const service = await db.services.getServiceByRouteAndName(route,data.name)
        if (service){ res.sendStatus(409)}
        else{
            res.sendStatus(201)
            db.services.addService(data)
        }
    } else {
        res.sendStatus(400)
    }
})

export default route

import MongoClient  from "mongodb"
import _ from "lodash"

export default class RochesterDB {
    async connect(host,port){
        const url = `mongodb://${host}:${port}`;
        const dbName = 'rochester';
        this.client = await MongoClient.connect(url);
        this.db = this.client.db(dbName)
    }
    constructor(host, port) {
        if (port == undefined) {
            port = 27017
        }
        this.connect(host,port)
    }
    services = {
        getServicesInRoute: async (route) => {
            let collection = this.db.collection("services")
            return await collection.find({ "route": route }).toArray()
        },
        getServiceByRouteAndName : async (route, name) => {
            let collection = this.db.collection("services")
            return await collection.findOne({"name":{'$regex' : `^${name}$`, '$options' : 'i'},"route":route})
        },
        getChildrenRoutes: async (route) => {
            let collection = this.db.collection("services")
            let regex = new RegExp(`/${route}[^\/]*/`)
            let services = await collection.find({ "route": {'$regex' : `${route}[^\/]*` } }).toArray()
            return _.uniq(services.map((e) => e.route)).filter((e) => e != route)
        },
        addService: (data) => {
            let collection = this.db.collection("services")
            collection.insertOne(data)
        }
    }
}
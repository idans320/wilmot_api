import MongoClient from "mongodb"
import _ from "lodash"
import bcrypt, { hash } from "bcrypt"

const saltRounds = 10;

export default class RochesterDB {
    async close(){
        this.client.close()
    }
    async connect(host, port) {
        const url = `mongodb://${host}:${port}`;
        const dbName = 'rochester';
        this.client = await MongoClient.connect(url);
        this.db = this.client.db(dbName)
    }
    constructor(host, port) {
        if (port == undefined) {
            port = 27017
        }
        this.connect(host, port)
    }
    roles = {
        addRole: async (role) => {
            let collection = this.db.collection("roles")
            await collection.insertOne({ role })
        },
        deleteRole: async (role) => {
            let collections = ["services","roles","users"]
            await Promise.all(collections.map(async (e) => {
                await this.db.collection(e).remove({ role })
            }))
            return true
        },

        isRoleExist: async (role) => {
            let collection = this.db.collection("roles")
            let role_db = await collection.findOne({ "role": { '$regex': `^${role}$`, '$options': 'i' } })
            return Boolean(role_db)
        },
        getRoles: async () => {
            let collection = this.db.collection("roles")
            let role = await collection.find({}).toArray()
            return role.map((e) => e.role)
        }
    }
    services = {
        getServicesInRoute: async (route) => {
            let collection = this.db.collection("services")
            return await collection.find({ "route": route }).toArray()
        },
        getServiceByRouteAndName: async (route, name) => {
            let collection = this.db.collection("services")


            return await collection.findOne({ "name": { '$regex': `^${name}$`, '$options': 'i' }, "route": route })
        },
        getChildrenRoutes: async (route) => {
            let collection = this.db.collection("services")
            let regex = new RegExp(`/${route}[^\/]*/`)
            let services = await collection.find({ "route": { '$regex': `${route}[^\/]*` } }).toArray()
            return _.uniq(services.map((e) => e.route)).filter((e) => e != route)
        },
        deleteService: async (data) => {
            let collection = this.db.collection("services")
            await collection.deleteOne({ "name": { '$regex': `^${data.name}$`, '$options': 'i' }, "route": data.route })
        },
        replaceService: async (name, route, data) => {
            let collection = this.db.collection("services")
            console.log(data)
            await collection.findOneAndUpdate({ "name": { '$regex': `^${name}$`, '$options': 'i' }, "route": route }, { "$set": { data } })
        },
        addService: async (data) => {
            let collection = this.db.collection("services")
            await collection.insertOne(data)
        }
    }
    users = {
        register: async (user, password, role, editor) => {
            if (role === undefined)
                role = null;
            const salt = await bcrypt.genSalt(saltRounds)
            const hash = await bcrypt.hash(password, salt)
            const collection = this.db.collection("users")
            const db_user = await collection.findOne({ user: user })
            if (!db_user) {
                await collection.insertOne({ user, hash, role, editor })
                return true
            }
            else {
                return false
            }
        },
        login: async (user, password) => {
            const collection = this.db.collection("users")
            const db_user = await collection.findOne({ user: user })

            return (await bcrypt.compare(password, db_user.hash)) ? db_user : false
        },
        delete: async (user, password) => {
            const collection = this.db.collection("users")
            const db_user = await collection.remove({ user: user })
            return true
        },
        getAllUsers: async () => {
            const collection = this.db.collection("users")
            const db_users = await collection.find({}).toArray()
            return db_users
        },
        getUserData: async (user) => {
            const collection = this.db.collection("users")
            const db_user = await collection.findOne({ user: user })
            delete db_user["hash"]
            return db_user
        }
    }
}

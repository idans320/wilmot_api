import MongoClient  from "mongodb"
import _ from "lodash"
import bcrypt from "bcrypt"
import JWS from "node-jws"
import FileProvider from 'node-jws-file-provider';

const provider = FileProvider.default('../private.pem', '../public.pem');

const saltRounds = 10;

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
    users = { 
        register : async (user,password) => {
            const salt = await bcrypt.genSalt(saltRounds)
            const hash = await bcrypt.hash(password, salt)
            const collection = this.db.collection("users")
            const db_user = collection.findOne({user:user})
        
            if (!db_user){
                collection.insertOne({user:user,hash})
            }
            else{
                return Promise.reject("User already exists")
            }
        },
        generateToken : async( user, password) => {
            const collection = this.db.collection("users")
            const db_user = collection.findOne({user:user})
            if (!db_user){
                return Promise.reject("Invalid user and password.")
            }
            const token = new JWS(provider);
            token.setClaims({
                user: user,
            });
            await token.sign()

            return token.toString()
        }
    }
}y
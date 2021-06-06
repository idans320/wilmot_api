import FileProvider from 'node-jws-file-provider';
import JWS , {JWTAlghoritm } from "node-jws"
import db from "../shared/db"
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import path from "path"

const provider = FileProvider(path.join(__dirname,'../../private.pem'), path.join(__dirname,'../../public.pem'));

export const signToken = async (user, role, editor) => {
    const token = new JWS(provider);
    token.useAlghoritm(JWTAlghoritm.RS256);
    token.setClaims({
        user
    });
    await token.sign()
    return token.toString()
}

export const verify = async (token) => {
    try{ 
    const jws = JWS.fromString(token, provider);
    if (await jws.valid()){
        const claims = await decode(token)
        console.log(claims)
        const user_db = await db.users.getUserData(claims.user)
        return Boolean(user_db)
    }
    else{
        return false
    }
    } catch(e){
        return false
    }
}

export const decode = async(token) => {
    const jws = JWS.fromString(token, provider);
    const claims = jws.getClaims()
    const user_db = await db.users.getUserData(claims.user)
    return {...claims, ...{"role": user_db.role, "editor": user_db.editor}}
}
export const sendAuthorization = async function sendAuthorization(path, redirect) {
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

import FileProvider from 'node-jws-file-provider';
import {default as JWS, JWTAlghoritm } from "node-jws"
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import path from "path"

const __dirname = dirname(fileURLToPath(import.meta.url));

const provider = FileProvider.default(path.join(__dirname,'../private.pem'), path.join(__dirname,'../public.pem'));


export const signToken = async (user, role) => {
    const token = new JWS.default(provider);
    token.useAlghoritm(JWTAlghoritm.RS256);
    token.setClaims({
        user, role
    });
    await token.sign()
    return token.toString()
}

export const verify = async (token) => {
    try{ 
    const jws = JWS.default.fromString(token, provider);
    
    return await jws.valid()
    } catch(e){
        return false
    }
}

export const decode = async(token) => {
    const jws = JWS.default.fromString(token, provider);
    return await jws.getClaims()
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

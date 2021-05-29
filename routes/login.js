import {Router} from "express"
import express from "express"
import $ from "jquery"

let route = Router();

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

route.post("/", (req,res) => {
    res.send(req.body)
})
export default route
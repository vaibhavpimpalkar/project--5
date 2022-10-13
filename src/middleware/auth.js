const jwt = require('jsonwebtoken')
const UserModel = require('../models/userModel')
const Validation = require('../validator/validation.js')

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>Authentication>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>//

const authentication = async function (req , res , next){
    try {
        
        let token = req.headers["authorization"]
        if(!token) return res.status(401).send({status : false , message : "Token is required"})
        // console.log(token)
        
        //finalToken contain two token one is bearer token and other is token which we provided
        //so we split the token which we have set in header as well as the bearer token
        let finalToken = token.split(" ")
        console.log(finalToken)
        //remove the bearer token and access the token which we provided
        let newToken = finalToken.pop()
        console.log(newToken )

        jwt.verify(newToken , "group20project5" , function(error , decodedToken){
            if(error){
                let message = error.message == "jwt expired" ? "token expired , please Login Again!!!" : "invalid Token"
                return res.status(400).send({status: false , message : message})
            } 
           
            req.decodedToken = decodedToken;  //this line for we can access this token outside the middleware
           
            next()
        })
    } catch (error) {
        return res.status(500).send({status: false , message : error.message})
    }
}

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>Authorization>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>//

const authorization = async function(req , res , next){
    try {
        
        let userId = req.params.userId
        let user = req.decodedToken.userId

        if(!Validation.validateId(userId)) return res.status(400).send({status : false , message : "Invalid id!!!"})

        req.presentUser = await UserModel.findById(userId)
        if(!req.presentUser) return res.status(404).send({status: false, message :"User not present in db!!!!"})

        if(userId != user) return res.status(403).send({status: false , message : "Unauthorised Access!!"})

        next()
    } catch (error) {
        return res.status(500).send({status: false , message : error.message})
    }
}



module.exports = {authentication , authorization}


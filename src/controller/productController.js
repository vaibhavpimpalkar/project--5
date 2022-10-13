const productModel = require('../models/productModel')
const AWS = require('../AWS/aws-sdk')

const createProduct = async function (req,res) {
    let data = req.body 
    // let productImage = req.files;

    let {title ,description ,price , currencyId,currencyFormat, productImage,availableSizes } = data

    if(!validation.checkInputsPresent(data)){
        return res.status(400).send({status : false , msg : "please provide some details"})
    }
    if(!title){
        return res.status(400).send({status:false , msg : "please provide title"})
    }
    if(! (title)){
        return res.status(400).send({status : false , msg : "please provide valid title"})
    }

    varifytitle = await productmodel.findOne({title : title})
    if(title){
        return res.status(400).send({status : false , msg : "title is already exist"})
    }
    if(!description){
        return res.status(400).send({status : false , msg :"please provide description"})
    }
    if(!  (description)){
        return res.status(400).send({status : false , msg : "please provide valid description "})
    }
    if(!price){
        return res.status(400).send({status : false,msg :"please enter price"})
    }
    if(!  (price)){
        return res.status(400).send({status : false , msg :"please provide valid price"})
    }
    if(!currencyId){
        return res.status(400).send({status : false , msg : "please provide currencyID"})
    }
    if(!  currencyId()){
        return res.status(400).send({status : false , msg :" please provide currencyId in valid format"})
    }
    if(!currencyFormat){
        return res.status(400).send({status : false , msg : "please provide currencyFORMAT"})
    }
    if(!  (currencyFormat)){

        return res.status(400).send({status : false , msg : "please provide valid currencyFORMAT"})
    }
    if(!productImage){
        return res.status(400).send({status : false , msg :"please provide productImage"})
    }
    if(!  (productImage)){
        return res.status(400).send({status:false , msg :"please provide valid productImage"})
    }
    
    if (productImage && productImage.length > 0) {
        
        var uploadedProductPictureUrl = await AWS.uploadFile(productImage[0]);
        // uploadedProductPictureUrl = data.productImage
    } 
    else {
        res.status(400).send({ msg: "No file found" });
    }
    
    
    
    if(!availableSizes){
        return res.status(400).send({status:false,msg : "please provide available size"})
    }
    if(!  (availableSizes)){
        return res.status(400).send({status : false , msg :"size should be - S, XS,M,X, L,XXL, XL"})
    }

   let result = await productmodel.create(data)

res.status(201).send({status:true , msg :result })


}




const getProduct = async function (req,res){

    

}


module.exports ={createProduct , getProduct}
const productModel = require('../models/productModel')
const AWS = require('../AWS/aws-sdk')
const validation=require('../validator/validation');

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>createProduct>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

const createProduct = async function (req, res) {
    try{
    let data = req.body;
    let productImage = req.files;
    if (!validation.checkInputsPresent(data)) {
        return res.status(400).send({ status: false, msg: "please provide some details" })
    }

    let { title, description, price, currencyId, currencyFormat,style,availableSizes,isFreeShipping,installments } = data

    if (!validation.checkInputsPresent(title)) {
        return res.status(400).send({ status: false, msg: "please provide title" })
    }
   
     const verifytitle = await productModel.findOne({ title: title })
    if (verifytitle) {
        return res.status(400).send({ status: false, msg: "title is already exist" })
    }
   
    if (!validation.checkInputsPresent(description)) {
        return res.status(400).send({ status: false, msg: "please provide description " })
    }
    if(!price){
         return res.status(400).send({status:false,msg:"provide price"})
     }


    if (!validation.isValidPrice (price) ) {
        return res.status(400).send({ status: false, message: " Enter a valid price" });
    }

    if (!validation.checkInputsPresent(currencyId)) {
        return res.status(400).send({ status: false, msg: "please provide currencyID" })
    }
    if (!(/INR/.test(currencyId))) {
        return res.status(400).send({ status: false, message: " currencyId should be in 'INR' Format" });}

    if (!validation.checkInputsPresent(currencyFormat)) {
        return res.status(400).send({ status: false, msg: "please provide currencyFORMAT" })
    }
    if (!(/₹/.test(currencyFormat))){
        return res.status(400).send({ status: false, message: "Currency format of product should be in '₹' " });
    }

    if (!productImage || productImage.length==0){
        return res.status(400).send({ status: false, msg: "please provide productImage" })
    }

    // if(!validation.isValidImageType(productImage)){
    //     return res.status(400).send({status:false, msg:" Only images can be uploaded (jpeg/jpg/png)"})

    // }

    var uploadedProfilePictureUrl = await AWS.uploadFile(productImage[0]);
     
    if(!validation.checkInputsPresent(availableSizes)){
        return res.status(400).send({status:false, msg:"product available sizes are required"})
    }
    

   if (!(availableSizes.trim() == 'S' || availableSizes.trim() == 'XS' || availableSizes.trim() == 'M'||
   availableSizes.trim() == 'X' || availableSizes.trim() == 'L' || availableSizes.trim() == 'XXL'|| availableSizes.trim() == 'XL')) 
   { return res.status(400).send({ status: false, message: 'Please enter valid availableSizes' }) }

   const productData = {
    title: title,
    description: description,
    price: price,
    currencyId: currencyId,
    currencyFormat: currencyFormat,
   isFreeShipping: isFreeShipping?isFreeShipping:false ,
    productImage: uploadedProfilePictureUrl,
    style: style,
    availableSizes: availableSizes,
    installments: installments,
    deletedAt: null,
    isDeleted: false,
};


    let result = await productModel.create(productData)

    res.status(201).send({ status: true, msg: result })


}catch(error)
{
    res.status(500).send({status:false, error: error.message})
}
}


//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>getProduct>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>//

const getProduct = async function (req, res) {



}

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>getProductbyId>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>//

const getProductsById = async function (req , res){

    try {
        // request productId from path path param

   const productId =req.params.productId;

   // check productId is valid or objectId or not 
   if(!validation.validateId(productId))return res.status(400).send({ status: false, message: "Invalid productId" })

    //database call for find product from product model
   const findProductsData = await productModel.findById({ _id: productId, isDeleted:false});

   // if product not found in database
   if (!findProductsData) return res.status(404).send({ status: false, msg: "No product Details available with this productId"});

   // if successfully find product data ,,,,then response 
   return res.status(200).send({ status: true, msg: "Product details",data:findProductsData });
        
    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message });
    }
}



//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>deleteByid>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

const deleteProductById = async function (req, res) {
    try {
    
        let pid = req.params.productId
        if (!validation.validateId(pid)) {
            return res.status(400).send({ status: false, message: "Please provide valid Product id" })
    
        }
    
        let product = await productModel.findById(pid)
    
        if (!product) {
            return res.status(404).send({ status: false, message: "Product not found" })
    
        }
    
        if (product.isDeleted === true) {
            return res.status(400).send({ status: false, message: "Product already deleted" })
    
        }
    
        let deletedProduct = await productModel.findByIdAndUpdate(pid, { $set: { isDeleted: true, deletedAt: Date.now() } }, { new: true })
    
        return res.status(200).send({ status: true, message: "Success",data: deletedProduct })
    
    
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
    
    }
    





module.exports = { createProduct, getProduct,getProductsById,deleteProductById }
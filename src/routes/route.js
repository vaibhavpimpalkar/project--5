const express  = require("express")
const router =express.Router()
const userController = require('../controller/userController')
const ProductController = require('../controller/productController');
const CartController = require('../controller/cartController');
const OrderController = require('../controller/orderController')
const Auth = require('../middleware/auth')


//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>API's for User>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>//

router.post('/register',userController.createUser);
router.post("/login", userController.login)
router.get('/user/:userId/profile', Auth.authentication,userController.getUserProfile)
router.put('/user/:userId/profile', Auth.authentication,Auth.authorization ,userController.updateUsersProfile)

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>API's for product>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>//

router.post('/products', ProductController.createProduct)
router.get('/products', ProductController.getProduct)
router.get('/products/:productId', ProductController.getProductsById)
router.put('/products/:productId', ProductController.updateProduct)
router.delete('/products/:productId', ProductController.deleteProductById)

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>API's for Cart>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>//

router.post('/users/:userId/cart',Auth.authentication,Auth.authorization,CartController.addProductTocart)
router.put('/users/:userId/cart', Auth.authentication, Auth.authorization, CartController.removeProductFromCart)
router.get('/users/:userId/cart', Auth.authentication,Auth.authorization, CartController.getCart)
router.delete('/users/:userId/cart',Auth.authentication,Auth.authorization,CartController.deleteCart)

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>API's for Order>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>//

router.post('/users/:userId/orders',Auth.authentication,Auth.authorization, OrderController.createOrder)
router.put('/users/:userId/orders', Auth.authentication, Auth.authorization, OrderController.updateOrderStatus)


//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>AWS>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>//

router.post("/write-file-aws", async function(req, res){

    try{
        let files= req.files
        if(files && files.length>0){
            //upload to s3 and get the uploaded link
            // res.send the link back to frontend/postman
            let uploadedFileURL= await uploadFile( files[0] )
            res.status(201).send({msg: "file uploaded succesfully", data: uploadedFileURL})
        }
        else{
            res.status(400).send({ msg: "No file found" })
        }
        
    }
    catch(err){
        res.status(500).send({msg: err})
    }
    
})

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>API for  pathParam >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

router.all("/*",(req,res)=>{res.status(400).send({status:false,message:"Invalid path params"})})





//.................................................................................................................//
module.exports = router;
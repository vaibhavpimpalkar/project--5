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
router.get('/user/:userId/profile', Auth.authentication,Auth.authorization,userController.getUserProfile)
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


//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>API for  pathParam >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

router.all("/*",(req,res)=>{res.status(400).send({status:false,message:"Invalid Path Param"})})

//.................................................................................................................//
module.exports = router;
const cartModel = require('../models/cartModel');
const CartModel = require('../models/cartModel');
const ProductModel = require('../models/productModel');
const validation = require('../validator/validation');

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>Create Cart>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>//

const addProductTocart = async function(req,res){
    try{
        const data = req.body;
        const userId = req.params.userId;

        if (!validation.checkInputsPresent(data)) {
            return res.status(400).send({ status: false, messag: "data is required to remove products from cart" })
        }

        if(!validation.validateId(userId)){
            return res.status(400).send({status:false,message:"Invalid userId"})
        }
        
        //validating productId which is received from request body
        if(!validation.validateId(data.productId)){
            return res.status(400).send({status:false,message:"Invalid productId"})
        }

         // getting product details by productID
         const getDetailsByProductId = await ProductModel.findOne({
            _id: productId,
            isDeleted: false,
            deletedAt: null,
        });

        if (!getDetailsByProductId) {
            return res.status(404).send({ status: false, message: "No product found by this productID" });
        }

         // checking whether product is in stock or not
         if (getDetailsByProductId.installments === 0) {
            return res.status(400).send({ status: false, message: "product is out of stock"});}

        // users cart details
        const cartDetailsOFuser = await CartModel.findOne({ userId: userId });

        // adding product to cart's items array if cart is empty
        if (cartDetailsOFuser.items.length === 0) {
            const productData = {
                productId: productId,
                quantity: 1,
            };

            const cartData = {
                items: [productData],
                totalPrice: getDetailsByProductId.price,
                totalItems: 1,
            };

            const newCart = await CartModel.findOneAndUpdate({ userId: userId }, { $set: cartData }, { new: true });

            return res.status(200).send({status: true,message: "Product added to cart",data: newCart});
        }
        
        // checking whether productID coming from requestBody is already exist in cart or not
        const isProductExistsInCart = userCartDetails.items.filter(
            (productData) => productData.productId===productId
        );
        // if cart is not empty and if product exist then increasing cart's quantity
        if (isProductExistsInCart.length > 0) {
            const updateProductQuantity = await CartModel.findOneAndUpdate({ userId: userId, "items.productId": productId }, {
                $inc: {
                    totalPrice: +getDetailsByProductId.price,
                    "items.quantity": +1,
                },
            }, { new: true });

            return res.status(200).send({status: true,message: "Product quantity updated to cart",
            data: updateProductQuantity, });
        }

         // if productId coming from request body is not present in cart thus adding new product to cart
         const addNewProductToCart = await CartModel.findOneAndUpdate({ userId: userId }, {
            $addToSet: { items: { productId: productId, quantity: 1 } },
            $inc: { totalItems: +1, totalPrice: +getDetailsByProductId.price },
        }, { new: true });

        return res.status(200).send({status: true,message: "updated to cart", data: addNewProductToCart});

    }catch(error){
        res.status(500).send({status:false,msg:error.message})
    }
}

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>Remove or Reduce a Product>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>//

const removeProductFromCart = async function (req, res) {
    try {
        const data = req.body;
        const userId = req.params.userId;

        if (!validation.checkInputsPresent(data)) {
            return res.status(400).send({ status: false, messag: "data is required to remove products from cart" })
        }

        if(!validation.validateId(userId)){
            return res.status(400).send({status:false,message:"Invalid userId"})
        }
        // using destructuring fetching data from request body

        const { productId, removeProduct } = data;

        // validating productId which is receiving from requestbody
        if (!validation.validateId(productId)) {
            return res.status(400).send({ status: false, message: "Invalid productId" });
        }

        // getting product details by productID
        const getDetailsByProductId = await ProductModel.findOne({
            _id: productId,
            isDeleted: false,
            deletedAt: null,
        });

        if (!getDetailsByProductId) {
            return res.status(404).send({ status: false, message: "No product found by  this productID" });
        }

        // removeProduct should be either 1 or 0
        if (![0, 1].includes(removeProduct)) {
            return res.status(400).send({
                status: false, message: "Remove Product value must be either 0 or 1",
            });
        }

        // getting user's cart details of the given user ObjectId
        const cartByUserId = await CartModel.findOne({ userId: userId });


        // checking whether productId already exist in cart

        const isProductExistInCart = await cartModel.findByid(productId);


        if (!validation.checkInputsPresent(isProductExistInCart)) {
            return res.status(404).send({ status: false, message: "No product exist with this productId inside cart" });
        }

        // accessing quantity of that product inside cart
        const productQuantity = isProductExistInCart.quantity;

        // if user want to reduce the quantity of product by one
        if (removeProduct === 1) {

            // if productQuantity is  greater than one then reducing the quantity else removing whole product
        if (productQuantity > 1) {
            const decreasequantityofproduct =
                 await cartModel.findOneAndUpdate({ userId: userId, productId: productId }, {
                     $inc: {
                         totalPrice: -getDetailsByProductId.price,
                         quantity: -1,
                     },
                 }, { new: true });

            return res.status(200).send({status: true,message:"quantity of product reduced in cart",
            data: decreasequantityofproduct,
                });
        } else {
            const eraseProductFromCart = await CartModel.findOneAndUpdate({ userId: userId }, {
                    $pull: { items: isProductExistInCart},
                    $inc: { totalItems: -1, totalPrice: -getDetailsByProductId.price },
                }, { new: true });

            return res.status(200).send({status: true,message:"Product removed from cart",data: eraseProductFromCart});
            }
            // if user want to remove whole product from cart
        } else {
            const removeProductFromCart = await CartModel.findOneAndUpdate({ userId: userId }, {
                $pull: { items: isProductExistInCart},
                $inc: {
                    totalItems: -1,
                    totalPrice: -(productQuantity * getDetailsByProductId.price),
                },
            }, { new: true });

            return res.status(200).send({status: true, message:"Product removed from cart",data: removeProductFromCart,
            });
        }


    } catch (error) {
        res.status(500).send({ status: false, msg: error.message })
    }
}

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>getCardDetails>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>//

const getCart = async function (req, res) {
    try {

        const userId = req.params.userId;
        const userIdFromToken = req.userId;

        //validation of userId for fetching cart details

        if (!validation.validateId(userId)) return res.status(400).send({ status: false, message: "Provided userId is Invalid " })

        //------------- Aunthentication and authorization for cart--------------------

        const findUser = await userModel.findById({ _id: userId })
        if (!findUser) {
            return res.status(400).send({ status: false, message: "User not found with this UserId" });

        }

        if (userId._id != userIdFromToken)
            return res.status(400).send({ status: false, message: "User are not authorized" })

        //------------------finding cart Datails---------------------

        const cartData = await cartModel.findOne({ _id: userId })
        if (!cartData) {
            return res.status(400).send({ status: false, message: "No such cart is present with this cartId" })
        }

        //------------for successfully fetching cart details-----------------
        return res.status(201).send({ status: true, message: "Cart fetch successfully", data: cartData })

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}


//.....................................................................................................................//

module.exports = {addProductTocart,removeProductFromCart,getCart}
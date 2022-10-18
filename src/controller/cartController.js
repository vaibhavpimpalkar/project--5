const cartModel = require('../models/cartModel');
//const CartModel = require('../models/cartModel');
const productModel = require('../models/productModel');
const validation = require('../validator/validation');

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>Create Cart>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>//
const addProductTocart = async function (req, res) {
    try {
        let requestBody = req.body;

        let userIdFromParam = req.params.userId

        let { cartId, productId } = requestBody;

        const productById = await productModel.findById(productId)
        if (!productById) {
            return res.status(404).send({ status: false, message: " product not found!!!" })
        }

        if (productById.isDeleted == true) {
            return res.status(404).send({ status: false, message: " product is deleted!!!" })
        }

        const userCart = await cartModel.findOne({ userId: userIdFromParam })
        //if cart does not exist for the given user
        if (!userCart) {
            let filter = {}

            let prodData = { productId: productById._id, quantity: 1 }

            filter.totalItems = 1
            filter.totalPrice = productById.price
            filter.userId = userIdFromParam
            filter.items = prodData

            const createdCart = await cartModel.create(filter)

            let productDataAll = await cartModel.findOne({ userId: userIdFromParam }).populate('items.productId')

            return res.status(200).send({ status: true, message: "New cart created with products", data: productDataAll, });

        }
        if (userCart._id != cartId) {
            return res.status(400).send({ status: false, message: "cart doesn't exist" })}

        //if usercart is created but cart is empty
        if (userCart.items.length === 0) {
            const addedProduct = {
                productId: productById,
                quantity: { $inc: +1 }
            }

            const newItemInCart = await cartModel.findOneAndUpdate({ userId: userIdFromParam }, { $set: { items: [addedProduct] } }, { $inc: { totalItems: +1, totalPrice: +productById.price } }, { new: true })
            let productDataAll = await cartModel.findOne({ userId: userIdFromParam }).populate('items.productId')

            return res.status(200).send({status: true,message: "Product added to cart",data: productDataAll})}

        //for checking if product exist in cart
        {
            let productExistInCart = userCart.items.findIndex(items => items.productId == requestBody.productId);

            console.log(productExistInCart)

            //if provided product does exist in cart
            if (productExistInCart > -1) {

                const increasedProductQuantity = await cartModel.findOneAndUpdate({ userId: userIdFromParam, "items.productId": productId }, {
                    $inc: { totalPrice: +productById.price, totalItems: +1, "items.$.quantity": +1 },
                }, { new: true })
                let productDataAll = await cartModel.findOne({ userId: userIdFromParam }).populate('items.productId')

                return res.status(200)
                    .send({ status: true, message: "Product quantity and price updated in the cart", data: productDataAll });
            }
            //if provided product does not exist in cart
            if (productExistInCart == -1) {
                const updatedProductQuantity = await cartModel.findOneAndUpdate({ userId: userIdFromParam },
                    { $push: { items: { productId: productId, quantity: 1 } }, $inc: { totalPrice: +productById.price, totalItems: +1 }, }, { new: true })

                let productDataAll = await cartModel.findOne({ userId: userIdFromParam }).populate('items.productId')


                return res.status(200).send({ status: true, message: "product updated to cart", data: productDataAll })}
        }

    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })

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

module.exports = {addProductTocart,getCart}
const cartModel = require('../models/cartModel');
//const CartModel = require('../models/cartModel');
const productModel = require('../models/productModel');
const validation = require('../validator/validation');

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>Create Cart>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>//
const addProductTocart = async function (req, res) {
    try {

        let requestBody = req.body;

        userIdFromParam = req.params.userId

        let { cartId, productId } = requestBody;

        const productById = await productModel.findById(productId).lean()
        if (!productById) {
            return res.status(404).send({ status: false, message: "product not found" })
        }

        if (productById.isDeleted == true) {
            return res.status(404).send({ status: false, message: "product is deleted" })
        }

        if (productById.installments === 0) {
            return res.status(400).send({ status: false, message: "product is out of stock" });
        }
        const userCart = await cartModel.findOne({ userId: userIdFromParam })

        //if cart doesn't exist for the given userId of user
        if (!userCart) {
            let filter = {}

            let prodData = { productId: productById._id, quantity: 1 }

            filter.totalItems = 1
            filter.totalPrice = productById.price
            filter.userId = userIdFromParam
            filter.items = prodData
            const createdCart = await cartModel.create(filter)

            let productDataAll = await cartModel.findOne({ userId: userIdFromParam }).populate('items.productId')

            return res.status(200)
                .send({ status: true, message: "New cart created with products", data: productDataAll, });

        }
        if (userCart._id != cartId) {
            return res
                .status(400)
                .send({ status: false, message: "cart doesn't exist" });
        }
        //if usercart is created but cart is empty
        if (userCart.items.length === 0) {
            const addedProduct = {
                productId: productId,
                quantity: 1,
            };

            const cartData = {
                items: [addedProduct],
                totalPrice: productById.price,
                totalItems: 1,
            };



            const newItemInCart = await cartModel.findOneAndUpdate({ userId: userIdFromParam },
                { $set: cartData }, { new: true }).populate('items.productId')

            // const newCart = await CartModel.findOneAndUpdate({ userId: userId }, { $set: cartData }, { new: true });

            return res.status(200).send({status: true, message: "Product added to cart", data: newItemInCart});
        }
        //for checking if product exist in cart
        {
            let productExistInCart = userCart.items.findIndex(items => items.productId == requestBody.productId);

            console.log(productExistInCart)

            //if provided product does exist in cart
            if (productExistInCart > -1) {

                const increasedProductQuantity = await cartModel.findOneAndUpdate({ userId: userIdFromParam, "items.productId": productId }, {
                    $inc: { totalPrice: +productById.price, totalItems: +1, "items.$.quantity": +1 },
                }, { new: true }).populate('items.productId')

                return res.status(200).send({ status: true, message: "Product quantity and price updated in the cart", data: increasedProductQuantity });
            }
            //if provided product does not exist in cart
            if (productExistInCart == -1) {
                const updatedProductQuantity = await cartModel.findOneAndUpdate({ userId: userIdFromParam },
                    { $push: { items: { productId: productId, quantity: 1 } }, $inc: { totalPrice: +productById.price, totalItems: +1 }, }, { new: true }).populate('items.productId')



                return res.status(200).send({ status: true, message: "product updated to cart", data: updatedProductQuantity });
            }
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

        //validating userID

        if (!validation.validateId(userId)) return res.status(400).send({ status: false, message: "Provided userId is Invalid " })

        //cheking userId exist in cartModel or not 

        const findUserFROMcart = await cartModel.findOne({ userId: userId }).populate("items.productId");
        if (!findUserFROMcart) {
            return res.status(400).send({ status: false, message: "User not found with this UserId" });

        }

        //------------for successfully fetching cart details-----------------
        return res.status(200).send({ status: true, message: "successfull", data: findUserFROMcart })

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
};


//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>deleteCart>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>//

const deleteCart = async function (req, res) {

    try {
        let userId = req.params.userId
        if (!validation.validateId(userId)) {
            return res.status(400).send({ status: false, msg: "invalid userId" })
        }
        //if cart doesn't exist by the given userId
        let findUserFROMcart = await cartModel.findOne({ userId: userId })
        if (!findUserFROMcart) {
            return res.status(404).send({ status: false, msg: `No cart available by this user: ${userId}` })
        }
        //if cart exist by the given userId    
        //then check is there any item present in cart

        if (findUserFROMcart.items.length == 0) {
            return res.status(400).send({ status: false, msg: "There is no items present in cart" })
        }

        let deleteCart = await cartModel.findByIdAndUpdate({ _id: findUserFROMcart._id },
            { $set: { item: [] }, totalPrice: 0, totalItems: 0 })

        return res.status(204).send({ status: true, message: "cart deleted successfully." })

    }
    catch (error) {
        return res.status(500).send({ status: false, msg: error.message });
    }

}

//.....................................................................................................................//

module.exports = { addProductTocart, getCart, deleteCart }
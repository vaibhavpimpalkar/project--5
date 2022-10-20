const cartModel = require('../models/cartModel');
const productModel = require('../models/productModel');
const validation = require('../validator/validation');

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>Create Cart>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>//
const addProductTocart = async function (req, res) {
    try {

        let requestBody = req.body;

        let userIdFromParam = req.params.userId;


        let { cartId, productId } = requestBody;

        if (!validation.validateId(productId))
            return res.status(400).send({ status: false, message: "Invalid productId" });

        const productById = await productModel.findById(productId)
        if (!productById) {
            return res.status(404).send({ status: false, message: " product not found" })
        }

        if (productById.isDeleted == true) {
            return res.status(404).send({ status: false, message: " product is deleted" })
        }

        if (productById.installments === 0) {
            return res.status(400).send({ status: false, message: "product is out of stock" });
        }

        const userCart = await cartModel.findOne({ userId: userIdFromParam })

        //if cart doesn't exist for the user
        if (!userCart) {
            let filter = {}

            let prodData = { productId: productById._id, quantity: 1 }

            filter.totalItems = 1
            filter.totalPrice = productById.price
            filter.userId = userIdFromParam
            filter.items = prodData
            const createdCart = await cartModel.create(filter)

            let productDataAll = await cartModel.findOne({ userId: userIdFromParam }).populate('items.productId')

            return res.status(200) .send({ status: true, message: "New cart created with products", data: productDataAll, });

        }
        if (userCart._id != cartId) {
            return res.status(400).send({ status: false, message: "cart doesnot exist" });
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
                { $set: cartData }, { new: true }).populate('items.productId');

            return res.status(200).send({
                status: true,
                message: "Product added to cart",
                data: newItemInCart,
            });
        }
        //for checking if product exist in cart
        {
            let productExistInCart = userCart.items.findIndex(items => items.productId == requestBody.productId);

            console.log(productExistInCart)

            //if provided product does exist in cart

            if (productExistInCart > -1) {

                const increasedProductQuantity = await cartModel.findOneAndUpdate({ userId: userIdFromParam, "items.productId": productId }, {
                    $inc: { totalPrice: +productById.price, "items.$.quantity": +1 },
                }, { new: true }).populate('items.productId')


                return res.status(200)
                    .send({ status: true, message: "Product quantity and price updated in the cart", data: increasedProductQuantity });
            }
            //if provided product doesn't exist in cart
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

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>UpdateCart>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>//

const removeProductFromCart = async function (req, res) {
    try {
        let requestBody = req.body;

        let userIdFromParam = req.params.userId

        let { cartId, productId, removeProduct } = requestBody;
        console.log(removeProduct)

        if (!validation.validateId(productId)) {
            return res.status(400).send({ status: false, msg: "invalid ProductId" })
        }

        const productById = await productModel.findById(productId)

        if (!productById) {
            return res.status(404).send({ status: false, message: " product not found" })
        }

        if (productById.isDeleted == true) {
            return res.status(404).send({ status: false, message: " product is deleted" })
        }

        if (requestBody.removeProduct !== 0 && requestBody.removeProduct !== 1) {
            return res.status(404).send({ status: false, message: " removeProduct must be either 0 or 1" })
        }

        const userCart = await cartModel.findOne({ _id: cartId, userId: userIdFromParam })
        if (!userCart) {
            return res.status(404).send({ status: false, message: "given cardId & userId doesn't matched" })
        }

        //for checking if product exist in cart

        const productExistInCart = userCart.items.findIndex(items => items.productId == requestBody.productId);

        console.log(productExistInCart)

        //if provided productId product does exist in cart
        if (productExistInCart == -1) {
            return res.status(404).send({ status: false, message: " This product does not exist in cart" })
        }


        if (productExistInCart > -1) {

            //checking the removeProduct key is equal to 1
            if (removeProduct === 1) {


                //checking the quantity of product in cart is equal to 1,then delete the whole product
                if (userCart.items[productExistInCart].quantity == 1) {

                    const deleteWholeProduct = await cartModel.findOneAndUpdate({ userId: userIdFromParam, "items.productId": productId },
                        {
                            $pull: { items: { productId: productId, quantity: userCart.items[productExistInCart].quantity } },
                            $inc: { totalItems: -1, totalPrice: -productById.price },
                        }, { new: true }).populate("items.productId")

                    return res.status(200).send({
                        status: true, message: "Single product is completely removed from the cart",
                        data: deleteWholeProduct
                    });
                }

                if (userCart.items[productExistInCart].quantity > 1) {

                    const reduceProductQuantity = await cartModel.findOneAndUpdate({ userId: userIdFromParam, "items.productId": productId },
                        { $inc: { totalItems: -1, totalPrice: -productById.price, "items.$.quantity": -1 } }, { new: true }).populate("items.productId");


                    return res.status(200).send({ status: true, message: "Product Quantity is decreased from the cart", data: reduceProductQuantity });
                }


            }
            //cheking the removeProduct  key is equal to 0
            if (removeProduct === 0) {


                const removeWholeProducts = await cartModel.findOneAndUpdate({ userId: userIdFromParam, "items.productId": productId },
                    {
                        $pull: { items: { productId: productId, quantity: userCart.items[productExistInCart].quantity } },
                        $inc: { totalItems: -((userCart.items[productExistInCart]).quantity), totalPrice: -(productById.price * ((userCart.items[productExistInCart]).quantity)) },
                    }, { new: true }).populate("items.productId")

                return res.status(200).send({ status: true, message: "The whole product is removed", data: removeWholeProducts, });
            }


        }

    } catch (error) {
        res.status(500).send({ status: false, msg: error.message })
    }
}

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

module.exports = { addProductTocart, getCart, removeProductFromCart, deleteCart }
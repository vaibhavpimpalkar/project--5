const orderModel = require("../models/orderModel");
const cartModel = require("../models/cartModel");
const productModel = require("../models/productModel");
const validation = require("../validator/validation");

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>createOrder>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>//
const createOrder = async function (req, res) {
    try {
        let userIdfromParam = req.params.userId
        let data = req.body

        if (!validation.validateId(userIdfromParam)) {
            return res.status(400).send({ status: false, msg: "Invalid userId" })
        }
        
        if(!validation.checkInputsPresent(data)){
            return res.status(400).send({status:false, message:"Provide data for create Order"})
        }

        // using destructuring
        let { cartId, cancellable } = data;

        

        if (!validation.validateId(cartId)) {
            return res.status(400).send({ status: false, msg: "Invalid cartId" })
        }


        // fetching  given userId user's cart details
        const userCartDetail = await cartModel.findOne({ userId: userIdfromParam, _id: cartId })


        if (!userCartDetail) {
            return res.status(404).send({ status: false, message: `No cart found by this User's:${userIdfromParam} not found` });
        }

        //checking given userId user cart is empty 
        if (userCartDetail.items.length === 0) {
            return res.status(400).send({ status: false, message: "Cart is empty" });
        }

        let items = userCartDetail.items;
        let totalQuantity = 0;
        for (let i = 0; i < items.length; i++) {
            totalQuantity += items[i].quantity;
        }

        if (data.status) {
            if (data.status != "pending" && data.status != "completed" && data.status != "cancelled")
                return res.status(400).send({ status: false, message: " status should be :- [cancelled , completed , pending]" })
        }
        if (cancellable == false) {
            userCartDetail.cancellable = cancellable
        }

        let orders = {
            items: items,
            userId: userIdfromParam,
            totalItems: userCartDetail.totalItems,
            totalPrice: userCartDetail.totalPrice,
            status: data.status,
            totalQuantity: totalQuantity
        }

        let createOrder = await orderModel.create(orders);
        let cartWithProductDetails = await orderModel.findOne({ userId: userIdfromParam }).populate("items.productId");
        return res.status(201).send({ status: true, message: "successfully created", data: cartWithProductDetails });

    }
    catch (error) {
        res.status(500).send({ status: false, msg: error.message })
    }
}

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>updateOrder>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>//

const updateOrderStatus = async function (req, res) {
    try {
      let userIdFromParam = req.params.userId;
      let requestBody = req.body;
  
      const { orderId, status } = requestBody;
  
      if (!validation.checkInputsPresent(requestBody)) {
        return res.status(400).send({ status: false, message: "Order data is required " })}
  
      if (!validation.validateId(orderId))
        return res.status(400).send({ status: false, message: `Invalid orderId ${requestBody.orderId}` });
  
      let checkOrder = await orderModel.findOne({ _id: requestBody.orderId,isDeleted: false});

      if (!checkOrder)
        return res.status(404).send({status: false,message: `No order found by this UserId: ${requestBody.orderId}`});
  
  
     if(checkOrder.userId!=userIdFromParam)
          return res.status(404).send({status: false,message: `No order found by this UserId: ${userIdFromParam}`});
  
      if (!["pending", "completed", "cancelled"].includes(status)) {
        return res.status(400).send({status: false,message: "status should be from [pending, completed, cancelled]"})}
  
        // console.log(checkOrder)
  
    if(checkOrder.cancellable === true && requestBody.status==="cancelled"){
     const updateStatus = await orderModel.findOneAndUpdate(
      { _id: orderId },
      { $set: { status: "cancelled" } },
      { new: true }
    );
    return res.status(200).send({status:true, message:"Order cancelled", data:updateStatus})
  }
  
    if (checkOrder.status === "completed") {
        return res.status(400).send({status: false,message: "Order completed, now its status can not be updated"})}
  
    if (checkOrder.status === "cancelled" && requestBody.status==="pending") {
        return res.status(400).send({status: false,message: "you have already cancelled this order"})}
           
  
    if (status === "cancelled" && checkOrder.cancellable === false) {
        return res.status(400).send({ status: false, message: "This order can not be cancelled" })}
    
  
    if (status === "pending") {
        return res.status(400).send({ status: false, message: "order status is already pending" })}
  
      const updateStatus = await orderModel.findOneAndUpdate(
        { _id: orderId },
        { $set: { status: status } },
        { new: true }
      );
  
      res.status(200).send({status: true,message: "order status updated",data: updateStatus});
  
    } catch (err) {
      return res.status(500).send({ status: false, message: err.message });
    }
  };
  

// const updateOrderStatus = async function (req, res) {
//     try {
        
//         let userIdfromParam = req.params.userId
//         let data = req.body

//         if(!validation.checkInputsPresent(data)){
//             return res.status(400).send({status:false, message:"Provide data for Update Order"})
//         }

//         let { orderId,status } = data
        
//         if (!orderId) return res.status(400).send({ status: false, message: "OrderId is required for getting OrderData" })
//         if (!validation.validateId(orderId)) return res.status(400).send({ status: false, message: "Invalid OrderId" })

//         let findOrder = await orderModel.findOne({ _id: orderId, isDeleted: false })
//         if (!findOrder) return res.status(400).send({ status: false, message: `Order not found by this orderId'${orderId}'` })

//         if (!status) return res.status(400).send({ status: false, message: "status is required" })
//         if (!(["Pending", "Completed", "Cancelled"].includes(status))){
//              return res.status(400).send({ status: false, message: "Order status should be either 'Pending', 'Completed' or'Cancelled'"})}


//         let conditions = {};

//         if(status == "Cancelled") {

//         //checking if the order is cancellable or not
//         if(findOrder.cancellable===false){
//         return res.status(400).send({ status: false, message: "You cannot cancel this order" })}
//           conditions.status = data.status;
//         }else{
//           conditions.status = data.status;
//         }

//         // updating status of the order
    
//         let statusUpdate = await orderModel.findByIdAndUpdate(
//             {_id: findOrder._id},
//             conditions,
//             { new: true }
//         )
//         res.status(200).send({ status: true, message: "status of order updated", data: statusUpdate });
//     }
//     catch (err) {
//         return res.status(500).send({ status: false, message: err.message })
//     }
// }


//.................................................................................................................//

module.exports = { createOrder, updateOrderStatus }
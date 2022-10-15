const productModel = require('../models/productModel')
const AWS = require('../AWS/aws-sdk')
const validation = require('../validator/validation');

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>createProduct>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

const createProduct = async function (req, res) {
    try {
        let data = req.body;
        let productImage = req.files;
        if (!validation.checkInputsPresent(data)) {
            return res.status(400).send({ status: false, msg: "please provide some details" })
        }

        let { title, description, price, currencyId, currencyFormat, style, availableSizes, isFreeShipping, installments } = data

        if (!validation.checkInputsPresent(title) || !validation.validateName(title)) {
            return res.status(400).send({ status: false, msg: "please provide title" })
        }

        const verifytitle = await productModel.findOne({ title: title })
        if (verifytitle) {
            return res.status(400).send({ status: false, msg: "title is already exist" })
        }

        if (!validation.checkInputsPresent(description)) {
            return res.status(400).send({ status: false, msg: "please provide description " })
        }
        if (!price) {
            return res.status(400).send({ status: false, msg: "provide price" })
        }


        if (!validation.isValidPrice(price)) {
            return res.status(400).send({ status: false, message: " Enter a valid price" });
        }

        if (!validation.checkInputsPresent(currencyId)) {
            return res.status(400).send({ status: false, msg: "please provide currencyID" })
        }
        if (!(/INR/.test(currencyId))) {
            return res.status(400).send({ status: false, message: " currencyId should be in 'INR' Format" });
        }

        if (!validation.checkInputsPresent(currencyFormat)) {
            return res.status(400).send({ status: false, msg: "please provide currencyFORMAT" })
        }
        if (!(/₹/.test(currencyFormat))) {
            return res.status(400).send({ status: false, message: "Currency format of product should be in '₹' " });
        }

        if (!productImage || productImage.length == 0) {
            return res.status(400).send({ status: false, msg: "please provide productImage" })
        }

        // if(!validation.isValidImageType(productImage)){
        //     return res.status(400).send({status:false, msg:" Only images can be uploaded (jpeg/jpg/png)"})

        // }

        var uploadedProfilePictureUrl = await AWS.uploadFile(productImage[0]);

        if (!validation.checkInputsPresent(availableSizes)) {
            return res.status(400).send({ status: false, msg: "product available sizes are required" })
        }

        if (!validation.validateName(style))
            return res.status(400).send({ status: false, message: "style is invalid", });

        if (availableSizes) {
            const sizeArr = availableSizes
                .split(",")
                .map((x) => x.trim());

            if (Array.isArray(sizeArr)) {
                for (let i = 0; i < sizeArr.length; i++) {
                    if (["S", "XS", "M", "X", "L", "XXL", "XL"].indexOf(sizeArr[i]) == -1)
                        return res.status(400).send({ status: false, message: "Please Enter valid sizes, it should include only sizes from  (S,XS,M,X,L,XXL,XL) " })
                }
            }

            availableSizes = availableSizes.concat(sizeArr.filter((item) => availableSizes.indexOf(item) < 0))

        }
        // if (isFreeShipping) {

        //     if ((isFreeShipping !== false) || (isFreeShipping !== true))
        //         return res.status(400).send({ status: false, message: "isFreeShipping must be either true or false", });
        // }

        if (!validation.isValidinstallments(installments))
            return res.status(400).send({ status: false, message: "installments is invalid", });

        const productData = {
            title: title,
            description: description,
            price: price,
            currencyId: currencyId,
            currencyFormat: currencyFormat,
            isFreeShipping: isFreeShipping ? isFreeShipping : false,
            productImage: uploadedProfilePictureUrl,
            style: style,
            availableSizes: availableSizes,
            installments: installments,
            deletedAt: null,
            isDeleted: false,
        };


        let result = await productModel.create(productData)

        res.status(201).send({ status: true, msg: result })


    } catch (error) {
        res.status(500).send({ status: false, error: error.message })
    }
}


//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>getProduct>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>//

const getProduct = async function (req, res) {
  try {
    let filter = req.query;
    let filterCondition = { isDeleted: false };

    const { name, availableSizes,priceGreaterThan, priceLessThan,priceSort } =filter;

    if (name) {
      filterCondition.title = name;}

    if (availableSizes) {
      const sizeArr = availableSizes
        .split(",")
        .map((x) => x.trim());

      filterCondition.availableSizes = { $all: sizeArr };
    }

    if (filter.priceGreaterThan && filter.priceLessThan) {
      filterCondition.price = { $gt: Number(priceGreaterThan), $lt: Number(priceLessThan) }
    }
    else if (filter.priceGreaterThan) {
      
      filterCondition.price = { $gt: Number(priceGreaterThan) }
    } else if (filter.priceLessThan) {
      filterCondition.price = { $lt: Number(priceLessThan) }
    }
    let requestedData = await productModel.find({ ...filterCondition }).sort({ price: priceSort });

    if (!validation.checkInputsPresent(requestedData)) {
      return res.status(400).send({ status: false, message: "No data Found!!!" });
    }

    return res
      .status(200).send({status: true, message: "Success",count: requestedData.length,data: requestedData});
  } catch (err) {
    return res.status(500).send({ status: false, error: err.message})}
  }
    

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>getProductbyId>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>//

 const getProductsById = async function (req, res) {

        try {
            // request productId from path path param

            const productId = req.params.productId;

            // check productId is valid or objectId or not 
            if (!validation.validateId(productId)) return res.status(400).send({ status: false, message: "Invalid productId" })

            //database call for find product from product model
            const findProductsData = await productModel.findById({ _id: productId, isDeleted: false });

            // if product not found in database
            if (!findProductsData) return res.status(404).send({ status: false, msg: "No product Details available with this productId" });

            // if successfully find product data ,,,,then response 
            return res.status(200).send({ status: true, msg: "Product details", data: findProductsData });

        } catch (error) {
            return res.status(500).send({ status: false, msg: error.message });
        }
    }

    //>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>updateProduct>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>//

    const updateProduct = async function (req, res) {
        try {
            let requestBody = req.body;

            productIdFromParam = req.params.productId

            if (!(validation.validateId(productIdFromParam))) {
                return res.status(400).send({ status: false, message: " Please!! input a valid Id :(" });
            }

            let productById = await productModel.findById(productIdFromParam)

            if (!productById) {
                return res.status(404).send({ status: false, message: " product not found!!!" })
            }

            let filter = { isDeleted: false };

            let { title,
                description,
                price,
                currencyId,
                currencyFormat,
                isFreeShipping,
                style,
                availableSizes,
                installments } = requestBody;

            if (req.files) {
                let productImage = req.files

                if (productImage != undefined && productImage.length > 0) {

                    var updatedProductPictureUrl = await AWS.uploadFile(productImage[0]);

                }

                filter.productImage = updatedProductPictureUrl;
            }

            if (title) {

                if (!validation.validateName(title.trim()))
                    return res.status(400).send({ status: false, message: "title must be a string", });
                const verifytitle = await productModel.findOne({ title: title })
                if (verifytitle) {
                    return res.status(400).send({ status: false, msg: "Cannot Update,title is already exist" })
                }

                filter.title = title
            }

            if (description) {

                if (!validation.validateName(description.trim()))
                    return res.status(400).send({ status: false, message: "description must be a string", });

                filter.description = description
            }

            if (price) {

                if (!validation.isValidPrice(price))
                    return res.status(400).send({ status: false, message: "Price is invalid", });

                filter.price = price
            }

            if (currencyId) {

                if (!(/INR/.test(currencyId))) {
                    return res.status(400).send({ status: false, message: " currencyId should be in 'INR' Format" });
                }

                filter.currencyId = currencyId
            }

            if (currencyFormat) {

                if (!(/₹/.test(currencyFormat))) {
                    return res.status(400).send({ status: false, message: "Currency format of product should be in '₹' " });
                }

                filter.currencyFormat = currencyFormat
            }

            if (isFreeShipping) {

                console.log(typeof isFreeShipping)

                if ((isFreeShipping != "false") || (isFreeShipping != "true"))
                    return res.status(400).send({ status: false, message: "isFreeShipping must be either true or false", });

                if (isFreeShipping == "false") {
                    filter.isFreeShipping = (!Boolean(isFreeShipping))

                }
                if (isFreeShipping == "true"); {
                    filter.isFreeShipping = (Boolean(isFreeShipping))
                }
            }

            if (style) {

                if (!validation.validateName(style.trim()))
                    return res.status(400).send({ status: false, message: "style is invalid", });

                filter.style = style
            }

            if (availableSizes) {
                const sizeArr = availableSizes
                    .split(",")
                    .map((x) => x.trim());

                if (Array.isArray(sizeArr)) {
                    for (let i = 0; i < sizeArr.length; i++) {
                        if (["S", "XS", "M", "X", "L", "XXL", "XL"].indexOf(sizeArr[i]) == -1)
                            return res.status(400).send({ status: false, message: "Please Enter valid sizes, it should include only sizes from  (S,XS,M,X,L,XXL,XL) " })
                    }
                }

                filter.availableSizes = availableSizes.concat(sizeArr.filter((item) => availableSizes.indexOf(item) < 0))

            }

            if (installments) {

                if (!validation.isValidinstallments(installments))
                    return res.status(400).send({ status: false, message: "installments is invalid", });

                filter.installments = Number(installments)
            }



            const updatedProduct = await productModel.findByIdAndUpdate({ _id: productIdFromParam }, filter, { new: true })
            return res.status(200).send({ status: true, message: 'Updated Successfully', data: updatedProduct })
        }
        catch (error) {
            return res.status(500).send({ error: error.message })
        }
    }

    //>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>deleteByid>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>//

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

            return res.status(200).send({ status: true, message: "Product deleted Successfully"})


        } catch (err) {
            return res.status(500).send({ status: false, message: err.message })
        }

    }






    module.exports = { createProduct, getProduct, getProductsById, updateProduct, deleteProductById }
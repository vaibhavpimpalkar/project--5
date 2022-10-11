const userModel = require('../models/userModel');
const validation = require('../validator/validation');
const AWS = require('../AWS/aws-sdk.js');
const bcrypt = require('bcrypt');

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>CreateUser>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>//
const createUser = async function (req, res) {
    try {
        const data = req.body;
        if (!validation.checkInputsPresent(data))return res.status(400).send({ status: true, message: "Provide Details for Users" })
        
        let profileImage = req.files;
        if (!validation.checkInputsPresent(data))return res.status(400).send({ status: true, message: "Provide profileImage for Users" })
        
    //-------------------------------using destructuring fetching data from request body------------------------------//
        let { fname, lname, email, phone, password, address } = data;

        if (!validation.checkInputsPresent(fname))return res.status(400).send({ status: false, msg: "name is required" });
        if (!validation.validateName(fname))return res.status(400).send({ status: false, msg: "name is invalid " });
        
        if (!validation.checkInputsPresent(lname)) return res.status(400).send({ status: false, msg: "name is required" });
        if (!validation.validateName(lname)) return res.status(400).send({ status: false, msg: "name is invalid " });

        if (!validation.checkInputsPresent(email)) return res.status(400).send({ status: false, msg: "email required to create new user "});
        if (!validation.validateEmail(email)) return res.status(400).send({ status: false, msg: "invalid email provided" });

        let findEmailId = await userModel.findOne({ email: email });
        if (findEmailId) return res.status(409).send({ status: false, message: "provided email is already used" });

        if (!validation.checkInputsPresent(phone)) return res.status(400).send({ status: false, msg: "PhoneNo. is required to create new user"});
        if (!validation.validateMobileNo(phone)) return res.status(400).send({ status: false, msg: "invalid mobile no provided" });

        let findMobile = await userModel.findOne({ phone: phone });
        if (findMobile) return res.status(409).send({ status: false, message: 'provided PhoneNo. is already used' });

        if (!validation.checkInputsPresent(password)) return res.status(400).send({ status: false, msg: "password required to create new user" });
        if(!validation.isValidPassword(password))return res.status(400).send({status:false,msg:"Invalid Password"})


        // if (address) {
        //     if (!validation.checkInputsPresent(address[shipping][street])){ return res.status(400).send({ status: false, message: "invalid street" }) }
        //     if (!validation.checkInputsPresent(address[shipping][city]) || !validation.validateName(address[shipping][city])) { return res.status(400).send({ status: false, message: "invalid city" }); }
        //     if (! /^\+?([1-9]{1})\)?([0-9]{5})$/.test(address[shipping][pincode]) && !validation.checkInputsPresent(address[shipping][pincode])) { return res.status(400).send({ status: false, message: "invalid pin" }) }

        // }

        // if (address.billing) {
        //     if (!validation.checkInputsPresent(address.billing.street)) { return res.status(400).send({ status: false, message: "invalid street" }) }
        //     if (!validation.checkInputsPresent(address.billing.city) || !validation.validateName(address.billing.city)) { return res.status(400).send({ status: false, message: "invalid city" }); }
        //     if (! /^\+?([1-9]{1})\)?([0-9]{5})$/.test(address.billing.pincode) && !validation.checkInputsPresent(address.billing.pincode)) { return res.status(400).send({ status: false, message: "invalid pin" }) }

        // }
        if (profileImage && profileImage.length > 0) {
            //upload to s3 and get the uploaded link
            // res.send the link back to frontend/postman
            //let uploadedFileURL= await uploadFile( files[0] )
            var uploadedProfilePictureUrl = await AWS.uploadFile(profileImage[0]);
        } else {
            res.status(400).send({ msg: "No file found" });
        }

        //console.log(uploadedProfilePictureUrl);
        // password encryption
        const salt = await bcrypt.genSalt(10);
        encryptedPassword = await bcrypt.hash(password, salt);

        const userData = {
            fname: fname,
            lname: lname,
            email: email,
            profileImage: uploadedProfilePictureUrl,
            phone: phone,
            password: encryptedPassword,
            address: address,
        };
        // registering a new user
        const newUser = await userModel.create(userData);

        res.status(201).send({
            status: true,
            message: "User successfully registered",
            data: newUser,
        });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
};



//////////////////////////Get API//////////////////////////

const getUser = async function (req, res) {
  try {
    const userId = req.params.userId;
    const body = req.body;

    // if (!(validation.isValidobjectId(userId) && validation.isValid(userId))) {
    //   return res
    //     .status(400)
    //     .send({ status: false, msg: "userId is not valid" });
    // }
    // if (validation.isValidBody(body)) {
    //   return res
    //     .status(400)
    //     .send({ status: false, msg: "body should not be empty" });
    // }

    const userData = await userModel.findById({ _id: userId });
    if (userData) {
      return res
        .status(200)
        .send({ status: true, msg: "user profile details", data: userData });
    } else {
      return res
        .status(404)
        .send({ status: false, msg: "userid does not exist" });
    }
  } catch (err) {
    return res.status(500).send({ status: false, msg: err.message });
  }
};





module.exports.createUser = createUser;
module.exports.getUser = getUser;
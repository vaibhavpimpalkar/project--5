const userModel = require('../models/userModel');
const validation = require('../validator/validation');
const AWS = require('../AWS/aws-sdk.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>CreateUser>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>//
const createUser = async function (req, res) {
    try {
        const data = req.body;
        if (!validation.checkInputsPresent(data))return res.status(400).send({ status: true, message: "Provide Details for Users" })
        
        let profileImage = req.files;
        
        
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

        if(!validation.checkInputsPresent(address))return res.status(400).send({status:false,msg:"Provide address details"})

        address = JSON.parse(address);

        if (!validation.checkInputsPresent(address.shipping.street))return res.status(400).send({ status: false, message: "street is required" });
          
        if (!validation.checkInputsPresent(address.shipping.city))return res.status(400).send({ status: false, message: "city is required" });
        
        if (!validation.checkInputsPresent(address.shipping.pincode))return res.status(400).send({ status: false, message: "pincode is required" });
          
        if (!validation.isValidPincode(address.shipping.pincode)) {return res.status(400).send({ status: false, message: "Invalid pincode" });}
        
        if (!validation.checkInputsPresent(address.billing.street))return res.status(400).send({ status: false, message: "street is required" });
          
        if (!validation.checkInputsPresent(address.billing.city))return res.status(400).send({ status: false, message: "city is required" });
        
        if (!validation.checkInputsPresent(address.billing.pincode))return res.status(400).send({ status: false, message: "pincode is required" });
          
        if (!validation.isValidPincode(address.billing.pincode)) {return res.status(400).send({ status: false, message: "Invalid pincode" });}
        
        if (!profileImage || profileImage.length==0)return res.status(400).send({ status: true, message: "Provide profileImage for Users" })

        // if(!validation.isValidImageType(profileImage)){
        //     return res.status(400).send({status:false, msg:" Only images can be uploaded (jpeg/jpg/png)"})
    
        // }
            //upload to s3 and get the uploaded link
            // res.send the link back to frontend/postman
            //let uploadedFileURL= await uploadFile( files[0] )
        
            var uploadedProfilePictureUrl = await AWS.uploadFile(profileImage[0]);

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
        res.status(201).send({ status: true, message: "User successfully registered",data: newUser});
    } catch (error) {
        res.status(500).send({ status:false,error: error.message });
    }
};


//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>userLogin>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>//

const login = async function (req, res) {
    try {

       
        const data = req.body;
        if (!validation.checkInputsPresent(data)) { return res.status(400).send({ status: false, message: "data is required" }); }

        const userEmail = data.email;
        const password = data.password;
        
        if (!validation.checkInputsPresent(userEmail)) { return res.status(400).send({ status: false, message: "Email is required" }) }
        if (!validation.validateEmail(userEmail)) { return res.status(400).send({ status: false, message: "enter a valid email address" }) }

        if (!validation.checkInputsPresent(password)) { return res.status(400).send({ status: false, message: "Password is required" }) }
        if (!validation.isValidPassword(password)) { return res.status(400).send({ status: false, message: "Password should be in right format" }) }
         
        //finding user by given email from userModel 
        const user = await userModel.findOne({ email: userEmail});
        if (!user) { return res.status(401).send({ status: false, message: "no user found " }) }

        // comparing hashed password and login password
        const isPasswordMatching = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordMatching){return res.status(400).send({ status: false, msg: "Incorrect password" });}

        //......................creating a jsonWebToken and sending it to response header and body.....................//

        let token = jwt.sign({
            userId: user._id.toString(),
            iat:Math.floor(Date.now()/1000)
        },
           "group20project5", { expiresIn: "1hr" }
        );

        res.header("Authorization", "Bearer"+ token);
        return res.status(200).send({ status: true, message: "User Login Successfully",userId:user._id,token:token })
    }
    catch (error) {
        console.log(error)
        return res.status(500).send({ message: error.message })
    }
}


//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>getUserDetails>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>//

const getUserProfile = async function (req, res) {
  try {
    const userId = req.params.userId;
    if (!validation.validateId(userId))return res.status(400).send({ status: true, message: "Invalid userId" })

    const userData = await userModel.findById({ _id: userId });
    if (!userData) return res.status(404).send({ status: false, msg: "No User Profile Details available with this userId"});
    return res.status(200).send({ status: true, msg: "User Profile details",data:userData });
  } catch (err) {
    return res.status(500).send({ status: false, msg: err.message });
  }
};

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>UpdateDetails>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>//

const updateUsersProfile = async function (req, res) {
    try {
      let userId = req.params.userId;

     if (!validation.validateId(userId)) {return res.status(400).send({status: false, message: "Invalid userId"});}

      const data = req.body;
      if (!validation.checkInputsPresent(data)) { return res.status(400).send({status: false,message: "Provide data for Updation"});}

     //-------------------------------using destructuring fetching data from request body------------------------------// 
     let filter ={}
     let { fname, lname, email, phone,password,address} = data;

     if(req.files){
        let profileImage = req.files

        if(profileImage!=undefined && profileImage.length>0){
            var updatedProfilePictureUrl =await AWS.uploadFile(profileImage[0]);
        }
        filter.profileImage=updatedProfilePictureUrl;
     }

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

    
        const sameOldPassword = await bcrypt.compare(
            password,
            req.presentUser.password
        );

        if (sameOldPassword ) {return res.status(400).send({ status: false, message: "Cannot update same password" });}

        const salt = await bcrypt.genSalt(10);
        encryptedPassword = await bcrypt.hash(password, salt);

        filter.password = encryptedPassword;
    
     address = JSON.parse(address);

    if (!validation.checkInputsPresent(address.shipping.street))return res.status(400).send({ status: false, message: "street is required" });
      
    if (!validation.checkInputsPresent(address.shipping.city))return res.status(400).send({ status: false, message: "city is required" });
    
    if (!validation.checkInputsPresent(address.shipping.pincode))return res.status(400).send({ status: false, message: "pincode is required" });
      
    if (!validation.isValidPincode(address.shipping.pincode))return res.status(400).send({ status: false, message: "Invalid pincode" });
    
    if (!validation.checkInputsPresent(address.billing.street))return res.status(400).send({ status: false, message: "street is required" });
      
    if (!validation.checkInputsPresent(address.billing.city))return res.status(400).send({ status: false, message: "city is required" });
    
    if (!validation.checkInputsPresent(address.billing.pincode))return res.status(400).send({ status: false, message: "pincode is required" });
      
    if (!validation.isValidPincode(address.billing.pincode)) {return res.status(400).send({ status: false, message: "Invalid pincode" });}
  
      //set keys in filter object

      filter.fname=fname;
      filter.lname=lname;
      filter.email=email;
      filter.phone=phone;
      filter["address.shipping.street"]=address.shipping.street;
      filter["address.shipping.city"]=address.shipping.city;
      filter["address.shipping.pincode"]=address.shipping.pincode;
      filter["address.billing.street"]=address.billing.street;
      filter["address.billing.city"]=address.billing.city;
      filter["address.billing.pincode"]=address.billing.pincode;
     
      let updateData = await userModel.findOneAndUpdate({ _id: userId }, filter, {new: true});
      res.status(200).send({status: true,message: "User profile Updated",data: updateData});
    } catch (err) {
      res.status(500).send({status: false, message: err.message});
    }
};





module.exports = {createUser,getUserProfile,login,updateUsersProfile}
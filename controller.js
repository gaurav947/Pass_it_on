var mongoose = require('mongoose');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));
var register = require('./register_schema');
var jwt = require("jsonwebtoken");
var md5 = require("md5");
var otpGenerator = require('otp-generator')
var colleges = require("./colleges");
var category = require("./category_schema");
var Sub_category = require("./sub_cat_Schema");
var details = require("./details_schema");
var contact = require("./contact_Schema");
var favorite = require("./favorite_schema");
var middleware  = require('./authorized');
var multer = require("multer");
var cors = require('cors');
app.use(cors());
app.use(express.static(__dirname));
const AWS = require('aws-sdk');
const multerS3 = require("multer-s3");
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});
const fileFilter = (req, file, cb) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type, only JPEG and PNG is allowed!"), false);
    }
  };
const upload = multer({
fileFilter,
storage: multerS3({
    acl: "public-read",
    s3,
    bucket: process.env.AWSBucketName,
    metadata: function (req, file, cb) {
    cb(null, { fieldName: "TESTING_METADATA" });
    },
    key: function (req, file, cb) {
    cb(null, Date.now().toString());
    },
}),
});
app.post('/register',function(req,res){
    if((req.body.password).length<6)
    {
        return res.json({
            error:true,
            message:"Password length must be 6 or greater than 6 ",
            status:400
        });
    }
    else if((/^[a-zA-Z0-9]+[@][a-z]+[\.][a-z]{2,3}$/.test(req.body.email))===false)
    {
            return res.json({
                err:true,
                message:"Your email is Invalid...",
                status:400
            });
    }
    else
    { 
        if(req.body.password===req.body.confirm_password)
        {
            Pass = md5(req.body.password)
        }
        else
        {
            return res.json({
                error:true,
                message:"Password is not equal to the confirm_password",
                status:400
            });
        }
        var new_body = {
            name:req.body.name,
            email:req.body.email,
            college:req.body.college,
            yop:req.body.yop,
            roll_number:req.body.roll_number,
            city:req.body.city,
            password:Pass
        }
        register.create(new_body, function(err,result){
            if(result)
            {
                var add={
                    _id:result._id,
                    name:req.body.name,
                    email:req.body.email,
                    college:req.body.college,
                    roll_number:req.body.roll_number,
                }
                jwt.sign(add,'creation',function(err,sucess){
                    if(sucess)
                    {
                        return res.json({
                            sucess:true,
                            token:sucess,
                            message:"Your data is created....",
                            status:200
                        });
                    }
                    else
                    {
                        return res.json({
                            error:true,
                            message:"Problem with jwt...",
                            status:200
                        });
                    }
                });
            }
            else
            {
                return res.status(400).json({
                    error:true,
                    err:err,
                    message:"somthing went wrong in mongo",
                    status:400
                });
            }
        });
    }

});
app.post('/login',function(req,res){
    register.findOne({email:req.body.email},function(err,result){
        if(result)
        {
            var add = {
                _id:result._id,
                name:result.name,
                email:result.email
            }
            if(md5(req.body.password)===result.password)
            {
                jwt.sign(add,'creation',function(t_err,t_sucess){
                    if(t_sucess)
                    {
                        return res.json({
                            sucess:true,
                            token:t_sucess,
                            message:"Login_sucessfully!!....",
                            status:200
                        });
                    }
                    if(t_err)
                    {
                        return res.json({
                            error:true,
                            message:"Problem with jwt...",
                            status:200
                        });
                    }
                });
            }
            else
            {
                return res.json({
                    error:true,
                    message:"login Failed",
                    status:400
                });
            }
        }
        else
        {
            return res.json({
                error:true,
                message:"Email not Found",
                status:400
            });
        }
    }); 
});
app.post('/forget',function(req,res){
    if(req.body.email && !req.body.OTP  && !req.body.New_password && !req.body.verify_new_password)
    {
        console.log("1");
        register.findOne({email:req.body.email},function(err,result){
        if(result) {
            var o = otpGenerator.generate(5, { digits:true ,alphabets :false,upperCase :false,specialChars :false});
            register.updateOne({email:req.body.email},{OTP:o,status:false},function(err,sucess)
            {
                return res.json({
                    sucess:true,
                    details:{
                        email:req.body.email,
                        OTP:o
                    },
                    message:"OTP is generated....",
                    status:200
                });
            });
        }
        else{
                return res.json({
                    error:true,
                    message:"Email is not found",
                    status:400
                });
            }
        });
    }
    else if(req.body.email && req.body.OTP)
    {
        console.log("2");
        register.findOne({email:req.body.email},function(err,sucess){
            if(sucess.OTP === req.body.OTP)
            {
                register.updateOne({email:req.body.email},{status:true},function(err,u1){});
                return res.json({
                    sucess:true,
                    message:"OTP matched....",
                    status:200
                });
            }
            else
            {
                status = 0;
                return res.json({
                    error:true,
                    message:"OTP  not matched....",
                    status:200
                }); 
            }
        });
    }
    else if(req.body.email && req.body.New_password && req.body.verify_new_password)
    {
        console.log("3");
        register.findOne({email:req.body.email},function(err,sucess){
        console.log(sucess.status)
        if(sucess.status=='true')
        {
                if(req.body.New_password === req.body.verify_new_password)
                {
                    register.updateOne({email:req.body.email},{password:md5(req.body.New_password)},function(err,result){
                        if(result)
                        {
                            return res.json({
                                sucess:true,
                                message:"Your PassWord is Sucessfully changed!.....",
                                status:200
                            });
                        }
                        else
                        {
                            return res.json({
                                error:true,
                                message:"something went Wrong...",
                                status:200
                            });
                        }
                    });
                }
                else
                {
                    return res.json({
                        error:true,
                        message:"New Password and verify New password not matched....",
                        status:400
                    });
                }
            }
            else
            {
                return res.json({
                    error:true,
                    message:"something went Wrong...",
                    status:200
                }); 
            }
        });
     
    }
});
app.post('/colleges',function(req,res){
    let colleg = ["Lovely Professional University,hoshiarpur","Chandigarh University,mohali",
    "Dr. B R Ambedkar National Institute of Technology Jalandhar",
    "Chitkara University, Punjab","Thapar Institute of Engineering and Technology,patiala",
    "Guru Nanak Dev University,Amritsar","Baba Farid University of Health Sciences,Faridkot",
    "Indian Institute of Technology Ropar,Rupnagar","Punjab Agricultural University,Ludhiana",
    "Punjab Technical University,Kapurthala","Punjabi University Patiala,Patiala",
    "Indian Institute of Science Education and Research, Mohali",
    "Central University of Punjab,Bathinda",
    "National Institute of Pharmaceutical Education and Research, S.A.S. Nagar	Mohali",
    "Sant Longowal Institute of Engineering and Technology,Sangrur",
    "Maharaja Ranjit Singh Punjab Technical University,Bathinda","Guru Angad Dev Veterinary and Animal Sciences University,Ludhiana",
    "Rajiv Gandhi National University of Law,Patiala","DAV University,Jalandhar","Rayat-Bahra University,Kharar",
    "RIMT University,Mandi Gobindgarh, 	Desh Bhagat University,Mandi Gobindgarh","Sri Guru Granth Sahib World University,Fatehgarh Sahib",
    "GNA University	,Phagwara","Guru Ravidas Ayurved University,Hoshiarpur","Adesh University,Bathinda","Guru Kashi University,Talwandi Sabo",
    "Akal University,Bathinda","Sant Baba Bhag Singh University	,Jalandhar","Sri Guru Ram Das University of Health Sciences,Qila Jiwan Singh"];
    for(let i=0;i<29;i++)
    {
        colleges.create({college:colleg[i]},function(err,result){
            if(i==10)
            {
                return res.json({
                    sucess:true,
                    message:"Colleges are sucessfully stored....",
                    status:200
                });
            }
        });
    }
});
app.post('/category',middleware.isloggedIn,function(req,res){
    category.create(req.body,function(err,done){
        if(done)
        {
            res.json({
                sucess:true,
                message:"Category added sucessfully.....",
                status:200
            });
        }
        else
        {
            res.json({
                error:true,
                message:"Error in catgory..",
                status:400
            });
        }
    });
});
app.post('/sub_category',middleware.isloggedIn,function(req,res){
    Sub_category.create(req.body,function(err,done){
        if(done)
        {
            res.json({
                sucess:true,
                message:"Sub_Category added sucessfully.....",
                status:200
            });
        }
        else
        {
            res.json({
                error:true,
                message:"Error in Sub_catgory..",
                status:400
            });
        }
    });
});
app.post('/details',upload.any(),middleware.isloggedIn,function(req,res){0
    token = req.headers.authorization.split(' ')[1];
    tokenv = jwt.verify(token,'creation');
    var arr = [];
    for(let i =0;i<(req.files.length);i++)
    {
        arr.push(req.files[i].location);
    }
    if(req.body.title && req.body.author 
        && req.body.edition && req.body.university && req.body.description 
        && req.body.quantity && req.body.price && req.body.cat_id && req.body.sub_cat_id)
    {
        var data = {
            images:arr,
            user_id:tokenv._id,
            cat_id:req.body.cat_id,
            sub_cat_id:req.body.sub_cat_id,
            title:req.body.title,
            author:req.body.author,
            edition:req.body.edition,
            university:req.body.university,
            quantity:req.body.quantity,
            description:req.body.description,
            price:req.body.price
        }
        details.create(data,function(err,result){
            if(result)
            {
                return res.json({
                    sucess:true,
                    message:"Your Item is stored on book section...",
                    status:200
                },200)
            }
            if(err)
            {
                return res.json({
                    error:true,
                    message:"Error while storing the item in book..."
                },400)
            }
        })
    }
    else if(req.body.topic && req.body.author 
        && req.body.no_of_pages  && req.body.description 
        && req.body.price && req.body.cat_id && req.body.sub_cat_id)
    {
        var data = {
            images:arr,
            user_id:tokenv._id,
            cat_id:req.body.cat_id,
            sub_cat_id:req.body.sub_cat_id,
            topic:req.body.topic,
            author:req.body.author,
            no_of_pages:req.body.no_of_pages,
            description:req.body.description,
            price:req.body.price
        }
        details.create(data,function(err,result){
            if(result)
            {
                return res.json({
                    sucess:true,
                    message:"Your Item is stored on Notes section...",
                    status:200
                },200)
            }
            if(err)
            {
                return res.json({
                    error:true,
                    message:"Error while storing the item in notes..."
                },400)
            }
        })
    }
    else if(req.body.topic && req.body.author 
        && req.body.no_of_slides  && req.body.description 
        && req.body.price && req.body.cat_id && req.body.sub_cat_id)
    {
        var data = {
            images:arr,
            user_id:tokenv._id,
            cat_id:req.body.cat_id,
            sub_cat_id:req.body.sub_cat_id,
            topic:req.body.topic,
            author:req.body.author,
            no_of_slides:req.body.no_of_slides,
            description:req.body.description,
            price:req.body.price
        }
        details.create(data,function(err,result){
            if(result)
            {
                return res.json({
                    sucess:true,
                    message:"Your Item is stored on presentation section...",
                    status:200
                },200)
            }
            if(err)
            {
                return res.json({
                    error:true,
                    message:"Error while storing the item in presentation..."
                },400)
            }
        })
    }
    else if(req.body.item_name && req.body.description && req.body.quantity && req.body.price && req.body.cat_id && req.body.sub_cat_id)
    {
        var data = {
            images:arr,
            user_id:tokenv._id,
            cat_id:req.body.cat_id,
            sub_cat_id:req.body.sub_cat_id,
            item_name:req.body.item_name,
            quantity:req.body.quantity,
            description:req.body.description,
            price:req.body.price
        }
        details.create(data,function(err,result){
            if(result)
            {
                return res.json({
                    sucess:true,
                    message:"Your Item is stored on Stationary section...",
                    status:200
                },200)
            }
            if(err)
            {
                return res.json({
                    error:true,
                    message:"Error while storing the item in stationary..."
                },400)
            }
        })
    }
    else
    {
        return res.json({
            error:true,
            message:"Please fill up all the blanks"
        },400)
    }
});
app.post('/change_password',middleware.isloggedIn,function(req,res){
    token = req.headers.authorization.split(' ')[1];
    tokenv = jwt.verify(token,'creation');
    register.findOne({_id:tokenv._id},function(err,result){
        if(result.password === md5(req.body.old_password))
        {
            if((req.body.New_password).length>=6)
            {
                if(req.body.New_password === req.body.confirm_password)
                {
                    var a = md5(req.body.New_password);
                    register.updateOne({_id:tokenv._id},{password:a},function(erry,sucess){
                    if(sucess)
                    {
                            return res.json({
                            sucess:true,
                            message:"Your Password is sucessfully changed....",
                            status:200
                            });
                        }
                        if(err)
                        {
                            return res.json({
                                error:true,
                                err:erry,
                                message:"Something went wrong.."
                            });
                        }
                    });
                }
                else
                {
                    return res.json({
                        error:true,
                        message:"New Password and confirm Password not same...",
                        status:400
                    });
                }
            }
            else
            {
                return res.json({
                    error:true,
                    message:"New Password length should be 6 or greater..",
                    status:400
                });
            }
        }
        else
        {
            return res.json({
                    error:true,
                    message:"Old password not Matched....."
                });
        }
    });
});
app.post('/set_Image',upload.any(),middleware.isloggedIn,function(req,res){
    token = req.headers.authorization.split(' ')[1];
    tokenv = jwt.verify(token,'creation');
    register.updateOne({_id:tokenv._id},{image:req.files[0].location},function(err,sucess){
    if(sucess)
    {
        res.json({
            sucess:true,
            message:"sucessfully uploaded....",
            status:200
        });
    }
    if(err)
    {
        res.json({
            error:true,
            err:err,
            message:"Something went wrong..",
            status:400
        });
    }
    });

});
app.get('/view_Profile',middleware.isloggedIn,function(req,res){
    token = req.headers.authorization.split(' ')[1];
    tokenv = jwt.verify(token,'creation');
    register.findOne({_id:tokenv._id},function(err,result){
        if(result)
        {
            return res.json({
                sucess:true,
                message:result.image,
                status:200
            });
        }
        else
        {
            return res.json({
                error:true,
                message:"Something went wrong....",
                status:400
            })
        }
    });
});
app.post('/Edit_profile',middleware.isloggedIn,function(req,res){
    token = req.headers.authorization.split(' ')[1];
    tokenv = jwt.verify(token,'creation');
    register.findOne({_id:tokenv._id},function(err,result){
        if(result)
        {    if(req.body.name && req.body.email && req.body.college && req.body.roll_number && req.body.city )
            {
                if((/^[a-zA-Z0-9]+[@][a-z]+[\.][a-z]{2,3}$/.test(req.body.email))===false)
                {
                    return res.json({
                        error:true,
                        message:"Email is Invalid!..",
                        status:400
                    });
                }
                else
                {    
                    register.updateOne({_id:tokenv._id},{name:req.body.name,email:req.body.email,college:req.body.college,
                    roll_number:req.body.roll_number,city:req.body.city,yop:req.body.yop}, { runValidators: true },function(err,sucess){
                        if(sucess)
                        {
                            res.json({
                                sucess:true,
                                message:"Sucessfully uploaded data...",
                                status:200
                            });
                        }
                        else
                        {
                            res.json({
                                error:true,
                                err:err,
                                message:"Error while uploaded the data..."
                            });
                        }
                    });
                }
            }
        }
        if(err)
        {
            return res.json({
                error:err,
                message:"Something went wrong...",
                status:400
            });
        }
    });
});
app.post('/contact',middleware.isloggedIn,function(req,res){
    token = req.headers.authorization.split(' ')[1];
    tokenv = jwt.verify(token,'creation');
    if((/^[a-zA-Z0-9]+[@][a-z]+[\.][a-z]{2,3}$/.test(req.body.email))===false)
    {
            return res.json({
                err:true,
                message:"Your email is Invalid...",
                status:400
            });
    }
    var r = {
        user_id:ObjectId(tokenv._id),
        email:req.body.email,
        subject:req.body.subject,
        message:req.body.message
    }
    contact.create(r,function(err,result){
        if(result)
        {
            return res.json({
                sucess:true,
                message:"Message send sucessfully...",
                status:200
            });
        }
        if(err)
        {
            return res.json({
                error:true,
                message:"Error while message sending...",
                status:400
            });
        }
    });

});
app.post('/favorite',middleware.isloggedIn,function(req,res){
    token = req.headers.authorization.split(' ')[1];
    tokenv = jwt.verify(token,'creation');
    var r = {
        user_id:req.body.user_id,
        my_id:tokenv._id,
        detail_id:req.body.detail_id,
        like_status:req.body.like_status
    }
    favorite.create(r,function(err,result){
        if(result)
        {
            return res.json({
                sucess:true,
                message:"You liked this item...",
                status:200
            });
        }
        if(err)
        {
            return res.json({
                error:true,
                message:"Error while like....",
                status:400
            });
        }
    });
});
app.get('/get-cat',middleware.isloggedIn,function(req,res){
    category.find({},function(err,result){
        if(result)
        {
            return res.json({
                result:result,
                message:"Sucessfully fetched!!",
                status:200
            });
        }
        if(err)
        {
            return res.json({
                error:true,
                err:err,
                message:"Error occured!!",
            });
        }
    });
});
app.get('/get_colleges',function(req,res){
    colleges.aggregate([
        {
            $sort : { college : 1} 
        }
    ],function(err,sucess){
        if(sucess)
        {
            return res.json({
                sucess:true,
                data:sucess,
                message:"Sucessfull..."
            });
        }
        else
        {
            return res.json({
                error:true,
                err:err,
                message:"error occured...."
            });
        }
    });
});
app.get('/get_profile',middleware.isloggedIn,function(req,res){
    token = req.headers.authorization.split(' ')[1];
    tokenv = jwt.verify(token,'creation');
    register.findOne({_id:tokenv._id},function(err,result){
        if(result)
        {
            var r = {
                name:result.name,
                email:result.email,
                college:result.college,
                roll_number:result.roll_number,
                yop:result.yop,
                city:result.city
            }
            return res.json({
                status:200,
                message:"Getting data sucessfully....",
                result:r
            });
        }
        if(err)
        {
            return res.json({
                error:true,
                message:"Error while getting...",
                status:400
            });
        }
    });
});
app.post('/del-profile',function(req,res){
    token = req.headers.authorization.split(' ')[1];
    tokenv = jwt.verify(token,'creation');
    register.updateOne({_id:tokenv._id},{image:"https://imagepass.s3.ap-south-1.amazonaws.com/default.png"},function(err,result){
        if(result)
        {
            return res.json({
                sucess:true,
                message:"Profile Photo is removed"
            },200)
        }
        if(err)
        {
            return res.json({
                error:true,
                message:"Error while deleting the image"
            },400)
        }
    })
})
app.get('/get_sub/:id',middleware.isloggedIn,function(req,res){
    token = req.headers.authorization.split(' ')[1];
    tokenv = jwt.verify(token,'creation');
    category.aggregate([
        {
            $match:{
                "_id":mongoose.Types.ObjectId(req.params.id)
            }
        },
        
        {
            
            $lookup:{
                from:"sub_categories",
                localField:'_id',
                foreignField:"cat_id",
                as:"user"
            }
        },
        {
            $unwind:"$user"
        },
        {
            $project:{
                "user._id":1,
                "user.name":1
            }
        }
       
    ], function(error, success)
    {
        if(error)
        {
            return res.json({
                error:true,
                message:error.message,
                status:400
            });
        }

        if(success)
        {
            return res.json({
                data:success,
                success:true,
                message:"Operation completed....",
                status:200
            });
        }
    });
});
app.get('/get_detail/:id/:u_id',middleware.isloggedIn,function(req,res){
    token = req.headers.authorization.split(' ')[1];
    tokenv = jwt.verify(token,'creation');
    Sub_category.aggregate([
        {
            $match:{    
                "_id":mongoose.Types.ObjectId(req.params.u_id),
            }
        },
        {
            $lookup:{
                from:"details",
                // localField:"_id",
                // foreignField:"sub_cat_id",               
                let: { subcat: "$_id"},
                pipeline:[
                    { 
                        $match:{ 
                            $expr:{ 
                                $and:[
                                    { $eq: [ "$$subcat","$sub_cat_id"] },
                                    {
                                        $ne:["$user_id",mongoose.Types.ObjectId(tokenv._id)]
                                    }                                    
                                ]
                           }
                        }
                    },
                     {
                        $lookup:{
                            from:"favorites",
                            let: { book: "$_id"},
                            pipeline:[
                                {
                                    $match:{
                                        $expr:{
                                        $and:[
                                            {$eq:["$detail_id","$$book"]},
                                            {$eq:["$my_id",mongoose.Types.ObjectId(tokenv._id)]}

                                        ]
                                    }
                                    }
                                }
                            ],
                            as:"favorites"
                        }
                    },
                    {
                        $addFields:{
                            favorite:{
                                $cond:[{
                                    $gt:[{$size:"$favorites"},0]
                                },
                                1,
                                0]
                            }
                        }
                    }
                ],
                as:"book"
            }
        },
        {
            $project:{
                "book":1,   
            }
        }
    ],function(err,sucess){
        if(sucess)
        {
            return res.json({
                sucess:true,
                my_id:tokenv._id,
                data:sucess,
                message:"Sucessfull..."
            });
        }
        else
        {
            return res.json({
                error:true,
                err:err,
                message:"error occured...."
            });
        }
    });
});
app.get('/get-detail1/:id',middleware.isloggedIn,function(req,res){ 
    token = req.headers.authorization.split(' ')[1];
    tokenv = jwt.verify(token,'creation');
    details.aggregate([
        {
            $match:{
                "_id":mongoose.Types.ObjectId(req.params.id)
            }
        },
        {
            $lookup:{
                from:"favorites",
                let: { book: "$_id"},
                pipeline:[
                    {
                        $match:{
                            $expr:{
                            $and:[
                                {$eq:["$detail_id","$$book"]},
                                {$eq:["$my_id",mongoose.Types.ObjectId(tokenv._id)]}

                            ]
                        }
                        }
                    }
                ],
                as:"favorites"
            }
        },
        {
            $addFields:{
                favorites:{
                    $cond:[{
                        $gt:[{$size:"$favorites"},0]
                    },
                    1,
                    0]
                }
            }
        }

    ],function(err,result){
        console.log(err);
        console.log(result)
        if(result!=null)
        {
            return res.json({
                sucess:true,
                my_id:tokenv._id,
                result:result,
                message:"Detail fetched sucessfully.....",
                status:200

            })
        }
        if(err!=null)
        {
            return res.json({
                error:true,
                message:"Error while fetching data..",
                status:400
            });
        }
    });
});
app.get('/get-favorite',middleware.isloggedIn,function(req,res){
    token = req.headers.authorization.split(' ')[1];
    tokenv = jwt.verify(token,'creation');
    favorite.aggregate([
        {
            $match:{
                my_id:mongoose.Types.ObjectId(tokenv._id),
                like_status:true
            }
        },
        {
            $lookup:{
                from:"details",
                localField:'detail_id',
                foreignField:"_id",
                as:"like"
            }
        }
    ],function(err,result)
    {
        if(result)
        {
            return res.json({
                sucess:true,
                message:result
            },200)
        }
        if(err)
        {
            return res.json({
                eror:true,
                error:err
            },400)
        }
    })
});
app.post('/remove-favorite',middleware.isloggedIn,function(req,res){
    token = req.headers.authorization.split(' ')[1];
    tokenv = jwt.verify(token,'creation');
    favorite.deleteOne({my_id:tokenv._id,detail_id:req.body.detail_id},function(err,result){
        if(result)
        {
            return res.json({
                sucess:true,
                message:"This item removed from favorite list"
            },200);
        }
        if(err)
        {
            return res.json({
                error:err,
                message:"Error while removing from favorite list"
            },400);
        }
    })
})
app.get('/get_Myupload_detail',middleware.isloggedIn,function(req,res){
    token = req.headers.authorization.split(' ')[1];
    tokenv = jwt.verify(token,'creation');
    details.find({user_id:tokenv._id},function(err,result){
        if(result)
        {
            res.json({
                message:"Data fetched successfuly!!",
                res:result,
                status:200
            })
        }
        if(err)
        {
            res.json({
                error:true,
                message:"Error while fetching the data",
                status:400
            })
        }
    })
});
app.post('/del_Myupload-detail',middleware.isloggedIn,function(req,res){
    token = req.headers.authorization.split(' ')[1];
    tokenv = jwt.verify(token,'creation');
    details.deleteOne({user_id:tokenv._id,_id:req.body.details_id},function(err,result){
        if(result)
        {
            favorite.deleteOne({user_id:tokenv._id,detail_id:req.body.detail_id},function(err,result){});
            res.json({
                sucess:true,
                message:"Your upload is sucessfully deleted!",
                status:200
            })
        }
        if(err)
        {
            res.json({
                error:true,
                message:"Operation is failed! try again",
                status:400
            })
        }
    })
})
app.post('/del-Imagedetail1',middleware.isloggedIn,function(req,res){
    details.findOne({_id:req.body.details_id},function(err,result){
        if(result)
        {
            if(result.images[req.body.index])
            {
                for(let j=req.body.index;j<result.images.length;j++)
                {
                    result.images[j] = result.images[j+1];
                }
            }
            result.images.pop();
            details.updateOne({_id:req.body.details_id},{images:result.images},function(e,r){})
             return res.json({
                message:result.images
             },200)               
        }
        if(err)
        {
            return res.json({
                error:true,
                message:"Error while fetching data..",
                status:400
            },400);
        }
    });
    
});
app.post('/add-Imagedetail1',upload.any(),middleware.isloggedIn,function(req,res){
    token  = req.headers.authorization.split(' ')[1];
    tokenv = jwt.verify(token,'creation');
    var arr2 = [];
    for(let i=0;i<(req.files.length);i++)
    {
        arr2.push(req.files[i].location);
    }
    details.findOne({_id:req.body.details_id},function(err,result){
        if(result)
        {
           details.updateOne({_id:req.body.details_id},{images:result.images.concat(arr2)},function(e,r){})
           return res.json({
               sucess:true,
               message:"Added sucessfully!!",
               status:200            
           })
        }
        else
        {
            return res.json({
                error:true,
                message:"Error while adding images",
                status:400
            })
        }        
    })
    
})
app.post('/edit-Imagedetail1',upload.any(),middleware.isloggedIn,function(req,res){
    token = req.headers.authorization.split(' ')[1];
    tokenv = jwt.verify(token,'creation');
    if(req.body.detail_id && req.body.title && req.body.author && req.body.edition && req.body.university &&
         req.body.description && req.body.quantity && req.body.price )
    {
        var data = {
            title:req.body.title,
            author:req.body.author,
            edition:req.body.edition,
            university:req.body.university,
            quantity:req.body.quantity,
            description:req.body.description,
            price:req.body.price
        }
        details.updateOne({_id:req.body.detail_id,user_id:tokenv._id},{$set:data},function(err,result){
            if(result)
            {
                console.log(result);
                return res.json({
                    sucess:true,
                    message:"Your book is sucessfully updated",
                    status:200
                },200)
            }
            if(err)
            {
                return res.json({
                    error:true,
                    message:"Error while updating the Book"
                },400)
            }
        })
    }
    else if(req.body.detail_id && req.body.topic && req.body.author 
        && req.body.no_of_pages  && req.body.description 
        && req.body.price)
    {
        var data = {
            topic:req.body.topic,
            author:req.body.author,
            no_of_pages:req.body.no_of_pages,
            description:req.body.description,
            price:req.body.price
        }
        details.updateOne({_id:req.body.detail_id,user_id:tokenv._id},{$set:data},function(err,result){
            if(result)
            {
                return res.json({
                    sucess:true,
                    message:"Your Notes data is sucessfully updated",
                    status:200
                },200)
            }
            if(err)
            {
                return res.json({
                    error:true,
                    message:"Error while updating the Notes"
                },400)
            }
        })
    }
    else if(req.body.detail_id && req.body.topic && req.body.author 
        && req.body.no_of_slides  && req.body.description 
        && req.body.price )
    {
        var data = {
            topic:req.body.topic,
            author:req.body.author,
            no_of_slides:req.body.no_of_slides,
            description:req.body.description,
            price:req.body.price
        }
        details.updateOne({_id:req.body.detail_id,user_id:tokenv._id},{$set:data},function(err,result){
            if(result)
            {
                return res.json({
                    sucess:true,
                    message:"Your PPT data is sucessfully updated",
                    status:200
                },200)
            }
            if(err)
            {
                return res.json({
                    error:true,
                    message:"Error while updating the PPT"
                },400)
            }
        })
    }
    else if(req.body.detail_id && req.body.description && req.body.quantity && req.body.price )
    {
        var data = {
            quantity:req.body.quantity,
            description:req.body.description,
            price:req.body.price
        }
        details.updateOne({_id:req.body.detail_id,user_id:tokenv._id},{$set:data},function(err,result){
            if(result)
            {
                return res.json({
                    sucess:true,
                    message:"Your Stationary data is sucessfully updated",
                    status:200
                },200)
            }
            if(err)
            {
                return res.json({
                    error:true,
                    message:"Error while updating the stationary data"
                },400)
            }
        })
    }
    else
    {
        return res.json({
            error:true,
            message:"Please fill up all the blanks"
        },400)
    }
    
})
const PORT = process.env.PORT || 8085
app.listen(PORT,function(){
    console.log("8085 is activated.......")
});
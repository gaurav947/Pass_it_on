var mongoose = require('mongoose');
const DB_URL = 'mongodb+srv://sun_user_23:sun_user_23@cluster0.cu4zq.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';

mongoose.connect(DB_URL,{useNewUrlParser:true,useUnifiedTopology:true})
.then(()=>console.log("Database Created of Pay_it_on in details Schema"))
.catch((err)=>console.log(err));

var detail_schema = new mongoose.Schema({
    cat_id: {type:mongoose.Types.ObjectId,ref:"categories",required:true},
    sub_cat_id:{type:mongoose.Types.ObjectId,ref:"sub_categories",required:true},
    user_id:{type:mongoose.Types.ObjectId,ref:"register",required:true},
    images:{type:Array},
    title:{type:String},
    topic:{type:String},
    author:{type:String},
    edition:{type:String},
    university:{type:String},                                                                                                                                                                                                                                     
    description:{type:String,required:true},
    quantity:{type:Number},
    item_name:{type:String},
    no_of_pages:{type:Number},
    no_of_slides:{type:Number},
    price:{type:Number,required:true},
});

module.exports = mongoose.model("details",detail_schema);
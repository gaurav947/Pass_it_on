var mongoose = require('mongoose');
const DB_URL = 'mongodb+srv://sun_user_23:sun_user_23@cluster0.cu4zq.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';

mongoose.connect(DB_URL,{useNewUrlParser:true,useUnifiedTopology:true})
.then(()=>console.log("Database Created of Pay_it_on in sub_category_schema"))
.catch((err)=>console.log(err));

var sub_cat_schema = new mongoose.Schema({
    cat_id: {type:mongoose.Types.ObjectId,ref:"categories"},
    name:String,
    created_at:{type:Date,default:Date.now}
});

module.exports = mongoose.model("sub_categories",sub_cat_schema);
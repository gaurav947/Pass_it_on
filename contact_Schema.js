var mongoose = require('mongoose');
const DB_URL = 'mongodb+srv://sun_user_23:sun_user_23@cluster0.cu4zq.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';

mongoose.connect(DB_URL,{useNewUrlParser:true,useUnifiedTopology:true})
.then(()=>console.log('Database initialize from contact-us'))
.catch((err)=>console.log(err));

var contact_schema = new mongoose.Schema({
    user_id:{type:mongoose.Types.ObjectId,ref:"register"},
    email:{type:String},
    subject:{type:String,required:true},
    message:{type:String,required:true}
});

module.exports = mongoose.model('contact_us',contact_schema);
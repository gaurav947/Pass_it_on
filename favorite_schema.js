var mongoose = require('mongoose');
const DB_URL = 'mongodb+srv://sun_user_23:sun_user_23@cluster0.cu4zq.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';

mongoose.connect(DB_URL,{useNewUrlParser:true,useUnifiedTopology:true})
.then(()=>console.log('Database initialize from favorite'))
.catch((err)=>console.log(err));

var favorite_schema = new mongoose.Schema({
    user_id:{type:mongoose.Types.ObjectId,ref:"register"},
    my_id:{type:mongoose.Types.ObjectId,ref:"register"},
    detail_id:{type:mongoose.Types.ObjectId,ref:"details"},
    like_status:{type:Boolean,enum:[true,false]}
});

module.exports = mongoose.model('favorite',favorite_schema);
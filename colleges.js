var mongoose = require('mongoose');
const DB_URL = 'mongodb+srv://sun_user_23:sun_user_23@cluster0.cu4zq.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';
mongoose.connect(DB_URL,{useNewUrlParser:true,useUnifiedTopology:true})
.then(()=>console.log("Database Created of Pay_it_on in colleges"))
.catch((err)=>console.log(err));

var colleges_schema = new mongoose.Schema({
    college:String
});
module.exports = mongoose.model("college",colleges_schema);
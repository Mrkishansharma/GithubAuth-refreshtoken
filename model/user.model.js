const mongoose = require('mongoose')

const userSchema = mongoose.Schema({
    Email:{type:String,required:true,unique:true},
    Password:{type:String},
    Name:{type:String, required:true}
},{versionKey:false})


const UserModel = mongoose.model("user", userSchema)


module.exports = {
    UserModel
}
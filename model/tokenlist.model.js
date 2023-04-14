const mongoose = require('mongoose')

const tokenSchema = mongoose.Schema({
    refreshtoken:{type:String,required:true,unique:true},
    token:{type:String, required:true},
},{versionKey:false})


const TokenlistModel = mongoose.model("tokenlist", tokenSchema)


module.exports = {
    TokenlistModel
}
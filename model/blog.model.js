const mongoose = require('mongoose')

const blogSchema = mongoose.Schema({

    AuthorID:{type:String,required:true},
    Title:{type:String,required:true},
    Description:{type:String,required:true}

},

    {versionKey:false}

)


const BlogModel = mongoose.model("blog",blogSchema);

module.exports = {
    BlogModel
}
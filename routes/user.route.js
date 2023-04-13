const {Router} = require('express')
const userRouter = Router()

const { Auth } = require('../middleware/auth');
const {UserModel} = require('../model/user.model')
const { BlogModel } = require('../model/blog.model')

const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const {blacklist, tokenlist} = require('../store');


userRouter.post("/user/register", async (req,res)=>{

    const {Email , Name , Password} = req.body;

    if(!Email || !Name || !Password){
        return res.status(400).send({
            "msg":"Please provide all details"
        })
    }

    try {
        const isVerify = await UserModel.aggregate([{$match:{Email:Email}}])

        if(isVerify.length){
            return res.status(400).send({
                "error":"User Already exists."
            })
        }
        
        bcrypt.hash(Password , 5 , async (err,hash)=>{
            if(err){
                return res.status(400).send({
                    "msg":"Something went wrong"
                })
            }

            const user = new UserModel({Email,Password:hash,Name})

            await user.save()

            return res.status(200).send({
                "msg":"New user registration Successfully done.",
                "User":user
            })

        })

    } catch (error) {
        return res.status(400).send({
            "error":error.message
        })
    }



})


userRouter.post("/user/login", async (req,res)=>{

    const {Email,Password} = req.body;

   try {
    
    const verifyuser = await UserModel.aggregate([{$match:{Email:Email}}])


    if(verifyuser.length==0){
        return res.status(400).send({
            "msg":"User doesn't exists."
        })
    }


    bcrypt.compare(Password , verifyuser[0].Password ,  async (err , result)=>{
        console.log(err)
        if(!result){
            return res.status(400).send({
                "msg":"Invalid Password!"
            })
        }
        
        const tokenhai = jwt.sign({UserID:verifyuser[0]._id} , process.env.accessToken, {expiresIn:'60m'})
        
        const refreshtokenhai = jwt.sign({UserID:verifyuser[0]._id} , process.env.refreshToken , {expiresIn:'240m'})

        const response = {
            "msg":"Login Successfull",
            "token":tokenhai,
            "refreshtoken":refreshtokenhai
        }

        tokenlist[refreshtokenhai] = response

        return res.status(200).send(response)

    })


   } catch (error) {
        return res.status(400).send({
            "error":error.message
        })
   }

})


userRouter.get("/user/logout", async (req,res)=>{

    const authheader = req.headers.authorization;

    if(!authheader){
        return res.status(404).send({
            "msg":"token not found"
        })
    }

    const token = authheader.split(' ')[1];

    if(token){

        blacklist.push(token)

        return res.status(400).send({
            "msg":"Logout Successfully."
        })
    }



})



// protected routes


userRouter.post("/blog/add" , Auth , async (req,res)=>{

    const {Title , Description } = req.body;
    

    const AuthorID = req.body.UserID;

    try {
        
        const blog = new BlogModel({AuthorID,Title,Description})

        await blog.save()

        return res.status(200).send(blog)


    } catch (error) {
        return res.status(400).send({
            "error":error.message
        })
    }


})




userRouter.get("/blog/get", Auth , async(req,res)=>{

    const {UserID} = req.body;

    try {

        const blogs = await BlogModel.aggregate([{$match:{"AuthorID":UserID}}])

        return res.status(200).send(blogs)

    }catch (error) {

        return res.status(400).send({

            "error":error.message
        })
    }

})




module.exports = {
    userRouter
}
const express = require('express')

const { connection } = require('./db')

const { userRouter } = require('./routes/user.route')
const { UserModel } = require('./model/user.model')

const jwt = require('jsonwebtoken')

const {tokenlist} = require('./store')

const client_id = "f47e15b27ee48b08f05e"

const client_secret = "86547e24a7b62befc98215f749a2eac955573764"


require('dotenv').config()

const app = express()

app.use(express.json())

app.get("/", (req,res)=>{
    res.send("HOME PAGE")
})


app.use("/", userRouter)





app.get("/auth/github", async (req,res)=>{

    const {code} = req.query;
    console.log(code)

    let Access_token = '';
    let token;

    // making request to get access-token

    Access_token =await  fetch(`https://github.com/login/oauth/access_token`,{
        method:'POST',
        headers:{
            Accept:'application/json',
            'Content-type':'application/json'
        },
        body:JSON.stringify({
            client_id:client_id,
            client_secret:client_secret,
            code:code
        })
    })

    Access_token = await Access_token.json()

    
    token = fetchuser(Access_token)

    token = await token

    res.send({"token hai ye":token})
})



app.get("/githubLogin", (req,res)=>{
    console.log(__dirname)
    res.sendFile(__dirname+"/index.html")
})



async function fetchuser(Access_token){

    console.log("---> token mila user lane ka ",Access_token.access_token)

    // fetching user details from github

    let user = await fetch(`https://api.github.com/user`,{
        method:'GET',
        headers:{
            'Content-type':'application/json',
            'Authorization': `bearer ${Access_token.access_token}`
        }
    })
    user = await user.json()

    // console.log(user);
    

    let userEmail = await fetch(`https://api.github.com/user/emails`,{
        method:'GET',
        headers:{
            'Content-type':'application/json',
            'Authorization': `bearer ${Access_token.access_token}`
        }
    })
    userEmail = await userEmail.json()

    // console.log(userEmail);

    const token = registerGithubUser(user?.name, userEmail[0]?.email)
    return token
}

async function registerGithubUser(Name,Email){

    const isPresent = await UserModel.findOne({Email})
    let user;
    if(!isPresent){
        user = new UserModel({Name,Email})
    
        await user.save()
    }else{
        user = isPresent
    }



    const tokenhai = jwt.sign({UserID:user._id} , process.env.accessToken, {expiresIn:'60m'})
        
    const refreshtokenhai = jwt.sign({UserID:user._id} , process.env.refreshToken , {expiresIn:'240m'} )

    const response = {
        "msg":"Login Successfull",
        "token":tokenhai,
        "refreshtoken":refreshtokenhai
    }

    tokenlist[refreshtokenhai] = response

    return response
    
}









app.all("*", (req,res)=>{
    res.status(404).send({
        "msg":"Error 404! Invalid URL"
    })
})


app.listen(process.env.port , async ()=>{

    try {
    
        await connection
        console.log('mongo connected');

    } 
    
    catch (error) {
        console.log(error);
    }
    console.log("server is runnning..");
})


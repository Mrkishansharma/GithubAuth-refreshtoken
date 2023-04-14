const express = require('express')

const { connection } = require('./db')

const { userRouter } = require('./routes/user.route')

const { UserModel } = require('./model/user.model')

const jwt = require('jsonwebtoken')

const { TokenlistModel } = require('./model/tokenlist.model')

require('dotenv').config()




const app = express()

app.use(express.json())




app.get("/", (req,res)=>{
    res.send("HOME PAGE")
})



app.use("/", userRouter)





app.get("/auth/github", async (req,res)=>{

    const {code} = req.query;

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
            client_id : process.env.client_id,
            client_secret : process.env.client_secret,
            code : code
        })
    })

    Access_token = await Access_token.json()

    
    token = await fetchuser(Access_token)

    res.send(token)

})



app.get("/githubLogin", (req,res)=>{

    res.sendFile(__dirname+"/index.html");

})



async function fetchuser(Access_token){

    // fetching user details from github

    let user = await fetch(`https://api.github.com/user`,{
        method:'GET',
        headers:{
            'Content-type':'application/json',
            'Authorization': `bearer ${Access_token.access_token}`
        }
    })

    user = await user.json()
    

    let userEmail = await fetch(`https://api.github.com/user/emails`,{
        method:'GET',
        headers:{
            'Content-type':'application/json',
            'Authorization': `bearer ${Access_token.access_token}`
        }
    })

    userEmail = await userEmail.json()


    const token = registerGithubUser(user?.name, userEmail[0]?.email);

    return token

}

async function registerGithubUser(Name,Email){

    const isPresent = await UserModel.findOne({Email});

    let user;

    if(!isPresent){

        user = new UserModel({Name,Email})
    
        await user.save()

    } else {
        user = isPresent
    }



    const tokenhai = jwt.sign({UserID:user._id} , process.env.accessToken, {expiresIn:'100s'})
        
    const refreshtokenhai = jwt.sign({UserID:user._id} , process.env.refreshToken , {expiresIn:'200s'} )

    const response = {
        "msg":"Login Successfull",
        "token":tokenhai,
        "refreshtoken":refreshtokenhai
    }

    try {

        const tokenlistsave = new TokenlistModel({
            refreshtoken:refreshtokenhai,
            token:tokenhai
        });

        await tokenlistsave.save();

    } catch (error) {

        console.log(error);

    }

    return response
    
}









app.all("*", (req,res)=>{
    res.status(404).send({
        "msg":"Error 404! Invalid URL"
    })
})


app.listen(process.env.port , async ()=>{

    try {
    
        await connection;

        console.log('mongo connected');

    } 
    
    catch (error) {

        console.log(error);

    }
    
    console.log("server is runnning..");
})


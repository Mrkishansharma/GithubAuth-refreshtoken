
const jwt = require('jsonwebtoken')

require('dotenv').config()



const { TokenlistModel } = require('../model/tokenlist.model');

const { BlackListModel } = require('../model/blacklist.model');




const Auth = async (req, res, next) => {

    const authheader = req.headers.authorization;

    const refreshheader = req.headers.refreshtoken;

    if (!authheader || !refreshheader) {

        return res.status(404).send({
            "msg": "Invalid token or token isn't passed."
        });

    }

    const token = authheader.split(' ')[1];

    const refreshtoken = refreshheader.split(' ')[1];




    if (token) {

        try {
            
            const blacklistedtoken = await BlackListModel.findOne({Token:token}).count()

            if(blacklistedtoken){
                
                return res.status(400).send({

                    "msg":"Login Required....!!"
    
                })
            }

        } 
        
        catch (error) {

            return res.status(400).send({
                "msg":error.message
            });

        }





        try {

            const decoded = jwt.verify(token, process.env.accessToken);

            if (decoded) {

                req.body.UserID = decoded.UserID;

                next()

            }

        } catch (error) {

            const [token, UserID]  =  await GenerateAccessToken(refreshtoken)

            if (token) {

                req.headers.authorization = `Bearer ${token}`

                req.body.UserID = UserID;

                next()

            } else {

                return res.status(403).send({
                    "msg": "Authorization Failed.Login required."
                });

            }
        }
    } else {

        res.status(400).send({
            "msg": "Kindly Login First"
        });

    }
}






async function GenerateAccessToken(refreshtoken) {

    try {

        const decoded = jwt.verify(refreshtoken, process.env.refreshToken);

        const tokenlist = await TokenlistModel.findOne({refreshtoken:refreshtoken});


        if (decoded) {

            try {

                const decoded1 = jwt.verify(tokenlist.token, process.env.accessToken);

                if(decoded1){

                    return [tokenlist.token , decoded.UserID];

                }

            }catch (error) {

                const token = jwt.sign({ UserID: decoded.UserID }, process.env.accessToken, { expiresIn: '100s' })

                await TokenlistModel.findByIdAndUpdate({_id:tokenlist._id}, {token});


                return [token , decoded.UserID];   

            }
        }
    } catch (error) {

        await TokenlistModel.findOneAndDelete( { refreshtoken : refreshtoken } );

        return [];
    }
}



module.exports = {
    Auth
}




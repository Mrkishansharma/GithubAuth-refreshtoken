
const jwt = require('jsonwebtoken')

require('dotenv').config()

const { tokenlist, blacklist} = require('../store');




const Auth = async (req, res, next) => {

    const authheader = req.headers.authorization;
    const refreshheader = req.headers.refreshtoken;

    if (!authheader || !refreshheader) {
        return res.status(404).send({
            "msg": "Invalid token or token isn't passed."
        })
    }

    const token = authheader.split(' ')[1];
    const refreshtoken = refreshheader.split(' ')[1];

    if (token) {
        if(blacklist.includes(token)){
            return res.status(400).send({
                "msg":"Login Required....!!"
            })
        }
        try {
            const decoded = jwt.verify(token, process.env.accessToken);
            if (decoded) {
                req.body.UserID = decoded.UserID;
                next()
            }
        }
        catch (error) {
            const [token, UserID] = GenerateAccessToken(refreshtoken)
            if (token) {
                req.headers.authorization = `Bearer ${token}`
                req.body.UserID = UserID;
                next()
            }
            else {
                return res.status(403).send({
                    "msg": "Authorization Failed.Login required."
                })
            }
        }
    }
    else {
        res.status(400).send({
            "msg": "Kindly Login First"
        })
    }
}

function GenerateAccessToken(refreshtoken) {
    try {
        const decoded = jwt.verify(refreshtoken, process.env.refreshToken);
        if (decoded) {
            try {
                const decoded1 = jwt.verify(tokenlist[refreshtoken]["token"], process.env.accessToken);
                if(decoded1){
                    return [tokenlist[refreshtoken]["token"] , decoded.UserID]
                }
            }catch (error) {
                const token = jwt.sign({ UserID: decoded.UserID }, process.env.accessToken, { expiresIn: '60m' })
                tokenlist[refreshtoken]["token"] = token
                return [token , decoded.UserID];   
            }
        }
    } catch (error) {
        return [];
    }
}



module.exports = {
    Auth
}




const jwt = require("jsonwebtoken")
const User = require("../models/User")


const userAuth = async (req, res, next) => {
    try {
        const {token} = req.cookies;
        console.log(token);
        if (!token) {
            res.status(401).error("Please login");
        }
        const {userId} = jwt.verify(token, process.env.SECRET_KEY);
        const user = await User.findOne({_id: userId});
        if (!user) {
            throw new Error("something went wrong");
        } else {
            req.user = user;
            next();
        }

    } catch(err) {
        res.json({"error" : err.message});
    }
}

module.exports = userAuth;
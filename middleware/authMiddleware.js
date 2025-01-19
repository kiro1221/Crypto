const jwt = require('jsonwebtoken');
const User = require('../Models/user');

const secret = process.env.JWT_SECRET 

const requireAuth = (req, res, next) => {
    const token = req.cookies.jwt;
    if (token) {
        jwt.verify(token, secret, (err, decodedToken) => {
            if (err) {
                console.log(err.message);
                res.status(401).json({ message: "Unauthorized" });
            } else {
                req.user = { id: decodedToken.id };
                next();
            }
        });
    } else {
        res.status(401).json({ message: "Unauthorized" });
    }
};

const checkUser = (req, res, next) => {
    const token = req.cookies.jwt;
    if (token) {
        jwt.verify(token, secret, async (err, decodedToken) => {
            if (err) {
                res.locals.user = null;
                next();
            } else {
                let user = await User.findById(decodedToken.id);
                res.locals.user = user;
                next();
            }
        });
    } else {
        res.locals.user = null;
        next();
    }
};

module.exports = { checkUser, requireAuth };

const checkAuth = (req,res,next)=>{
    const user = req.session.user;

    if(user){
        return next();
    }

     res.redirect('/');

}

module.exports = checkAuth
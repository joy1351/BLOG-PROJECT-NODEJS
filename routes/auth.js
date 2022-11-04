const express = require("express");
const router = express.Router();

const User = require("../models/user");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");

router.get("/login", (req,res)=>{
    res.render("auth/login", {error: ""});
})
router.get("/register", (req,res)=>{
    res.render("auth/register", {error: ""});
})

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.render("auth/login", { error: "Please enter all fields" });
  }

  // server not shared

  // checking if user exists or not
  const oldUser = await User.findOne({ email });

  // if user doest not exists
  if (!oldUser)
  return res.render("auth/login", {error: "Invalid Email or Password!",
    success_msg: ""
});

  // matching password with database
  const passwordMatch = await bcryptjs.compare(password, oldUser.password);

  // if passwords donot match
  if (!passwordMatch)
  return res.render("auth/login", {error: "Invalid Email or Password!", success_msg: ""});

  const token = jwt.sign(
    { email: oldUser.email, id: oldUser._id },
    "sdjlkajsdlkaslk@fkdkl$k#45235332",
    {
      expiresIn: "1d",
    }   
  );

  // update user last login
  try {
    User.updateOne(
      { _id: oldUser._id },
      {
        $set: {
          lastLoggedIn: Date.now().toString(),
        },
      },
      (err, result) => {
        if (err)
          return res.render("auth/login", {
            error: "Something went wrong! Please try again later",
          });

        res.cookie("jwt", token, {
          httpOnly: true,
          maxAge: 24 * 60 * 60 * 1000,
        });
        
        // set user in express session 
        req.session.user = {
          email: oldUser.email,
          id: oldUser._id,
          name: oldUser.name,
        };
        // add flash message 
        req.flash("success_msg", "Logged in successfully!");
        res.redirect("/");
      }
    );
  } catch (error) {
    res.render("auth/login", {error: "Invalid Email or Password!", success_msg: ""});
  }
});

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!email || !password || !name) {
    return res.render("auth/register", { error: "Please enter all fields" });
  }
  if (
    !/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
      email.toLowerCase()
    )
  ) {
    return res.render("auth/register", { error: "Please enter a valid email" });
  }
  if (password.length < 8) {
    return res.render("auth/register", {
      error: "Password must be atleast 8 characters long",
    });
  }
  if (
    !/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/.test(password)
  ) {
    return res.render("auth/register", {
      error:"Password must contain atleast one special character and one number",
    });
  }

  // checking if email is alredy present or not
  const oldUser = await User.findOne({ email });

  if (oldUser) {
    return res.render("auth/register", {
      error: "User already exists! Please login",
    });
  }

  // hashing password
  const hashPass = await bcryptjs.hash(password, 12);

  // creating new user
  const newUser = new User({
    name,
    email,
    password: hashPass,
  });

  await newUser.save();

  // flash message 
  req.flash("success_msg", "You are now registered and can log in");
  res.redirect("/auth/login");
});

router.get("/logout", (req, res) => {
  res.clearCookie("jwt"); 
  req.flash("success_msg", "Logged out successfully!");
  req.session.user = null;

  res.redirect("/");
});

module.exports = router;
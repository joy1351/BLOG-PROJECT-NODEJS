const express = require("express");
const mongoose = require("mongoose");
const Article = require("./models/article");
const articleRouter = require("./routes/articles");
const methodOverride = require("method-override");
const bodyParser = require("body-parser");
const flash = require("connect-flash");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const app = express();

mongoose.connect("mongodb://127.0.0.1:27017/blog");

app.set("view engine", "ejs");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(methodOverride("_method"));

app.use(cookieParser("keyboard cat"));

app.use(express.static(__dirname + "/public"));

app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

app.use(flash());

app.use(function (req, res, next) {
  res.locals.message = req.flash();
  res.locals.user = req.session.user;
  next();
});

app.get("/", async (req, res) => {
  const articles = await Article.find({})
    .populate("user")
    .sort({ createdAt: "desc" });
  res.render("articles/index", { articles: articles });
});

app.use("/articles", articleRouter);
app.use("/auth", require("./routes/auth"));

app.listen(3000, () => console.log("server is running"));

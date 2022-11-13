const express = require("express");
const Article = require("./../models/article");
const router = express.Router();
const checkAuth = require("../middlewares/checkAuth");

router.get("/new", checkAuth, (req, res) => {
  res.render("articles/new", { article: new Article() });
});

router.get("/edit/:id", checkAuth, async (req, res) => {
  const article = await Article.findById(req.params.id).populate("user");
  if (article.user._id == req.session.user.id) {
    res.render("articles/edit", { article: article });
  } else {
    res.redirect(`/articles/${article.slug}`);
  }
});

router.get("/:slug", async (req, res) => {
  const article = await Article.findOne({ slug: req.params.slug }).populate(
    "user"
  );
  if (article == null) res.redirect("/");
  res.render("articles/show", { article: article });
});

router.post(
  "/",
  checkAuth,
  async (req, res, next) => {
    req.article = new Article();
    next();
  },
  saveArticleAndRedirect("new")
);

router.put(
  "/:id",
  checkAuth,
  async (req, res, next) => {
    req.article = await Article.findById(req.params.id).populate("user");
    next();
  },
  saveArticleAndRedirect("edit")
);

router.delete("/:id", checkAuth, async (req, res) => {
  await Article.findByIdAndDelete(req.params.id);
  res.redirect("/");
});

function saveArticleAndRedirect(path) {
  return async (req, res) => {
    let article = req.article;
    article.title = req.body.title;
    article.description = req.body.description;
    article.markdown = req.body.markdown;
    article.user = req.session.user.id;
    try {
      article = await article.save();
      res.redirect(`/articles/${article.slug}`);
    } catch (e) {
      return console.log(e.message);
      res.render(`articles/${path}`, { article: article });
    }
  };
}

module.exports = router;

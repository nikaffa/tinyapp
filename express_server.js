const express = require("express");
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const app = express();
app.use(cookieParser());
const PORT = 8080;

app.set('view engine', 'ejs');
//middleware - logs information
app.use(morgan('dev'));
//instead of bodyparse using express, extended:false means handle only the value from the client and nothing else
app.use(express.urlencoded({ extended: false}));

//returns a string of 6 random alphanumeric characters:
const generateRandomString = () => {
  return Math.random().toString(36).substring(2,8);
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.redirect(`/urls`);
});

//READ all urls
app.get("/urls", (req, res) => {
  console.log('req.param', req.params);
  const templateVars = {
    username: req.cookies["username"],
    urls: urlDatabase
  };
  console.log(templateVars);
  res.render("urls_index", templateVars);
});

//READ a form to submit a new url
app.get("/urls/new", (req, res) => {
  const templateVars = {
    username: req.cookies["username"],
  };
  res.render("urls_new", templateVars);
});

//EDIT create a new shortURL after submission the form, saves it to database and redirects to its page
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL; //shortURL-longURL key-value pair are saved to the urlDatabase
  res.redirect(`/urls/${shortURL}`);
});

//EDIT logging in
app.post("/login", (req, res) => {
  //get info from req.body
  const username = req.body;
  console.log('username', username);
  //set a cookie named username to the value submitted in the login form
  res.cookie("username", username);
  res.redirect("/urls");
});

//READ a new created shortURL after submission the NewURL form
app.get("/urls/:shortURL", (req, res) => {
  console.log('req.param', req.params);
  const templateVars = {
    username: req.cookies["username"],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL]
  };
  res.render("urls_show", templateVars);
  //res.redirect("/urls");
});

//TODO: EDIT a single URL - what's after submission?
app.post("/urls/:shortURL", (req,res) => {
  const shortURL = req.params.shortURL;
  urlDatabase[shortURL] = req.body.longURL; //updates in the database
  res.redirect(shortURL); // redirects to the urls_show page
  //res.redirect("/urls"); //TODO redirect after updating
});

//DELETE a single URL
app.post("/urls/:shortURL/delete", (req,res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL]; //delete the property in the database obj
  res.redirect("/urls");
});

//TODO: u/undefined
app.get("/u/:shortURL", (req, res) => {
  console.log('req.param', req.params);
  const longURL = urlDatabase[req.params.shortURL];
  console.log('longURL: ', longURL);
  res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

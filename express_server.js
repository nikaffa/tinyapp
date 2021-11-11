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

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//returns a string of 6 random alphanumeric characters:
const generateRandomString = () => {
  return Math.random().toString(36).substring(2,8);
};

const checkEmail = (email, password) => {
  if (!email.length || !password.length) {
    return true;
  }
  for (let user in users) {
    if (email === users[user].email) {
      return true;
    }
  }
  return false;
};


app.get("/", (req, res) => {
  res.redirect(`/register`);
});

//READ registration form
app.get("/register", (req, res) => {
  res.render("register");
});

//EDIT registration form
app.post("/register", (req, res) => {
  //checking errors
  if (checkEmail(req.body.email, req.body.password))  {
    res.statusCode = 404;
    return res.send("Error with email or password");
  }
  const newId = generateRandomString();
  //saving user to database
  users[newId] = {
    id: newId,
    email: req.body.email,
    password: req.body.password
  };
  console.log(users);
  //set a user_id cookie containing the user's newId
  res.cookie("user_id", users[newId].id);
  res.redirect("/urls");
});

//READ all urls
app.get("/urls", (req, res) => {
  //TODO!!! checks value of cookie and don't display database unless logged in
  if (req.cookies["user_id"]) {
    const user = users[req.cookies["user_id"]];
    const templateVars = {
      username: req.cookies["user_id"],
      email: user.email,
      urls: urlDatabase
    };
    res.render("urls_index", templateVars);
  }
  res.redirect("/register");
});

//READ a form to submit a new url
app.get("/urls/new", (req, res) => {
  if (req.cookies["user_id"]) {
    const user = users[req.cookies["user_id"]];
    const templateVars = {
      username: req.cookies["user_id"],
      email: user.email,
    };
    res.render("urls_new", templateVars);
  }
  res.redirect("/register");
});

//EDIT create a new shortURL after submission the form, saves it to database and redirects to its page
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL; //shortURL-longURL key-value pair are saved to the urlDatabase
  res.redirect(`/urls/${shortURL}`);
});

//EDIT logging in
app.post("/login", (req, res) => {
  //get info from req.body
  const username = req.body;
  console.log('username', username);
  //set a cookie named username to the value submitted in the login form
  res.cookie("user_id", username);
  res.redirect("/urls");
});

//EDIT logging out
app.post("/logout", (req, res) => {
  //clear cookie and logout
  res.clearCookie("user_id");
  return res.redirect("/urls");
});

//READ a new created shortURL after submission the NewURL form
app.get("/urls/:shortURL", (req, res) => {
  if (req.cookies["user_id"]) {
    const user = users[req.cookies["user_id"]];
    const templateVars = {
      username: req.cookies["user_id"],
      email: user.email,
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL]
    };
    res.render("urls_show", templateVars);
  //res.redirect("/urls");
  }
  res.redirect(`/register`);
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

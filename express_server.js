const express = require("express");
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');
app.use(morgan('dev')); //middleware - logs info into console
app.use(express.urlencoded({ extended: false})); //instead of bodyParser
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

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
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userId: "userRandomID" },
  "9sm5xK": { longURL: "http://www.google.com", userId: "user2RandomID" },
};

const helperFunction = require("./helpers");
const {
  getUserByEmail,
  urlsForUser,
  generateRandomString
} = helperFunction(urlDatabase, users);

//GET Login page
app.get("/", (req, res) => {
  const userId = req.session.user_id;
  if (userId) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

//GET Registration form
app.get("/register", (req, res) => {
  const userId = req.session.user_id;
  if (!users[userId]) {
    const templateVars = {
      user: null
    };
    res.render("register", templateVars);
  }
  res.redirect("/urls");
});

//POST Registration form - registers a new user
app.post("/register", (req, res) => {
  const email = req.body.email;
  const rawPassword = req.body.password;
  //checking errors
  if (!email || !rawPassword) {
    return res.status(400).send('Empty email or password');
  }
  const user = getUserByEmail(email);
  if (user) {
    return res.status(400).send('Email already registered');
  }
  //saving user to the database
  const id = generateRandomString();
  const password = bcrypt.hashSync(rawPassword, 10); //hashing password
  users[id] = { id, email, password };
  console.log(users);
  // adding a cookie session and redirect to /urls (to log in automatically)
  req.session.user_id = id;
  res.redirect("/urls");
});

//GET Login form
app.get("/login", (req, res) => {
  const userId = req.session.user_id;
  if (users[userId]) {
    res.redirect("/urls");
  } else if (!users[userId]) {
    const templateVars = {
      user: null
    };
    res.render("login", templateVars);
  }
});

//POST Submit Login form
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  //checking errors
  if (!email || !password) {
    return res.status(403).send('Empty email or password');
  }
  const user = getUserByEmail(email);
  if (!user) {
    return res.status(403).send('Email not found');
  }
  //checks if password matches using bcrypt.compareSync
  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(403).send("Password does not match");
  }
  //set the user_id cookie session with that user's id
  req.session.user_id = user.id;
  res.redirect("/urls");
});

//POST Logging out
app.post("/logout", (req, res) => {
  //clear cookie session and logout
  req.session = null;
  return res.redirect("/");
});

//GET Urls page
app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
  //checking errors
  if (!userId) {
    return res.status(403).send("Login first");
  }
  const userUrls = urlsForUser(userId);
  console.log(userUrls);

  const templateVars = {
    user: users[userId],
    urls: userUrls
  };
  res.render("urls_index", templateVars);
});

//EDIT create a new shortURL after submission the form, saves it to database and redirects to its page
app.post("/urls", (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    return res.redirect("/login");
  }
  const shortURL = generateRandomString();
  const data = { longURL: req.body.longURL, userId };
  urlDatabase[shortURL] = data; //shortURL-longURL key-value pair are saved to the urlDatabase
  res.redirect('/urls');
});

//GET Form to submit a new url
app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    return res.redirect("/login");
  }
  const templateVars = {
    user: users[userId]
  };
  res.render("urls_new", templateVars);
});

//GET a new created shortURL after submission the urls/new form
app.get("/urls/:shortURL", (req, res) => {
  const userId = req.session.user_id;
  const shortURL = req.params.shortURL;
  if (!userId) {
    return res.redirect("/login");
  }
  if (!urlsForUser(userId)[shortURL]) {
    return res.redirect("/urls");
  }

  const templateVars = {
    user: users[userId],
    shortURL: shortURL,
    longURL: urlDatabase[shortURL].longURL
  };
  res.render("urls_show", templateVars);
});

//EDIT longURL in a single URL after submission
app.post("/urls/:shortURL", (req,res) => {
  const userId = req.session.user_id;
  const shortURL = req.params.shortURL;
  if (!userId) {
    res.status(403).send("No permission");
  }
  if (!urlsForUser(userId)[shortURL]) {
    res.status(404).send("404: Not found");
  }
  
  const data = { longURL: req.body.longURL, userId };
  urlDatabase[shortURL] = data;
  res.redirect(`/urls/${shortURL}`);
});

//EDIT Delete a single URL
app.post("/urls/:shortURL/delete", (req,res) => {
  const userId = req.session.user_id;
  const shortURL = req.params.shortURL;
  if (!userId) {
    res.status(403).send("No permission");
  }
  if (!urlsForUser(userId)[shortURL]) {
    res.status(404).send("404: Not found");
  }
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

//GET u/
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  if (!urlDatabase[shortURL]) {
    res.status(404).send("404: Not found");
  }
  // bugfix: forgot to call .longURL
  const redirectUrl = urlDatabase[shortURL].longURL;
  return res.redirect(redirectUrl);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

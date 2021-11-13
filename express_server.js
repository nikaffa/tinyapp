const express = require("express");
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');
app.use(morgan('dev')); //middleware: logs info into console
app.use(express.urlencoded({ extended: false})); //instead of depricated bodyParser
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

//GET /
app.get("/", (req, res) => {
  const userId = req.session.user_id;
  if (userId) {
    return res.redirect("/urls");
  }
  res.redirect("/login");
});

//GET /urls (shows My URLS)
app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    return res.status(403).send("Login first"); //checks permissions
  }
  const userUrls = urlsForUser(userId);
  const templateVars = {
    user: users[userId],
    urls: userUrls
  };
  res.render("urls_index", templateVars);
});

//GET /urls/new (Creates New URL)
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

//GET /urls/:id (single shortURL)
app.get("/urls/:shortURL", (req, res) => {
  const userId = req.session.user_id;
  const shortURL = req.params.shortURL;
  if (!userId) {
    return res.status(403).send("Login first"); //checks permissions
  }
  if (!urlsForUser(userId)[shortURL]) {
    return res.status(404).send("404: Page not found"); //checks if page doesn't exist
  }
  const templateVars = {
    user: users[userId],
    shortURL: shortURL,
    longURL: urlDatabase[shortURL].longURL
  };
  res.render("urls_show", templateVars);
});

//GET /u/:id (single shortURL)
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  if (!urlDatabase[shortURL]) {
    return res.status(404).send("404: Page not found");
  }
  const redirectUrl = urlDatabase[shortURL].longURL;
  return res.redirect(redirectUrl);
});

// POST /urls (creates a new shortURL, saves it to database and redirects to its page)
app.post("/urls", (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    return res.status(403).send("Login first"); //checks permissions
  }
  //after submission saves into the urlDatabase shortURL:longURL key-value pair associated with the user
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = { longURL: req.body.longURL, userId };
  res.redirect(`/urls/${shortURL}`);
});

//POST /urls/:id (edits longURL after submission)
app.post("/urls/:shortURL", (req,res) => {
  const userId = req.session.user_id;
  const shortURL = req.params.shortURL;
  if (!userId) {
    return res.status(403).send("No permission");
  }
  if (!urlsForUser(userId)[shortURL]) {
    return res.status(404).send("404: Page not found");
  }
  //updates shortURL in urlDatabase:
  urlDatabase[shortURL] = { longURL: req.body.longURL, userId };
  res.redirect("/urls/");
});

//POST /urls/:id/delete (deletes a single shortURL)
app.post("/urls/:shortURL/delete", (req,res) => {
  const userId = req.session.user_id;
  const shortURL = req.params.shortURL;
  if (!userId) {
    return res.status(403).send("No permission");
  }
  if (!urlsForUser(userId)[shortURL]) {
    return res.status(404).send("404: Not found");
  }
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

//GET /login (login form)
app.get("/login", (req, res) => {
  const userId = req.session.user_id;
  if (users[userId]) {
    return res.redirect("/urls");
  }
  if (!users[userId]) {
    const templateVars = {
      user: undefined
    };
    res.render("login", templateVars);
  }
});

//GET /register (Registration form)
app.get("/register", (req, res) => {
  const userId = req.session.user_id;
  if (!users[userId]) {
    const templateVars = {
      user: undefined
    };
    return res.render("register", templateVars);
  }
  res.redirect("/urls");
});

//POST /login (submits Login form - loggs in)
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (!email || !password) {
    return res.status(403).send('Empty email or password'); //checks empty fields
  }
  const user = getUserByEmail(email, users);
  if (!user) {
    return res.status(403).send('Email not found'); //checks if email matches
  }
  if (!bcrypt.compareSync(password, user.password)) { //checks if password matches using bcrypt.compareSync
    return res.status(403).send("Password does not match");
  }
  //set the user_id cookie session with that user's id:
  req.session["user_id"] = user.id;
  res.redirect("/urls");
});

//POST /register (submits registration form - creates new Account)
app.post("/register", (req, res) => {
  const email = req.body.email;
  const rawPassword = req.body.password;
  if (!email || !rawPassword) {
    return res.status(400).send('Empty email or password');
  }
  const user = getUserByEmail(email, users);
  if (user) {
    return res.status(400).send('Email has already registered');
  }
  //saves user to the database:
  const id = generateRandomString();
  const password = bcrypt.hashSync(rawPassword, 10); //hashing password
  users[id] = { id, email, password };
  
  req.session["user_id"] = id; //adds a cookie session and redirect to /urls (to log in automatically)
  res.redirect("/urls");
});

//POST /logout (loggs out)
app.post("/logout", (req, res) => {
  req.session = null; //clears cookie session
  res.redirect("/");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

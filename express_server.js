const express = require("express");
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');
app.use(morgan('dev')); //middleware - logs information
//instead of bodyparse using express, extended:false means handle only the value from the client and nothing else
app.use(express.urlencoded({ extended: false}));
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

// checks if email belongs to a user in the users database
const getUserByEmail = (email, database) => {
  for (const userId in database) {
    const user = database[userId];
    if (user.email === email) {
      return user;
    }
  }
  return null;
};

//returns a string of 6 random alphanumeric characters:
const generateRandomString = () => {
  return Math.random().toString(36).substring(2,8);
};

const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userId: "userRandomID" },
  "9sm5xK": { longURL: "http://www.google.com", userId: "user2RandomID" },
};


//TODO: renders a user's url database
const urlsForUser = (curUser) => {
  const userDatabase = {};
  for (const shortUrl in urlDatabase) {
    console.log(urlDatabase[shortUrl]);

    if (urlDatabase[shortUrl].userId === curUser) {
      userDatabase[shortUrl] = urlDatabase[shortUrl];
    }
  }
  return userDatabase;
};

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
      //user: users[userId],
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
  const user = getUserByEmail(email, users);
  if (user) {
    return res.status(400).send('Email already registered');
  }
  //saving user to database
  const id = generateRandomString();
  const password = bcrypt.hashSync(rawPassword, 10);
  users[id] = { id, email, password };
  console.log(users);
  // adding a cookie and redirect to /urls (to log in automatically)
  //res.cookie("user_id", id);
  req.session.user_id = id;
  res.redirect("/urls");
});

//Login form
app.get("/login", (req, res) => {
  const userId = req.session.user_id;
  if (users[userId]) {
    res.redirect("/urls");
  } else if (!users[userId]) {
    const templateVars = {
      user: null
      //user: users[userId],
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
  const user = getUserByEmail(email, users);
  if (!user) {
    return res.status(403).send('Email not found');
  }
  //checks if password matches
  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(403).send("Password does not match");
    
  }
  //set the user_id cookie with that user's id
  //res.cookie("user_id", user.id);
  req.session.user_id = user.id;
  res.redirect("/urls");
});

//POST Logging out
app.post("/logout", (req, res) => {
  //clear cookie and logout
  //res.clearCookie("user_id");
  req.session = null;
  return res.redirect("/");
});

//GET Urls page
app.get("/urls", (req, res) => {
  //console.log(urlDatabase);
  //console.log(users);
  const userId = req.session.user_id;
  //checking errors
  if (!userId) {
    //res.redirect("login");
    return res.status(403).send("Login first");
  }
  //TODO
  const userUrls = urlsForUser(userId);
  console.log(userUrls);

  const templateVars = {
    user: users[userId],
    //TODO a setter?
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

//TODO checks EDIT longURL in a single URL after submission
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

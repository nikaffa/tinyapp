const express = require("express");
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');
app.use(morgan('dev')); //middleware - logs information
//instead of bodyparse using express, extended:false means handle only the value from the client and nothing else
app.use(express.urlencoded({ extended: false}));
app.use(cookieParser());

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

// checks if email belongs to a user in the users database
const findUserByEmail = (email) => {
  for (const userId in users) {
    const user = users[userId];
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

//TODO: renders a user's url database
const userURLs = (theUser) => {
  const userDatabase = {};
  for (const url in urlDatabase) {
    if (urlDatabase[url].userId === theUser) {
      userDatabase[url] = urlDatabase[url].longURL;
    }
  }
  return userDatabase;
};

//GET Login page
app.get("/", (req, res) => {
  res.redirect("/urls");
});

//GET Registration form
app.get("/register", (req, res) => {
  const userId = req.cookies.userId;
  if (!users[userId]) {
    const templateVars = {
      user: null
      //user: users[userId],
      //email: users[userId].email,
    };
    res.render("register", templateVars);
  }
  res.redirect("/urls");
});

//POST Registration form - registers a new user
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  //checking errors
  if (!email || !password) {
    return res.status(403).send('Invalid email or password');
  }
  const user = findUserByEmail(email);
  if (user) {
    return res.status(403).send('Email already exists');
  }
  //saving user to database
  const id = generateRandomString();
  users[id] = { id, email, password };
  console.log(users);
  res.redirect("/login");
});

//Login form
app.get("/login", (req, res) => {
  const userId = req.cookies.userId;
  if (users[userId]) {
    res.redirect("/urls");
  } else if (!users[userId]) {
    const templateVars = {
      user: null
      //user: users[userId],
      //email: users[userId].email,
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
    res.status(403).send('Invalid email or password');
    return;
  }
  const user = findUserByEmail(email);
  if (!user) {
    res.status(403).send('Email not found');
    return;
  }
  //checks if password matches
  if (user.password !== password) {
    res.status(403).send("Password does not match");
    return;
  }
  //set the user_id cookie with that user's id
  res.cookie("user_id", user.id);
  res.redirect("/urls");
});

//POST Logging out
app.post("/logout", (req, res) => {
  //clear cookie and logout
  res.clearCookie("user_id");
  return res.redirect("/");
});

//GET Urls page
app.get("/urls", (req, res) => {
  //checks value of cookies and don't display database unless logged in
  console.log(urlDatabase);
  console.log('req.cookies', req.cookies);
  console.log(users);
  
  //const userId = req.cookies.userId;
  const userId = req.cookies["user_id"];
  //checking errors
  if (!userId) {
    return res.redirect("/login");
  }
  //TODO
  const userUrls = userURLs(userId);
  console.log(userUrls);

  const templateVars = {
    user: users[userId],
    email: users[userId].email,
    //TODO a setter?
    urls: userUrls
  };
  res.render("urls_index", templateVars);
});

//EDIT create a new shortURL after submission the form, saves it to database and redirects to its page
app.post("/urls", (req, res) => {
  const userId = req.cookies['user_id'];
  console.log(userId);
  console.log(!userId);
  // if (!userId) {
  //   return res.redirect("/login");
  // }
  
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL; //shortURL-longURL key-value pair are saved to the urlDatabase
  res.redirect('/urls');
  
});

//GET Form to submit a new url
app.get("/urls/new", (req, res) => {
  const userId = req.cookies["user_id"];
  if (!userId) {
    return res.redirect("/login");
  }
  const templateVars = {
    user: users[userId],
    email: users[userId].email
  };
  res.render("urls_new", templateVars);
});

//GET a new created shortURL after submission the urls/new form
app.get("/urls/:shortURL", (req, res) => {
  const userId = req.cookies.userId;
  if (!userId) {
    return res.redirect("/login");
  }
  if (!urlDatabase[shortURL]) {
    return res.redirect("/urls");
  }

  const shortURL = req.params.shortURL;
  const templateVars = {
    user: users[userId],
    //email: users[userId].email,
    shortURL: shortURL,
    longURL: urlDatabase[shortURL]
  };
  res.render("urls_show", templateVars);
});

//TODO checks EDIT longURL in a single URL after submission
app.post("/urls/:shortURL", (req,res) => {
  const userId = req.cookies["user_id"];
  if (!userId) {
    return res.redirect("/login");
  }
  if (!urlDatabase[shortURL]) {
    res.status(404).send("404: Not found");
  }

  const shortURL = req.params.shortURL;
  urlDatabase[shortURL] = req.body.longURL; //updates longURL in the database
  res.redirect("/urls");
});

//EDIT Delete a single URL
app.post("/urls/:shortURL/delete", (req,res) => {
  const userId = req.cookies.userId;
  if (!userId) {
    return res.redirect("/login");
  }
  if (!urlDatabase[shortURL]) {
    res.status(404).send("404: Not found");
  }
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

//GET u/
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  if (!urlDatabase[shortURL]) {
    res.status(404).send("404: Not found");
  }
  return res.redirect(`/${urlDatabase[shortURL]}`);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

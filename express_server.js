const express = require("express");
const bodyParser = require("body-parser");// converts the request body in POST request from a Buffer into readable string
const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');

//bodyparser makes the data in the input field avaialbe to us in the req.body.longURL variable, which we can store in our urlDatabase object
app.use(bodyParser.urlencoded({extended: true}));

//returns a string of 6 random alphanumeric characters:
const generateRandomString = () => {
  return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.send("Hello!!!!");
});
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;//shortURL-longURL key-value pair are saved to the urlDatabase
  console.log(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

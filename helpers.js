//Helper functions

const helperFunction = (urlDatabase) => {

  // checks if email belongs to a user in the users database
  const getUserByEmail = (email, users) => {
    for (const userId in users) {
      const user = users[userId];
      if (user.email === email) {
        return user;
      }
    }
    return undefined;
  };

  //creates current user's database from global database
  const urlsForUser = (curUser) => {
    const userDatabase = {};
    for (const shortUrl in urlDatabase) {
      if (urlDatabase[shortUrl].userId === curUser) {
        userDatabase[shortUrl] = urlDatabase[shortUrl]; // add .longURL??
      }
    }
    return userDatabase;
  };

  //returns a string of 6 random alphanumeric characters
  const generateRandomString = () => {
    return Math.random().toString(36).substring(2,8);
  };

  return {
    getUserByEmail,
    urlsForUser,
    generateRandomString
  };
};

module.exports = helperFunction;
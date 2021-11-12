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

module.exports = getUserByEmail;
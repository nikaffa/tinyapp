const { assert } = require('chai');
const helperFunction = require("../helpers");

const testUsers = {
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

const { getUserByEmail } = helperFunction(testUsers);

describe('getUserByEmail', () => {
  it('should return a user with valid email', () => {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedUserID = "userRandomID";

    assert.equal(expectedUserID, user.id);
  });
  it('should return undefined with invalid email', () => {
    const user = getUserByEmail("us@exam.com", testUsers);
    const expectedUserID = undefined;

    assert.equal(expectedUserID, user);
  });
});
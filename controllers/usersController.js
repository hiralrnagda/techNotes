const User = require("../models/User");
const Note = require("../models/Note");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");

// @desc GET all users
// @route GET /users
// access Private
const getAllUsers = async (req, res) => {
  console.log("here third");
  const users = await User.find().select("-password").lean();
  console.log("herreeee");
  if (!users?.length) {
    return res.status(400).json({ message: "No user found" });
  }
  res.json(users);
};

// @desc CREATE new user
// @route POST /users
// access Private
const createNewUser = async (req, res) => {
  const { username, password, roles } = req.body;

  //Confirm data
  if (!username || !password || !Array.isArray(roles) || !roles.length) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const duplicate = await User.findOne({ username }).lean().exec();

  if (duplicate) {
    return res.status(409).json({ message: "Duplicate username" });
  }

  //hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  const userObject = {
    username,
    password: hashedPassword,
    roles,
  };
  const user = await User.create(userObject);

  if (user) {
    return res.status(201).json({ message: `New user ${username} created` });
  } else {
    return res.status(400).json({ message: "Invalid user data received" });
  }
};

// @desc update a user
// @route PATCH /users
// access Private
const updateUser = async (req, res) => {
  const { id, username, roles, active, password } = req.body;

  //confirm data
  if (
    !id ||
    !username ||
    !Array.isArray(roles) ||
    !roles.length ||
    typeof active !== "boolean"
  ) {
    return res.status(400).json({ message: "All fields are required" });
  }
  // Does the user exist to update?
  const user = await User.findById(id).exec();

  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  //check for duplicate
  const duplicate = await User.findOne({ username }).exec().lean();

  //Allow updates to original user
  if (duplicate && duplicate?._id.toString() !== id) {
    return res.status(409).json({ message: "Duplicate username" });
  }

  user.username = username;
  user.roles = roles;
  user.active = active;

  if (password) {
    //hash password
    user.password = await bcrypt.hash(password, 10);
  }

  const updatedUser = await user.save();

  res.json({ message: `${updatedUser.username} is updated` });
};

// @desc delete user
// @route DELETE /users
// access Private
const deleteUser = async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ message: "User ID required" });
  }

  // Does the user still have assigned notes?
  const note = await Note.findOne({ user: id }).lean().exec();
  if (note) {
    return res.status(400).json({ message: "User has assigned notes" });
  }

  // Does the user exist to delete?
  const user = await User.findById(id).exec();
  if (!user) {
    return res.status(400).json({ message: "User Not Found" });
  }

  const result = await user.deleteOne();

  const reply = `Username ${result.username} with ID ${result._id} deleted`;

  res.json(reply);
};

module.exports = {
  getAllUsers,
  createNewUser,
  updateUser,
  deleteUser,
};

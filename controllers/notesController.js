const User = require("../models/User");
const Note = require("../models/Note");
const asyncHandler = require("express-async-handler");

// @desc GET all notes
// @route GET /notes
// access Private
const getAllNotes = async (req, res) => {
  // Get all notes from MongoDB
  const notes = await Note.find().lean();
  //if no notes
  if (!notes?.length) {
    return res.status(400).json({ message: "No note found" });
  }

  // Add username to each note before sending the response
  // You could also do this with a for...of loop
  const notesWithUser = async () => {
    notes.map(async (note) => {
      const user = await User.findById(note.user).lean().exec();
      return { ...note, username: user.username };
    });
  };

  res.json(notesWithUser);
};

// @desc CREATE new user
// @route POST /users
// access Private
const createNewNote = async (req, res) => {
  const { title, text, user } = req.body;

  //Confirm data
  if (!text || !title || !user) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const duplicate = await Note.findOne({ title }).lean().exec();

  if (duplicate) {
    return res.status(409).json({ message: "Duplicate note title" });
  }

  const noteObject = {
    user,
    title,
    text,
  };
  const note = await Note.create(noteObject);

  if (note) {
    return res.status(201).json({ message: `New note ${note.title} created` });
  } else {
    return res.status(400).json({ message: "Invalid note data received" });
  }
};

// @desc update a user
// @route PATCH /users
// access Private
const updateNote = async (req, res) => {
  const { id, user, text, title, completed } = req.body;

  //confirm data
  if (!id || !user || !text || !title || typeof completed !== "boolean") {
    return res.status(400).json({ message: "All fields are required" });
  }

  const note = await Note.findById(id).exec();
  if (!note) {
    return res.status(400).json({ message: "Note not found" });
  }

  //check for duplicate
  const duplicate = await Note.findOne({ title }).exec().lean();
  //Allow updates to original user
  if (duplicate && duplicate?._id.toString() !== id) {
    return res.status(409).json({ message: "Duplicate note title" });
  }

  note.user = user;
  note.title = title;
  note.text = text;
  note.completed = completed;

  const updatedNote = await note.save();

  res.json({ message: `${updatedNote.title} is updated` });
};

// @desc delete user
// @route DELETE /users
// access Private
const deleteNote = async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ message: "Note ID required" });
  }
  const note = await findById(id).lean().exec();
  if (!note) {
    return res.status(400).json({ message: "User has assigned notes" });
  }

  const result = await note.deleteOne();

  const reply = `Username ${result.title} with ID ${result._id} deleted`;

  res.json(reply);
};

module.exports = {
  getAllNotes,
  createNewNote,
  updateNote,
  deleteNote,
};

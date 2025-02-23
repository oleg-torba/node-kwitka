const ctrlWrapper = require("../helpers/ctrlWrapper");

const getAll = async (req, res) => {
  const contact = await Contact.find({ owner }, { skip, limit }).populate(
    "owner",
    "email id"
  );
  res.json(contact);
};

module.exports = {
  getAll: ctrlWrapper(getAll),
};

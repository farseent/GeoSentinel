exports.getProfile = async (req, res) => {
  const { _id, name, email } = req.user;
  res.json({ id: _id, name, email });
};
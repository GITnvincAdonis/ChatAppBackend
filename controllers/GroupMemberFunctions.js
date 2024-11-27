const pool = require("../db/DB");
const {ValidUUID:isValidUUID} = require('../UTILS/ValidateUUID')


const CreateGroupMember = async (req, res) => {
  const { user_id, group_id } = req.body;
  console.log('Received:', user_id, group_id);

  if (!isValidUUID(group_id) || !isValidUUID(user_id)) {
    return res.status(400).json({ message: 'Invalid UUID format for group_id or user_id' });
  }

  try {
    const addedMember = await pool.query(`
      INSERT INTO group_members (group_id, user_id) 
      VALUES ($1, $2) RETURNING *
    `, [group_id, user_id]);

    return res.status(200).json({ message: "Added user to group", data: addedMember.rows[0] });
  } catch (error) {
    console.error(error.message);
    if (error.code === '23505') {
      return res.status(409).json({ message: "User is already a member of this group" });
    }
    return res.status(500).json({ message: "Error in adding member to group" });
  }
}
module.exports = {CreateGroupMember}
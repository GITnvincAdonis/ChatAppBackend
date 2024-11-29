const pool = require("../db/DB");
const {ValidUUID:isValidUUID} = require('../UTILS/ValidateUUID')
const jwt = require('jsonwebtoken')

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

const GroupMembers = async (req, res) => {
  const { group_id } = req.body;
  console.log(`Request Body: ${JSON.stringify(req.body)}`);
  console.log(`User ID: ${group_id}`);

 
  if (!isValidUUID( group_id) ) {
    return res.status(400).json({ message: 'Invalid UUID format for group_id ' });
  }

  try {
    const users_in_groups = await pool.query(`
      SELECT users.username, users.user_id  FROM users 
      JOIN group_members ON users.user_id = group_members.user_id 
      WHERE group_members.group_id = $1
    `, [group_id]);

    console.log(users_in_groups.rows);

    try {
      console.log(req.token)
      jwt.verify(req.token, process.env.JWT_SECRET, (err, authData) => {
        if (err) {
          return res.sendStatus(403); // Invalid token
        } else {
          return res.json({ message: 'Token matches', members: users_in_groups.rows });
        }
      });
    } catch (error) {
      console.error('JWT Verification Error:', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } catch (error) {
    console.error('Database Query Error:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
module.exports = {CreateGroupMember,GroupMembers}
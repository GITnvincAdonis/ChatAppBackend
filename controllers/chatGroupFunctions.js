require('dotenv').config();
const pool = require("../db/DB");
const jwt = require('jsonwebtoken')

const {ValidUUID:isValidUUID} = require('../UTILS/ValidateUUID')

const UserChatGroups = async (req, res) => {
  const { userID } = req.body;
  console.log(`Request Body: ${JSON.stringify(req.body)}`);
  console.log(`User ID: ${userID}`);

 
  if (!isValidUUID(userID) ) {
    return res.status(400).json({ message: 'Invalid UUID format for group_id or user_id' });
  }

  try {
    const groups_with_user = await pool.query(`
      SELECT * FROM chat_groups 
      JOIN group_members ON chat_groups.group_id = group_members.group_id 
      WHERE group_members.user_id = $1
    `, [userID]);

    console.log(groups_with_user.rows);

    try {
      console.log(req.token)
      jwt.verify(req.token, process.env.JWT_SECRET, (err, authData) => {
        if (err) {
          return res.sendStatus(403); // Invalid token
        } else {
          return res.json({ message: 'Token matches', groups: groups_with_user.rows });
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

const Registergroup  = async(req,res)=>{
    const {chat_name,chat_password} = req.body
    try {
      console.log(req.body)
      const group_id= await pool.query(`
        INSERT INTO chat_groups (group_name,chat_password) 
        VALUES ($1,$2) 
        RETURNING group_id
    `, [chat_name,chat_password]);
      jwt.verify(req.token, process.env.JWT_SECRET, (err, authData)=>{
        if(err) res.sendStatus(403);
        else res.json({message: 'Group registerd at id', group_ID: group_id.rows[0]})
      })
    }
     catch (error) {
      
      console.log(error.message)
      return res.status(400).json({ message: "error in creating chat" });
    }
}
const GetGroupID = async (req, res) => {
    const { group_name, chat_password } = req.body;
  
    if (!group_name || !chat_password) {
      return res.status(400).json({ error: "Missing required parameters" });
    }
  
    console.log(`Request body: ${JSON.stringify(req.body)}`);
  
    try {
      const groups_with_user = await pool.query(`
        SELECT group_id FROM chat_groups 
        WHERE group_name = $1 AND chat_password = $2
      `, [group_name, chat_password]);
  
      if (groups_with_user.rows.length === 0) {
        console.log("Group not found");
        return res.status(404).json();
      }
      jwt.verify(req.token, process.env.JWT_SECRET, (err, authData)=>{
        if(err) res.sendStatus(403);
        else res.json({message: 'Group found', group_ID: groups_with_user.rows[0].group_id})
      })
     
    } catch (error) {
      console.error("Error fetching group ID:", error.message);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
module.exports = {UserChatGroups, Registergroup, GetGroupID}
const pool = require("../db/DB");
const {ValidUUID:isValidUUID} = require('../UTILS/ValidateUUID');


const GetMessages = async (req,res)=>{
  const {group_id} = req.query
  console.log(`messages get: ${req.query}`)
  if (!isValidUUID(group_id)) {
    return res.status(400).json({ message: 'Invalid UUID format for group_id ' });
  }
  try {
    const groupMessages = await pool.query(
      `SELECT * FROM messages 
      WHERE group_id = $1 ORDER BY message_senddate 
      `,[group_id])

    console.log( `messages at group ID ${group_id}: ${groupMessages.rows}`)
    return res.status(200).json(groupMessages.rows)
  } catch (error) {
    console.log(error)
    return res.status(400).json({ message: 'error in fetching message' });
  }
}
const CreateMessage = async (req,res)=>{
    const {text, group_id, user_id} = req.body
    if (!isValidUUID(group_id) || !isValidUUID(user_id)) {
      return res.status(400).json({ message: 'Invalid UUID format for group_id or user_id' });
    }
    try {
      const newMessage = await pool.query(
        `INSERT INTO messages (message_string, group_id, user_id)
        values ($1,$2,$3) RETURNING message_id
        `,[text,group_id,user_id])
  
      console.log( `message created with ID: ${newMessage.rows[0]}`)
      return res.status(200).json(newMessage.rows[0])
    } catch (error) {
      console.log(error)
      return res.status(400).json({ message: 'error in creating message' });
    }
  }
module.exports = {GetMessages, CreateMessage}
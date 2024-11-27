const pool = require("../db/DB");
const UserChatGroups = async(req,res)=>{
    const {user_id} = req.query
    console.log(`req.query: ${JSON.stringify(req.query)}`);
    console.log(`The user ID: ${user_id}`);
    if (!user_id || typeof user_id !== 'string') {
      return res.status(400).json({ error: 'Invalid or missing user_id' });
    }
    try {
   
      const groups_with_user = await pool.query(`
        SELECT * FROM chat_groups 
        JOIN group_members ON chat_groups.group_id = group_members.group_id 
        WHERE group_members.user_id = $1
    `, [user_id]);
      console.log(groups_with_user.rows);
      return res.json(groups_with_user.rows)
  }
     catch (error) {
      console.log(error.code)
    }
  
}
const Registergroup  = async(req,res)=>{
    const {chat_name,chat_password} = req.body
    try {
      console.log(req.body)
      const group_id= await pool.query(`
        INSERT INTO chat_groups (group_name,chat_password) 
        VALUES ($1,$2) 
        RETURNING group_id
    `, [chat_name,chat_password]);
      return res.status(200).json({ message: "group chat created", group_ID: group_id.rows[0]});
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
  
      console.log(`The group ID: ${groups_with_user.rows[0].group_id}`);
      return res.json(groups_with_user.rows[0].group_id);
    } catch (error) {
      console.error("Error fetching group ID:", error.message);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
module.exports = {UserChatGroups, Registergroup, GetGroupID}
const pool = require("../db/DB");
const loginUser = async(req, res)=>{
    
    const {username, user_password} = req.query;
     try {
       const users = await pool.query('SELECT * FROM users where username = $1 AND user_password = $2',[username,user_password]);
       if (users.rowCount > 0) {
         return res.status(200).json({ message: 'Login successful', user: users.rows[0] });
       } else {
         return res.status(401).json({ message: 'Invalid credentials' });
       }
     } catch (error) {
       console.log(error.message)
     }
   }

const SignInUser = async(req, res)=>{
    const {username, user_password} = req.body;
     try {
       const existingUsers = (await pool.query(
         `SELECT * FROM users
          where username = $1`,
           [username]));
       if(existingUsers.rows.length === 0){
  
         const users = await pool.query(
           `INSERT INTO users (username, user_password) 
           values ($1,$2) RETURNING user_id, username`,
            [username, user_password]);
         console.log(users.rows[0])
         return res.json(users.rows[0])
       } 
       return res.status(400).json({ message: "Username already exists" });
  
  
     } catch (error) {
       console.error('Error adding user:', error);
       if (error.code === '23505') {
         res.status(409).json({ error: 'user already exists' });
       } else {
         res.status(500).json({ error: 'Internal server error' });
       }
     }
   }
   
module.exports = { loginUser,SignInUser };
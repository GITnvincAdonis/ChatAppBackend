require('dotenv').config();
const pool = require("../db/DB");
const jwt = require('jsonwebtoken')




const loginUser = async(req, res)=>{
    
  const {username, user_password} = req.body;
  console.log(`Request Body: ${JSON.stringify(req.body)}`);
    try {
      const users = await pool.query(
        `SELECT * FROM users
         where username = $1 
         AND user_password = $2`,
         [username,user_password]);

      if (users.rowCount > 0) {
        console.log(users.rows)
         jwt.sign({user:users.rows[0]},process.env.JWT_SECRET,
          (err, token)=>{
            if(err)  req.sendStatus(403)
            else res.json({message:"successful login",token})
          });
        }
      else res.status(403).json({ message: 'Invalid credentials' });
      
    } catch (error) {
      console.log(error)
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
         jwt.sign({user:users.rows[0]},process.env.JWT_SECRET, (err,token)=>{
          if(err) res.sendStatus(403);
          else res.json({message:"sign in successful", token})
         })
        
       } 
    
  
  
     } catch (error) {
       console.error('Error adding user:', error);
       if (error.code === '23505') {
         res.status(409).json({ error: 'user already exists' });
       } else {
         res.status(500).json({ error: 'Internal server error' });
       }
     }
   }


const DataRetrieveVIAToken = async(req, res)=>{
 
  jwt.verify(req.token,process.env.JWT_SECRET, (err,authData)=>{
    
    if(err) res.sendStatus(403);
    else res.json({message:"sign in successful", authData})
  })
}
module.exports = { loginUser,SignInUser,DataRetrieveVIAToken };
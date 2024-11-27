require("dotenv").config()
const { Socket } = require('socket.io');

const io = require('socket.io')(2000, {
    cors: {
      origin: ['http://localhost:5173'], // Your frontend origin
    },
  });
  
  
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
  
    socket.on("action", (message) => {
      console.log("Received message:", message);
      //socket.broadcast.emit("send-to-client",  message);

   
    });
   

    socket.on("send-to-server", ({ roomName, text }) => {
        console.log(`Message to room ${roomName}: ${text}`);
        //socket.to('yo').emit("send-to-client", { text});
      
        socket.to(roomName).emit("send-to-client", { text});
    });

    socket.on('join-group', (object)=>{
        console.log(`object: ${object}, socket id: ${socket.id}`)
        console.log(`joined-group: ${object.group_name}`)
        socket.join(`${object.group_name}`)
        //socket.join(`yo`)
        
    }) 
    socket.on('leave-group', (object)=>{
        console.log(`object: ${object}, socket id: ${socket.id}`)
        console.log(`left group: ${object.group_name}`)
        socket.leave(`${object.group_name}`)
    }) 
    socket.on("disconnect", () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
  });


  const express = require("express");
  const app = express();

  const cors = require("cors");
  const pool = require("./DB");
  
  
  
  app.use(cors());
  app.use(express.json());

  const isValidUUID = (id) => {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return regex.test(id);
  };
app.get('/users/all',async(req,res)=>{
  try {
    const allUsers = await pool.query("SELECT * FROM users");
    console.log(allUsers.rows)
    return res.json(allUsers.rows)
  } catch (error) {
    console.log(error.message)
  }
})

app.get('/users/login', async(req, res)=>{
    
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
  })





app.get('/groups/group_data', async(req,res)=>{
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

})


app.get('/messages', async (req,res)=>{
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
})
///adding a user, getting that user ID as a return
app.post('/users', async(req, res)=>{
  const {username, user_password} = req.body;
   try {
     const existingUsers = (await pool.query(
       `SELECT * FROM users
        where username = $1`,
         [username]));
     if(existingUsers.rows.length === 0){

       const users = await pool.query(
         `INSERT INTO users (username, user_password) 
         values ($1,$2) RETURNING user_id`,
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
 })

/// adding a group chat, getting that chat ID as a return
app.post('/groups', async(req,res)=>{
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
})


app.post('/groups/group_member', async (req, res) => {
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
});



app.post('/messages', async (req,res)=>{
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
})
app.post('/groups/single_group_id', async (req, res) => {
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
});

app.listen(1000,()=>{
  console.log(`server has started on port ${1000} `);
})
//sign up

//   app.listen(process.env.DB_PORT,()=>{
//     console.log(`server has started on port ${process.env.DB_PORT} `);
// })
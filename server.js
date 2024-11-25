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
  console.log(process.env);
  console.log(process.env.DB_PASSWORD);
  console.log( String(process.env.DB_PASSWORD))

app.get('/users/all',async(req,res)=>{
  try {
    const allUsers = await pool.query("SELECT * FROM users");
    console.log(allUsers.rows)
    return res.json(allUsers.rows)
  } catch (error) {
    console.log(error.message)
  }
})
  //login endpoint
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


//sign up
  app.post('/users', async(req, res)=>{
   const {username, user_password} = req.body;
    try {
      const existingUsers = (await pool.query("SELECT * FROM users where username = $1", [username]));
      if(existingUsers.rows.length === 0){

        const users = await pool.query('INSERT INTO users (id, username, user_password) values (default, $1,$2)', [username, user_password]);
        console.log(users.rows)
        return res.json(users.rows)
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
//   app.listen(process.env.DB_PORT,()=>{
//     console.log(`server has started on port ${process.env.DB_PORT} `);
// })
app.listen(1000,()=>{
  console.log(`server has started on port ${1000} `);
})

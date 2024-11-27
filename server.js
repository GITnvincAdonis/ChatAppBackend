require("dotenv").config()

const express = require("express");
const app = express();
const cors = require("cors");
const pool = require("./db/DB");
app.use(cors());
app.use(express.json());



const {SetupSocket} = require('./socket/socketConnections')
SetupSocket();


app.get('/users/all',async(req,res)=>{
  try {
    const allUsers = await pool.query("SELECT * FROM users");
    console.log(allUsers.rows)
    return res.json(allUsers.rows)
  } catch (error) {
    console.log(error.message)
  }
})


const {loginUser,SignInUser} = require('./controllers/authFunctions')
app.get('/users/login', loginUser )
app.post('/users', SignInUser )


const {UserChatGroups,Registergroup, GetGroupID} = require('./controllers/chatGroupFunctions')
app.get('/groups/group_data', UserChatGroups )
app.post('/groups', Registergroup)
app.post('/groups/single_group_id', GetGroupID );


const { CreateGroupMember } = require('./controllers/GroupMemberFunctions');
app.post('/groups/group_member', CreateGroupMember);


const { GetMessages, CreateMessage } = require("./controllers/messageFunctions");
app.get('/messages',GetMessages )
app.post('/messages',CreateMessage )


app.listen(1000,()=>{
  console.log(`server has started on port ${1000} `);
})
//sign up

//   app.listen(process.env.DB_PORT,()=>{
//     console.log(`server has started on port ${process.env.DB_PORT} `);
// })
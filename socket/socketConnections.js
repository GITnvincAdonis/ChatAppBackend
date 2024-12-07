const pool = require("../db/DB");
function SetupSocket(){
    const io = require('socket.io')(2000, {
        cors: {
          origin: ['http://localhost:5173'], // Your frontend origin
        },
      });
      
      io.on('connection', (socket) => {
        console.log(`Client connected: ${socket.id}`);
     
        socket.on("send-to-server", async({ roomName, text,grp_ID,user_ID },cb) => {
            try {
              const newMessage = await pool.query(
               `INSERT INTO messages (message_string, group_id, user_id)
               values ($1,$2,$3) RETURNING message_id,message_senddate
               `,[text,grp_ID,user_ID]);

              console.log("New message id:", newMessage.rows[0]);

              await socket.to(roomName).emit("send-to-client", { text});
              await cb({message:"server callback",data:newMessage.rows[0]})
           
            } catch (error) {
              console.log(error)
            }
            
        });
    
        socket.on('join-group', (object)=>{socket.join(`${object.group_name}`)}) 
        socket.on('leave-group', (object)=>{socket.leave(`${object.group_name}`)}) 
        socket.on("disconnect", () => { console.log(`Client disconnected: ${socket.id}`)});
      });
    
}
module.exports = { SetupSocket };
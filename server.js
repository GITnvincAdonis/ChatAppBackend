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
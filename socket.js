var socket = require('socket.io');
var database = require("./database");

module.exports = function(server)
{
  var io = socket.listen(server);
  io.sockets.on('connection', function (socket) { 
      console.log("client connected");
      
      
      
      socket.on("order get", function(orderID, callback)
        {
          
          database.getOrder(orderID,callback);
          
        });
      
      socket.on("article add", function(data, callback)
        {
          database.addArticle(data, callback);
          socket.broadcast.emit("article changed");
        });
      
      socket.on("order create", function(data, callback)
        {
          database.createEmptyOrder(callback);
          
          socket.broadcast.emit("order changed");
        });
      
      socket.on("order add article", function(data, callback)
        {
          if(data && data.orderID && data.articleID)
          {
            database.addArticleToOrder(data.orderID, data.articleID, callback);
            socket.broadcast.emit("article changed", {articleID: data.articleID});
            socket.broadcast.emit("order changed", {orderID: data.orderID});
          }
          else
          {
            callback("error", null); 
          }
        });
      
  });
}

// status 0 is success
function writeResponse(callback, status, data)
{
  var answer = 
  {
    status: status,
    statusText: getStatusText(status),
    data: data
  };
  callback(answer);
  
  
}


function getStatusText(status)
{
  switch(status)
  {
  case 0:
    return "success";
  default:
    return "unknown";
  }
}


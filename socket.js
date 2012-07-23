var socket = require('socket.io');

module.exports = function(server, database)
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
      socket.on("article update", function(data, callback)
        {
          database.updateArticle(data.articleID, data.fields, callback); 
          socket.broadcast.emit("article changed", {articleID: data.articleID});
          
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
            socket.broadcast.emit("order changed", {orderID: data.orderID});
            socket.broadcast.emit("article changed", {articleID: data.articleID});
            
          }
          else
          {
            callback("error", null); 
          }
        });
      
      socket.on("order remove article", function(data, callback)
        {
          if(data && data.orderID && data.articleID)
          {
            database.removeArticleFromOrder(data.orderID, data.articleID, callback);
            socket.broadcast.emit("order changed", {orderID: data.orderID});
            socket.broadcast.emit("article changed", {articleID: data.articleID});
            
          }
          else
          {
            callback("error", null); 
          }
        });
      
      socket.on("order update", function(data, callback)
        {
          database.updateOrder(data.orderID, data.fields, callback);
          socket.broadcast.emit("order changed", {orderID: data.orderID});
        });
      
      socket.on("order delete", function(data, callback)
        {
          database.deleteOrder(data.orderID, callback);
          socket.broadcast.emit("order changed", {orderID: data.orderID});
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


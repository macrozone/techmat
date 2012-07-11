module.exports = function(app, database)
{
  
  app.get("/", function(req, res)
    {
      res.render("index", {
          title: "Home" 
      });
      
    });

  // ajax calls are mostly deprecated
  // only ajax/articles is used
  
  
  app.get('/ajax/articles', function(req, res){
      
      database.allArticles(function(error, result, fields)
        {
          
          var response = 
          {
            status: 0,
            error: error,
            aaData: result
          };
         
          
          res.write(JSON.stringify(response));
          res.end();
        });
      
      
  });
  
  
  app.post("/ajax/addArticle", function(req, res)
    {
      database.addArticle(req.body, function(error, result)
        {
          writeResponse(res, error, result);   
        });
    });
  
  app.get("/ajax/orders", function(req, res)
    {
      database.allOrders(function(error, result)
        {
          var response = 
          {
            status: 0,
            error: error,
            aaData: result
          };
         
          
          res.write(JSON.stringify(response));
          res.end();
        });
    });
  app.get("/ajax/order", function(req, res)
    {
      var orderID = req.query.id;
      database.getOrder(orderID, function(error, result)
        {
       writeResponse(res, error, result);
        });
      
      
      
    });
  
  app.get("/ajax/order/create", function(req, res)
    {
      database.createEmptyOrder(function(error, result)
        {
         writeResponse(res, error, result.insertId ? result.insertId : null);
        });
    });
  
  app.post("/ajax/order/addArticle", function(req, res)
    {
      if(req && req.body && req.body.orderID && req.body.articleID)
      {
        database.addArticleToOrder(req.body.orderID, req.body.articleID, function(error, result)
          {
            writeResponse(res, error, result);
          });
      }
    });
}

// status 0 is success
function writeResponse(res, error, result)
{
  var answer = 
  {
    error: error,
    data: result
  };
  res.write(JSON.stringify(answer));
  res.end();
  
  
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





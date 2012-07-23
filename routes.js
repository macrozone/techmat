module.exports = function(app, database)
{
  
  app.get("/", function(req, res)
    {
      res.render("index", {
          title: "Home" 
      });
      
    });
  
  app.get("/csv/articles/all", function(req, res)
    {
      showArticleCSV(req, res, database.allArticles);
    });
  
   app.get("/csv/articles/away", function(req, res)
    {
      showArticleCSV(req, res, database.awayArticles);
    });
   
     app.get("/csv/articles/stock", function(req, res)
    {
      showArticleCSV(req, res, database.stockArticles);
    });
  
  function showArticleCSV(req, res, dbQuery)
  {
    res.header("Content-Type","application/octet-stream");
    res.header("Content-Disposition", "attachment;filename=\"articles.csv\"");
    
    
    var query=  dbQuery(function(error, result, fields)
      {
        var counter = 0;
        for(column in fields){
          counter++;
          res.write(fields[column].name);
          if(counter < fields.length)
          {
            res.write(";"); 
          }
          
        }
        res.write("\n");
        
        for(id in result)
        {
          var row = result[id];
          counter = 0;
          for(column in fields){
            var field = row[fields[column].name];
            res.write(""+(field !=null ? field: ""));
            counter++;
            if(counter < fields.length)
            {
              res.write(";"); 
            }
          }
          
          res.write("\n");
        }
        
        
        
        res.end();
      });
  }
  
  
  app.get("/print/articles/all", function(req, res)
    {
      showPrintArticleList(req, res, database.allArticles);
      
    });
  
  app.get("/print/articles/stock", function(req, res)
    {
      showPrintArticleList(req, res, database.stockArticles);
      
    });
  
  app.get("/print/articles/away", function(req, res)
    {
      showPrintArticleList(req, res, database.awayArticles);
      
    });
  
  function showPrintArticleList(req, res, dbQuery)
  {
    dbQuery(function(error, result, fields)
      {
        
        
        res.render("articleList",
          {
            title: "Alle Artikel",
            headers:["ID", "Name", "Name", "Geheim-Nr","Ort", "Bemerk.", "Weg?"],
            articles: result
          });
        
      });
  }
  
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
          
          res.json(response);
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
  res.json(answer);
  
  
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







var mysql      = require('mysql');
var connection;

module.exports.connect = function(settings)
{
  connection = mysql.createConnection(settings);
  
  
  connection.connect(function(err) {
      if(err)
        console.log(err);
      else
        console.log("successfully connected to database");
  }); 
}



module.exports.allArticles = function(callback)
{
  connection.query('SELECT * FROM article',callback);
}


module.exports.addArticle = function(article, callback)
{
  var fields = 
  [
    'name', 'ext_id', 'sap', 'location', 'notes'
  ];
 
  var data = sanitize(article, fields);
  console.log(data);
  connection.query('INSERT INTO article SET ?',data, callback);
  
}

module.exports.updateArticle = function(id, fields, callback)
{
   connection.query("UPDATE `article` SET ? WHERE id=?", [fields,id], callback);
}

function getArticle(id, callback)
{
  connection.query('SELECT * FROM `article` JOIN WHERE id=?', id, function(error, result)
    {
      if(!error && result.lenght > 0) result = result[0]; 
      
      callback(error, result);
      
    });
}

function getArticlesByOrder(orderID, callback)
{
  connection.query('SELECT * FROM `article` WHERE order_fk=?', orderID, callback);
}

module.exports.getOrder = function(orderID, callback)
{
  
  connection.query('SELECT * FROM `order` WHERE id=?', orderID, function(error, result)
    {
      
      if(!error && result.length > 0) 
      {
        var order = result[0]; 
        
        
        getArticlesByOrder(orderID, function(error, result)
          {
            
            if(!error)
            {
              order.articles = result;
            }
            
            callback(error, order);
          });
      }
      else
      {
        callback(error, result);
        
      }
    });
}

module.exports.createEmptyOrder = function(callback)
{
  connection.query("INSERT INTO `order` VALUES ()", callback);
}

module.exports.addArticleToOrder = function(orderID, articleID, callback)
{
  connection.query("UPDATE article SET order_fk=? WHERE id=? AND order_fk IS NULL", [orderID, articleID], callback);
}


module.exports.removeArticleFromOrder = function(orderID, articleID, callback)
{
  connection.query("UPDATE article SET order_fk=NULL WHERE id=? AND order_fk=?", [articleID,orderID], callback);
}

module.exports.updateOrder = function(orderID, fields, callback)
{
  connection.query("UPDATE `order` SET ? WHERE id=?", [fields,orderID], callback);
  
}



function sanitize(rawData, fields)
{
  var data = {};
  
  {};
  
  fields.forEach(function(field)
    {
      if(typeof rawData[field] != 'undefined')
      {
        if(typeof rawData[field] == 'string' && rawData[field].length == 0)
        {
          
          data[field] = null;
        }
        else
        {
          data[field] = rawData[field];
        }
      }
      
    });
  
  return data; 
}











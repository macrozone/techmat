var mysql      = require('mysql');
var connection = mysql.createConnection({
    host     : '127.0.0.1 ',
    user     : 'root',
    password : 'pamir',
    database : 'techmat'
});

connection.connect(function(err) {
    // connected! (unless `err` is set)
});



module.exports.allArticles = function(callback)
{
  connection.query('SELECT * FROM article',callback);
}


module.exports.addArticle = function(article, callback)
{
  var fields = 
  [
    'name', 'ext_id', 'sap'
  ];
  var data = sanitize(article, fields);
  
  connection.query('INSERT INTO article SET ?',data, callback);
  
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
        data[field] = rawData[field];
      }
    });
  
  return data; 
}











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


function testData(callback)
{
  
  connection.query('SHOW TABLE STATUS',callback);
  
}


function allArticles(callback)
{
  connection.query('SELECT * FROM article',callback);
}


function addArticle(article, callback)
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

function getOrder(orderID, callback)
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

function createEmptyOrder(callback)
{
  connection.query("INSERT INTO `order` VALUES ()", callback);
}

function addArticleToOrder(orderID, articleID, callback)
{
  connection.query("UPDATE article SET order_fk=? WHERE id=? AND order_fk IS NULL", [orderID, articleID], callback);
}


function removeArticleFromOrder(orderID, articleID, callback)
{
  connection.query("UPDATE article SET order_fk=NULL WHERE id=? AND order_fk=?", [articleID,orderID], callback);
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










module.exports.testData = testData;
module.exports.allArticles = allArticles;
module.exports.addArticle = addArticle;
module.exports.getOrder = getOrder;
module.exports.createEmptyOrder = createEmptyOrder;
module.exports.addArticleToOrder = addArticleToOrder;
module.exports.removeArticleFromOrder = removeArticleFromOrder;





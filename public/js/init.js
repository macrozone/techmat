

$(document).ready(function() {
    
    // init socket
    var socket = io.connect(document.location.origin);
    var currentOrderID = null;
    dataService =  {
      getOrder: function(orderID, callback)
      {
        socket.emit("order get", orderID, callback);
      },
      addArticle: function(data, callback)
      {
        socket.emit("article add", data, callback);
        
        
      },
      
      createEmptyOrder: function(callback)
      {
        socket.emit("order create", null, callback);
        
      },
      
      addArticleToOrder: function(orderID, articleID,  callback)
      {
        socket.emit("order add article", {orderID: orderID, articleID: articleID}, callback);
      }
    };
    
    
    socket.on("article changed", refreshArticleTable);
    socket.on("order changed", function(data)
      {
        
        if(data && data.orderID && currentOrderID == data.orderID)
        {
          // refresh order form
          showOrder(currentOrderID);
        }
      });
    
    initDialogs();
    
    
    
    
    
    
    
    
    var $table =  $("<table id='articleTable' />").appendTo($("#leftColumn"));
    var oTable =  createArticleTable($table);
    
    
    var $addNewArticleButton = $("<a>Neuer Artikel erfassen</a>").appendTo($("#actions")).button().click(showAddArticleDialog);
    
    
    
    
    
    
    function initDialogs()
    {
      $("#errorDialog").dialog({ modal: true,autoOpen: false }); 
      $( "#addNewArticleDialog" ).dialog({ modal: true, autoOpen: false }); 
    }
    
    function showErrorDialog()
    {
      
      $( "#errorDialog" ).dialog('open');
      
      
    }
    
    function showAddArticleDialog()
    {
      $( "#addNewArticleDialog" ).dialog('open');
    }
    
    $(".addNewArticle").submit(function()
      {
        var $form = $(this);
        var data = 
        {
          name: $(this).find("input[name='name']").val(),
          ext_id: $(this).find("input[name='ext_id']").val(),
          sap: $(this).find("input[name='sap']").val()
        };
        
        
        dataService.addArticle(data, function(error, result)
          {
            if(!error)
            {
              // everything is ok, reload articles 
              refreshArticleTable();
              $form[0].reset();
            }
            else
            {
              showErrorDialog(); 
            }
          });
        
        return false;
      });
    
    
    
    function createArticleTable($table)
    {
      
      
      var $header = $("<tr />").appendTo($("<thead />").appendTo($table));
      var headers = 
      [
        "ID", "Name", "Geheim-NR", "SAP", "Auftragsnummer", "Optionen"
      ];
      
      $.each(headers, function(index, header)
        {
          $header.append($("<th>"+header+"</th>"));
        });
      
      
      var oTable = $table.dataTable( {
          "bProcessing": true,
          "sAjaxSource": "ajax/articles",
          "iDisplayLength": 100,
          "aoColumns": [
            { "mDataProp": "id" },
            { "mDataProp": "name" },
            { "mDataProp": "ext_id" },
            { "mDataProp": "sap" },
            { "mDataProp": "order_fk",
            "fnCreatedCell": onCreateOrderCell},
            { "mDataProp": null, 
              
              "fnCreatedCell": onCreateOptionCell,
            "sClass": "options"}
            
            
            
          ]
      } );
      
      function onCreateOrderCell(cell, sData, rowData, iRow, iCol)
      {
        
        if(rowData.order_fk !=null)
        {
          $(cell).parent().addClass("borrowed");
        }
      }
      
      
      function onCreateOptionCell(cell, sData, rowData, iRow, iCol)
      {
        if(rowData.order_fk !=null)
        {
          // is borrowed
          var $button = $('<a class="showOrderButton">Auftrag anzeigen</a>');
          
          $button.button();
          $(cell).append($button);
          $button.click(function()
            {
              showOrder(rowData.order_fk);
            });
        }
        
        else
        {
          // is not borrowed
          
          var $createNewOrderButton = $('<a class="newOrderButton">Neuer Auftrag</a>');
          
          $createNewOrderButton.button();
          $(cell).append($createNewOrderButton);
          $createNewOrderButton.click(function()
            {
              showNewOrderForm({articleID: rowData.id});
            });
          
          var $addToOrderButton = $('<a class="addToOrderButton">hinzufügen --></a>');
          
          $addToOrderButton.button();
          $(cell).append($addToOrderButton);
          $addToOrderButton.click(function()
            {
              addArticleToOrder(currentOrderID, rowData.id, function(response)
                {
                  
                });
            });
          
          
        }
        
      }
      
      
      
      return oTable;
    }
    
    function showOrder(orderID)
    {
      
      dataService.getOrder(orderID, function(error, data)
        {
          $("body").addClass("editingOrder");
          currentOrderID = orderID;
          var $order = $("#order");
          $order.empty().show();
          
          var $closeButton = $("<a>close</a>").button().click(function()
            {
              closeOrder();
            });
          
          
          $order.append("<p>ID: "+orderID);
          
          $order.append($closeButton);
          var $table = $('<table/>').appendTo($order);
          
          $table.append("<tr><th>Einheit: </th><td>"+data.borrower+"</td></tr>");
          
          $table.append("<tr><th>Lieferant: </th><td>"+data.lender+"</td></tr>");
          $table.append("<tr><th>ID</th><th>Name</th><th>Geheim-Nr.</th><th>SAP</th></tr>");
          
          $.each(data.articles, function(index, article)
            {
              $table.append("<tr><td>"+article.id+"</th><th>"+article.name+"</th><th>"+article.ext_id+"</th><th>"+article.sap+"</th></tr>");
              
            });
          
          
          
        });
    }
    
    function showNewOrderForm(options)
    {
      dataService.createEmptyOrder(function(error, result)
        {
          currentOrderID = result.insertId;
          
          
          
          if(options && options.articleID)
          {
            addArticleToOrder(currentOrderID, options.articleID, function(error, result)
              {
                proceed();
              });
          }
          else
          {
            proceed(); 
          }
          
          function proceed()
          {
            showOrder(currentOrderID); 
          }
        });
      
      
    }
    
    function closeOrder()
    {
      var $form = $("#order").hide();
      $("body").removeClass("editingOrder");
      currentOrderID = null;
      
      
      
      
    }
    
    
    
    function refreshArticleTable()
    {
      $("#articleTable").dataTable().fnReloadAjax();
    }
    
    function addArticleToOrder(orderID, articleID, callback)
    {
      dataService.addArticleToOrder(orderID, articleID, function(error, result)
        {
          
          refreshArticleTable();
          showOrder(orderID);
          callback(error, result);
        });
    }
    
} );

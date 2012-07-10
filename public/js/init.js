

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
      },
      
      removeArticleFromOrder: function(orderID, articleID,  callback)
      {
        socket.emit("order remove article", {orderID: orderID, articleID: articleID}, callback);
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
    
    
    
    
    $(window).scroll(function(){
        $("#order")
        .stop()
        .animate({"marginTop": ($(window).scrollTop() + 30) + "px"}, "fast");
    });
    
    
    
    function initDialogs()
    {
      $("#errorDialog").dialog({ title: "Error", modal: true,autoOpen: false }); 
      $( "#addNewArticleDialog" ).dialog({ title: "Neuer Artikel hinzufügen", modal: true, autoOpen: false }); 
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
        "ID", "Name", "Geheim-Nr", "SAP", "Ausleih-nr", "Optionen"
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
          if(rowData.order_fk == currentOrderID)
          {
            $(cell).parent().addClass("orderSelected");
            
          }
        }
      }
      
      
      function onCreateOptionCell(cell, sData, rowData, iRow, iCol)
      {
        if(rowData.order_fk !=null)
        {
          // is borrowed
          var $button = $('<a class="showOrderButton">Anzeigen</a>');
          
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
          
          var $createNewOrderButton = $('<a class="newOrderButton">Verleihen</a>');
          
          $createNewOrderButton.button();
          $(cell).append($createNewOrderButton);
          $createNewOrderButton.click(function()
            {
              showNewOrderForm({articleID: rowData.id});
            });
          
          var $addToOrderButton = $('<a class="addToOrderButton">hinzufügen ►</a>');
          
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
          refreshArticleTable();
          var $orderBox = $("#order").show();
          var $order = $orderBox.find(".ui-widget-content");
          
          
          $order.empty().show();
          
          var $closeButton = $("<a>close</a>").button().click(function()
            {
              closeOrder();
            });
          
          
          $order.append("<p>ID: "+orderID);
          
          $order.append($closeButton);
          var $table = $('<table/>').appendTo($order);
          $table.append("<tr><th>Zeit: </th><td>"+data.itime+"</td></tr>");
          $table.append("<tr><th>Einheit: </th><td>"+data.borrower+"</td></tr>");
          
          $table.append("<tr><th>Lieferant: </th><td>"+data.lender+"</td></tr>");
          $table.append("<tr><th>ID</th><th>Name</th><th>Geheim-Nr.</th><th>SAP</th></tr>");
          
          $.each(data.articles, function(index, article)
            {
              var $row = $("<tr><td>"+article.id+"</td><td>"+article.name+"</td><td>"+article.ext_id+"</td><td>"+article.sap+"</td><td><a class='takeBackButton'>Zurücknehmen</a></td></tr>");
              $row.data("article", article);
              $row.appendTo($table);
            });
          
          $table.find(".takeBackButton").button().click(function()
            {
              
                 var article = $(this).parentsUntil("tr").parent().data("article");
                 
             removeArticleFromOrder(orderID, article.id, function(error, result)
               {
                 console.log(error, result);
               });
            });
          
          
          
        });
    }
    
    function showNewOrderForm(options)
    {
      dataService.createEmptyOrder(function(error, result)
        {
          currentOrderID = result.insertId;
          refreshArticleTable();
          
          
          
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
      refreshArticleTable();
      
      
      
      
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
    
    function removeArticleFromOrder(orderID, articleID, callback)
    {
      dataService.removeArticleFromOrder(orderID, articleID, function(error, result)
        {
          
          refreshArticleTable();
          showOrder(orderID);
          callback(error, result);
        });
    }
    
} );

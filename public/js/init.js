

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
      
      updateArticle: function(articleID, fields, callback)
      {
        socket.emit("article update", {articleID: articleID, fields: fields}, callback); 
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
      },
      
      updateOrder: function(orderID, fields, callback)
      {
        socket.emit("order update", {orderID: orderID, fields: fields}, callback); 
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
        "ID", "SAP", "Name", "Geheim-Nr","Ort", "Bemerk.", "Ausgeliehen", "Optionen"
      ];
      
      $.each(headers, function(index, header)
        {
          $header.append($("<th>"+header+"</th>"));
        });
      
      
      var columns = [
        { "mDataProp": "id"},
        { "mDataProp": "sap" , "fnCreatedCell": onCreateEditCell },
        { "mDataProp": "name" , "fnCreatedCell": onCreateEditCell },
        { "mDataProp": "ext_id" , "fnCreatedCell": onCreateEditCell },
        { "mDataProp": "location" , "fnCreatedCell": onCreateEditCell },
        { "mDataProp": "notes" , "fnCreatedCell": onCreateEditCell },
        
        { "mDataProp": "order_fk",
        "fnCreatedCell": onCreateOrderCell},
        { "mDataProp": null, 
          
          "fnCreatedCell": onCreateOptionCell,
        "sClass": "options"}
        
        
        
      ];
      
      var oTable = $table.dataTable( {
          "bProcessing": true,
          "sAjaxSource": "ajax/articles",
          "iDisplayLength": 50,
          "aoColumns": columns
      } );
      
      function onCreateEditCell(cell, sData, rowData, iRow, iCol)
      {
        $(cell).click(function()
          {
            if(!$(cell).hasClass("editing"))
            {
              $(cell).addClass("editing");
              var oldValue = $(cell).text();
              $(cell).empty();
              var $input = $('<input type="text" value="'+oldValue+'" />');
              
              $(cell).append($input);
              $input.focus();
              $input.blur(function()
                {
                  var newVal =  $(this).val();
                  if(newVal != sData)
                  {
                    var key = columns[iCol].mDataProp;
                    console.log(key, newVal);
                    // save value
                    
                    fields = {};
                    fields[key] = newVal;
                    dataService.updateArticle(rowData.id, fields, function(error, result)
                      {
                        if(!error)
                        {
                          // everything went as expected
                          oTable.fnUpdate(newVal, iRow, iCol);
                          $(cell).removeClass("editing");
                          $(cell).empty();
                          $(cell).text(newVal);
                        }
                        else
                        {
                          // error
                          
                          $input.focus();
                          
                        }
                      });
                    
                    
                  }
                  else
                  {
                    $(cell).removeClass("editing");
                    $(cell).empty();
                    $(cell).text(newVal); 
                  }
                  
                });
              
              
            }
          });
        
        
      }
      
      
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
          
          var $closeButton = $orderBox.find(".closeButton");
          
          $closeButton.unbind("click", closeOrder);
          $closeButton.button().click(closeOrder);
          
          
          $order.append("<p>ID: "+orderID);
          
          
          var $table = $('<table/>').appendTo($order);
          $table.append("<tr><th>Zeit: </th><td>"+data.itime+"</td></tr>");
          
          var fields = {
            borrower: "Wer nimmts? - Person",
            borrower_unit: "Wer nimmts? - Einheit",
            lender: "Verleiher - Person",
            lender_unit: "Verleiher - Einheit"
          };
          
          
          $.each(fields, function(key, label)
            {
              $input = $('<input type="text" name="'+key+'" value="'+data[key]+'" />').keyup({orderID: orderID},onChangeOrderProperty);
              $table.append($("<tr><th>"+label+": </th></tr>").append($("<td />").append($input)));
            });
          
          
          $table = $('<table class="articleTable"/>').appendTo($order);
          $table.append("<thead><tr><th>ID</th><th>Name</th><th>Geheim-Nr.</th><th>SAP</th></tr></thead>");
          
          var $tableBody = $("<tbody />").appendTo($table);
          $.each(data.articles, function(index, article)
            {
              var $row = $("<tr><td>"+article.id+"</td><td>"+article.name+"</td><td>"+article.ext_id+"</td><td>"+article.sap+"</td><td><a class='takeBackButton'>Zurücknehmen</a></td></tr>");
              $row.data("article", article);
              $row.appendTo($tableBody);
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
    
    function onChangeOrderProperty(event)
    {
      var value = $(this).val();
      var name = $(this).attr("name");
      var orderID = event.data.orderID;
      var data = {};
      data[name] = value;
      
      dataService.updateOrder(orderID, data, function(error, result)
        {
          
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
      var $order = $("#order").hide();
      var numberOfArticles = $order.find(".articleTable tr").length -1;
      if(numberOfArticles <= 0)
      {
        // no articles left
        // could delete this order here
      }
      
      $("body").removeClass("editingOrder");
      currentOrderID = null;
      refreshArticleTable();
      
      
      
      
    }
    
    
    
    function refreshArticleTable()
    {
      console.log("refreshing table");
      $("#articleTable").dataTable().fnReloadAjax();
    }
    
    function addArticleToOrder(orderID, articleID, callback)
    {
      dataService.addArticleToOrder(orderID, articleID, function(error, result)
        {
          
         
          showOrder(orderID);
          callback(error, result);
        });
    }
    
    function removeArticleFromOrder(orderID, articleID, callback)
    {
      dataService.removeArticleFromOrder(orderID, articleID, function(error, result)
        {
          
         
          showOrder(orderID);
          callback(error, result);
        });
    }
    
} );

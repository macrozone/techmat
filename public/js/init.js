"use strict";

/**

sorry for the mess here, i had some memory leaks to fix. 

Be carefull, when adding event handlers to elements that you dont have control and that can be removed or replaced. 
E.g. the table rows can get hidden by dataTables and so its not easy to remove event handlers there.

Better solution is to use jquery's "on" (formerly "delegate") to bind event handlers.
jquery will automatically add theses handlers to new nodes
*/

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
      },
      deleteOrder: function(orderID, callback)
      {
        socket.emit("order delete", {orderID: orderID}, callback); 
      }
    };
    
    
    
    
    socket.on("order changed", function(data)
      {
        
        
        if(data && data.orderID && currentOrderID == data.orderID)
        {
          // refresh order form
          showOrder(currentOrderID);
        }
        
        refreshOrderTable();
      });
    
    socket.on("article changed", refreshArticleTable);
    
    initDialogs();
    $( "#tabs" ).tabs();
    
    
    
    
    var articleColumns = [
      { "mDataProp": "id", "sWidth": "12px"},
      { "mDataProp": "sap" , "sClass": "editable", "fnCreatedCell": null, "sWidth": "30px"},
      { "mDataProp": "name" , "sClass": "editable", "fnCreatedCell": null, "sWidth": "140px" },
      { "mDataProp": "ext_id" , "sClass": "editable", "fnCreatedCell": null, "sWidth": "70px" },
      { "mDataProp": "location" , "sClass": "editable", "fnCreatedCell": null, "sWidth": "140px" },
      { "mDataProp": "notes" , "sClass": "editable", "fnCreatedCell": null, "sWidth": "140px" },
      
      { "mDataProp": "order_fk", "sWidth": "32px",
      "fnCreatedCell": onCreateOrderCell},
      { "mDataProp": null, 
        "sWidth": "51px",
        "fnCreatedCell": onCreateOptionCell,
      "sClass": "options button"}
      
      
      
    ];
    
    
    
    
    var $table =  $("#articleTable");
    var oTable =  createArticleTable($table, articleColumns);
    
    
    var orderColumns = [
      { "mDataProp": "id", "fnCreatedCell": onCreateOrderIDCell},
      { "mDataProp": "itime", "fnRender":function(obj)
        {
          return formatTime(obj.aData.itime);
       }},
      
      { "mDataProp": "borrower"},
      { "mDataProp": "borrower_unit"},
      { "mDataProp": "lender"},
      { "mDataProp": "lender_unit"},
      { "mDataProp": "number_of_articles"},
      { "mDataProp": null, 
        
        "fnCreatedCell": onCreateOrderOptionCell,
        "sClass": "options",
      "sWidth": "150px"}
      
      
      
    ];
    
    
    var $orderTable = $("#orderTable");
    var oOrderTable = createOrderTable($orderTable, orderColumns);
    
    $("#actions .refresh").button().on("click",refreshArticleTable);
    $("#actions .print").button().on("click",showPrintDialog);
    $("#actions .newArticle").button().on("click",showAddArticleDialog);
    
    
    
    
    $(window).scroll(function(){
        $("#order")
        .stop()
        .animate({"marginTop": ($(window).scrollTop() + 10) + "px"}, "fast");
    });
    
    function formatTime(timeString)
    {
      var date = new Date(timeString);
      // return date.toLocaleString();
      function addZeros(number)
      {
       return number < 10? "0"+""+number : number; 
      }
      return addZeros(date.getDate())+"-"+ addZeros(date.getMonth()+1)+"-"+ date.getFullYear() + " "+addZeros(date.getHours()) + ":"+addZeros(date.getMinutes());
       
    }
    
    
    
    function initDialogs()
    {
      var defaultSettings = {title: "Fehler", modal: true, autoOpen: false, buttons:{"Schliessen": function() {
        $( this ).dialog( "close" );
      }}}
      $("#printDialog").dialog($.extend({},defaultSettings,{ title: "Drucken"}));
      $( "#printDialog" ).find(".button").button();
      
      $( "#printDialog" ).find(".printAll").on("click", printAll);
      $( "#printDialog" ).find(".exportAll").on("click", exportAll);
      $( "#printDialog" ).find(".printStock").on("click", printStock);
      $( "#printDialog" ).find(".exportStock").on("click", exportStock);
      $( "#printDialog" ).find(".printAway").on("click", printAway);
      $( "#printDialog" ).find(".exportAway").on("click", exportAway);
      
      
      
      
      
      $("#orderIsEmptyMessage").dialog(defaultSettings);
      $("#orderNotEmptyMessage").dialog(defaultSettings);
      $("#errorDialog").dialog(defaultSettings); 
      $( "#addNewArticleDialog" ).dialog($.extend({},defaultSettings,{ title: "Neuer Artikel hinzufügen", 
          buttons:{"Schliessen": function()
            {
              
              $(this).dialog("close");
            },
            "Speichern": function()
            {
              $(this).find(".addNewArticle").submit();
            }
      }})); 
      
      
      $("#addNewArticleDialog .addNewArticle").submit(function()
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
                showErrorDialog(error); 
              }
            });
          
          return false;
        });
    }
    
    function showErrorDialog(error)
    {
      
      $( "#errorDialog" ).dialog('open');
      $( "#errorDialog" ).find(".error").empty().text(JSON.stringify(error));
      
      
    }
    
    function showAddArticleDialog()
    {
      $( "#addNewArticleDialog" ).dialog('open');
      
    }
    
    
    function showPrintDialog()
    {
      $( "#printDialog" ).dialog('open');
    }
    
    
    function createArticleTable($table, columns)
    {
      
      
      var $header = $("<tr />").appendTo($("<thead />").appendTo($table));
      var headers = 
      [
        "ID", "SAP", "Name", "Geheim-Nr","Ort", "Bemerk.", "Weg?", "Optionen"
      ];
      
      $.each(headers, function(index, header)
        {
          $header.append($("<th>"+header+"</th>"));
        });
      
      
      
      var oTable = $table.dataTable( {
          "bJQueryUI": true,
          "bProcessing": true,
          "sAjaxSource": "ajax/articles",
          "iDisplayLength": 25,
          "aoColumns": columns,
          "fnDrawCallback": function onDraw()
          {
            $("#articleTable").off("click");
            $("#articleTable .showOrderButton").button();
            $("#articleTable").on("click", ".showOrderButton", function()
              {
                var node = $(this).parentsUntil("tr").parent().get(0);
                var rowData = oTable.fnGetData(node);
                showOrder(rowData.order_fk);
              });
            
            $("#articleTable .newOrderButton").button();
            $("#articleTable").on("click", ".newOrderButton", function()
              {
                var node = $(this).parentsUntil("tr").parent().get(0);
                var rowData = oTable.fnGetData(node);
                
                showNewOrderForm({articleID: rowData.id});
                
                
              });
            
            
            $("#articleTable .addToOrderButton").button();
            $("#articleTable").on("click", ".addToOrderButton", function()
              {
                var node = $(this).parentsUntil("tr").parent().get(0);
                var rowData = oTable.fnGetData(node);
                
                addArticleToOrder(currentOrderID, rowData.id, function(response)
                  {
                    
                  });
                
                
              });
            
            
            
            $("#articleTable").on("click", "td.editable",   function onEditCellClick()
              {
                
                var node = $(this).parent().get(0);
                var cell = this;
                var $cell = $(this);
                if(!$cell.hasClass("editing"))
                {
                  $cell.addClass("editing");
                  var oldValue = $cell.text();
                  $cell.empty();
                  var $input = $('<input type="text" value="'+oldValue+'" />');
                  
                  $cell.append($input);
                  $input.focus();
                  $input.on("blur",function()
                    {
                      var newVal =  $(this).val();
                      if(newVal != oldValue)
                      {
                        var rowData = oTable.fnGetData(node);
                        
                        var pos = oTable.fnGetPosition(cell);
                        var key = articleColumns[pos[1]].mDataProp;
                        
                        // save value
                        
                        var fields = {};
                        console.log(key);
                        fields[key] = newVal;
                        console.log(fields);
                        dataService.updateArticle(rowData.id, fields, function(error, result)
                          {
                            
                            if(!error)
                            {
                              // everything went as expected
                              //oTable.fnUpdate(newVal, iRow, iCol);
                              $input.off("blur");
                              $cell.removeClass("editing");
                              $cell.empty();
                              
                              $cell.text(newVal);
                            }
                            else
                            {
                              // error
                              showErrorDialog(error);
                              $input.focus();
                              
                            }
                          });
                        
                        
                      }
                      else
                      {
                        $input.off("blur");
                        $cell.removeClass("editing");
                        $cell.empty();
                        $cell.text(newVal); 
                      }
                      
                    });
                  
                  
                }
                
              });
            
            
            
            
          }
      } );
      
      
      
      
      return oTable;
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
        $(cell).append($button);
        
      }
      
      else
      {
        // is not borrowed
        
        var $createNewOrderButton = $('<a class="newOrderButton">Verleihen</a>');
        
        
        $(cell).append($createNewOrderButton);
        
        var $addToOrderButton = $('<a class="addToOrderButton">hinzufügen ►</a>');
        $(cell).append($addToOrderButton);
        
        
        
      }
      
    }
    
    
    
    
    function createOrderTable($table, columns)
    {
      
      
      var $header = $("<tr />").appendTo($("<thead />").appendTo($table));
      var headers = 
      [
        "ID", "Zeit", "Wer - Person", "Wer - Unit", "Verleiher","Verleih. Einehit", "Anzahl Artikel", "Optionen"
      ];
      
      
      
      $.each(headers, function(index, header)
        {
          $header.append($("<th>"+header+"</th>"));
        });
      
      
      
      
      
      
      var oTable = $table.dataTable( {
          "bJQueryUI": true,
          "bProcessing": true,
          "sAjaxSource": "ajax/orders",
          "iDisplayLength": 25,
          "aoColumns": columns,
          "fnDrawCallback": function()
          {
            
            
            $table.off("click");
            $table.find(" .showOrderButton").button();
            $table.on("click", ".showOrderButton", function()
              {
                var node = $(this).parentsUntil("tr").parent().get(0);
                var rowData = oTable.fnGetData(node);
                showOrder(rowData.id);
              });
            
            
            $table.find(" .deleteButton").button();
            $table.on("click", ".deleteButton", function()
              {
                var node = $(this).parentsUntil("tr").parent().get(0);
                var rowData = oTable.fnGetData(node);
                console.log(rowData);
                deleteOrder(rowData);
              });
            
            
            
          } 
          
      } );
      
      return oTable;
    }
    
    function deleteOrder(orderData)
    {
      if(orderData.number_of_articles >0)
      {
        $("#orderNotEmptyMessage").dialog("open"); 
      }
      else
      {
        dataService.deleteOrder(orderData.id, function(error, result){
        refreshOrderTable();}); 
      }
    }
    
    
    function onCreateOrderIDCell(cell, sData, rowData, iRow, iCol)
    {
      if(sData == currentOrderID)
      {
        $(cell).parent().addClass("orderSelected");
        
      } 
    }
    
    function onCreateOrderOptionCell(cell, sData, rowData, iRow, iCol)
    {
      $('<a class="deleteButton">Löschen</a>').appendTo($(cell));
      $('<a class="showOrderButton">Anzeigen</a>').appendTo($(cell));
      
      
      
    }
    
    
    function showOrder(orderID)
    {
      
      dataService.getOrder(orderID, function(error, data)
        {
          $("body").addClass("editingOrder");
          currentOrderID = orderID;
          refreshArticleTable();
          refreshOrderTable();
          
          var $orderBox = $("#order").show();
          var $order = $orderBox.find(".ui-widget-content");
          
          
          
          $order.empty().show();
          $order.css("max-height", $(window).height()-60);
          
          var $closeButton = $orderBox.find(".closeButton");
          
          $closeButton.off("click", closeOrder);
          $closeButton.button().on("click",closeOrder);
          
          var $printButton = $orderBox.find(".printButton");
          
          $printButton.off("click", printOrder);
          $printButton.button().on("click",printOrder);
          
          $order.append("<h3>ID: "+orderID+"</h3>");
          
          
          var $table = $('<table/>').appendTo($order);
          $table.append("<tr><th>Zeit: </th><td>"+formatTime(data.itime)+"</td></tr>");
         
          
          var fields = {
            borrower: "Wer nimmts? - Person",
            borrower_unit: "Wer nimmts? - Einheit",
            lender: "Verleiher - Person",
            lender_unit: "Verleiher - Einheit"
          };
          
          
          $.each(fields, function(key, label)
            {
              var $input = $('<input type="text" name="'+key+'" value="'+data[key]+'" />').keyup({orderID: orderID},onChangeOrderProperty);
              $table.append($("<tr><th>"+label+": </th></tr>").append($("<td />").append($input)));
            });
          
          
           
          $table = $('<table class="articleTable"/>').appendTo($order);
          
         
          $table.append("<thead><tr><th>ID</th><th>Name</th><th>Geheim-Nr.</th><th>SAP</th></tr></thead>");
          
          var $tableBody = $("<tbody />").appendTo($table);
          $.each(data.articles, function(index, article)
            {
              
              var $row = $("<tr><td>"+article.id+"</td><td>"+article.name+"</td><td>"+(article.ext_id ? article.ext_id : "")+"</td><td>"+article.sap+"</td><td><a class='takeBackButton noPrint'>Zurücknehmen</a></td></tr>");
              $row.data("article", article);
              $row.appendTo($tableBody);
            });
          
          
          
          $table.find(".takeBackButton").button().on("click",function()
            {
              
              var article = $(this).parentsUntil("tr").parent().data("article");
              
              removeArticleFromOrder(orderID, article.id, function(error, result)
                {
                  refreshOrderTable();
                  console.log(error, result);
                });
            });
          
            $order.append("<p class='sign printOnly'>Unterschrift:</p>");
          
        });
    }
    
    function printOrder()
    {
      var $copy = $("#order .ui-widget-content").clone();
      $copy.find(".noPrint").hide();
       $copy.find(".printOnly").show();
      
      $copy.find("input").prop("disabled", "disabled");
      printPopup($copy, "Auftrag");
    }
    
    
    
    function printAll()
    {
      
      printPopupWithURL("/print/articles/all");
    }
    function exportAll()
    {
      document.location.href ="/csv/articles/all";
    }
    function printStock()
    {
      printPopupWithURL("/print/articles/stock");
    }
    function exportStock()
    {
      document.location.href ="/csv/articles/stock";
    }
    
    function printAway()
    {
      
      printPopupWithURL("/print/articles/away");
      
    }
    
    function exportAway()
    {
      document.location.href ="/csv/articles/away";
    }
    
    function printPopup($element, title) 
    {
      
      
      var mywindow = window.open('', 'my div', 'height='+screen.availHeight+',width='+screen.availWidth);
      mywindow.document.write('<html><head>');
      mywindow.document.write('<title>'+title+'</title>');
      mywindow.document.write('<link rel="stylesheet" href="/css/printOrder.css" />');
      mywindow.document.write('<title>'+title+'</title>');
      /*optional stylesheet*/ //mywindow.document.write('<link rel="stylesheet" href="main.css" type="text/css" />');
      mywindow.document.write('</head><body >');
      
      mywindow.document.write($element.html());
      mywindow.document.write('</body></html>');
      
      mywindow.print();
      
      
      return true;
    }
    
    function printPopupWithURL(url, title) 
    {
      
      
      var mywindow = window.open(url, 'Drucken', 'height='+screen.availHeight+',width='+screen.availWidth);
      
      
      mywindow.print();
      
      
      return true;
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
          
          refreshOrderTable(); 
        });
      
      
    }
    
    
    function showNewOrderForm(options)
    {
      dataService.createEmptyOrder(function(error, result)
        {
          currentOrderID = result.insertId;
          refreshOrderTable();
          
          
          
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
        $("#orderIsEmptyMessage").dialog("option", "buttons", {"Ja": function()
            {
              dataService.deleteOrder(currentOrderID, function(error, result){
                  
                  
                  $("#orderIsEmptyMessage").dialog("close");
                  close();
                  
              });
              
            }, "Nein": function()
            {
              $(this).dialog("close");
              close();
        }});
        $("#orderIsEmptyMessage").dialog("open");
      }
      else
      {
        close(); 
      }
      
      
      function close()
      {
        $("body").removeClass("editingOrder");
        currentOrderID = null;
        refreshArticleTable();
        refreshOrderTable(); 
      }
      
      
      
      
      
    }
    function refreshOrderTable()
    {
      window.setTimeout(function()
        {
          console.log("refreshing order table");
          
          $("#orderTable").dataTable().fnReloadAjax();
        }, 0);
    }
    
    
    
    function refreshArticleTable()
    {
      window.setTimeout(function()
        {
          console.log("refreshing table");
          /*
          console.log( $("#articleTable td").length);
          $.each($("#articleTable").dataTable().fnGetNodes(), function(index, row)
          {
          $(row).find("*").off();
          });
          //$("#articleTable tbody td").empty();
          */
          $("#articleTable").dataTable().fnReloadAjax();
        }, 0);
    }
    
    function addArticleToOrder(orderID, articleID, callback)
    {
      dataService.addArticleToOrder(orderID, articleID, function(error, result)
        {
          refreshOrderTable();
          
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



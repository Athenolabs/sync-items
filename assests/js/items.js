var db = null
var request = null

$(document).ready(function(){
	bind_events();
	init_indexedDB();
	window.setTimeout(retrive_and_render_items, 200);
})

bind_events = function(){
	$(".sync-items").click(function(event){
		sync_erpnext_items();
	});

	$(".delete-items").click(function(event){
		delete_items_from_indexedDB();
	})
}

init_indexedDB = function(){
	// In the following line, you should include the prefixes of implementations you want to test.
	window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
	// DON'T use "var indexedDB = ..." if you're not in a function.
	// Moreover, you may need references to some window.IDB* objects:
	window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction || {READ_WRITE: "readwrite"}; // This line should only be needed if it is needed to support the object's constants for older browsers
	window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
	// (Mozilla has never prefixed these objects, so we don't need window.mozIDB*)

	if (!window.indexedDB) {
    	window.alert("Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.");
	}
	else{
		db = null;
		request = indexedDB.open("ItemsDB", 1);  
	    request.onsuccess = function (evt) {
	        db = request.result;
	    };
	 
	    request.onerror = function (evt) {
	    };
	 
	    request.onupgradeneeded = function (evt) {
	        var objectStore = evt.currentTarget.result.createObjectStore("items", 
	                                     { keyPath: "name", autoIncrement: false });
	 
	        objectStore.createIndex("name", "name", { unique: true });
		};
	}

}

retrive_and_render_items = function(){
	get_all_items(function(items){
		if(Object.keys(items).length == 0)
			$("<p>Items Not found in LocalStorage</p>")
		else{
			html = '<table class="table table-bordered"><thead><tr><th>Sr</th><th>Item Code</th><th>Item Name</th></tr></thead><tbody>'
			$.each(items, function(idx, item){
				html += '<tr><td>'+ (idx+1) +'</td><td>'+ item.item_code +'</td><td>'+ item.item_name +'</td></tr>'
			})
			html += "</tbody></table>"
			$(html).appendTo(".items-info");
		}
	});
}

sync_erpnext_items = function(){
	$.ajax({
		type: "POST",
		url: "http://192.168.5.31:9777/api/method/login?usr=administrator&pwd=admin",
		dataType: "json",
		success: function(r) {
			$.ajax({
				type: "GET",
				url: 'http://192.168.5.31:9777/api/resource/Item/?fields=["name","item_name", "item_code"]',
				dataType: "json",
				success: function(result){
					add_records(result.data, function(){
					});
				},
				error: function(result){
				}
			}).always(function(){
				$('.btn-primary').prop("disabled", false);
			})
		},
		error: function(r){
		}
	});
}

delete_items_from_indexedDB = function(){
}

get_all_items = function(callback){
	var items = []
	var transaction = db.transaction(["items"], "readonly");
	var store = transaction.objectStore("items")
	var cursorRequest = store.openCursor();

	cursorRequest.onerror = function(error) {
	};

	cursorRequest.onsuccess = function(evt) {
	    var cursor = evt.target.result;
	    if (cursor) {
	        items.push(cursor.value);
	        cursor.continue();
	    }
	    else
	        callback(items)
	};
}

add_records = function(items,callback){
	var transaction = db.transaction(["items"], "readwrite");
	var store = transaction.objectStore("items")
	$.each(items, function(idx, item){
		store.put(item).onsuccess = function(){
		}
	})
}
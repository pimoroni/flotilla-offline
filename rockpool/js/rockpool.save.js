var rockpool = rockpool || {};
rockpool.loadFromFile = function(file_name){
	$.ajax({
		url: "/saves/" + file_name + ".json",
		dataType: "json",
		success: function(data){
			rockpool.clear();
			rockpool.deserialize(data);
		},
		error: function(obj,error_text){
			console.log(error_text);
		}
	});

}

rockpool.deserialize = function(source){
    if( typeof(source) === 'string' ){
        source = JSON.parse(source);
    }

    for( var x = 0; x < source.length; x++ ){
        var temp = new rockpool.rule(source[x]);
    }
}

rockpool.serialize = function(){
    var rules = [];
    rockpool.forRules(function(rule){
        rules.push(rule.serialize())
    });
    return '[' + rules.join(',') + ']';
}

rockpool.delPersistentValue = function(key){
    localStorage.removeItem(key);
}

rockpool.getPersistentValue = function(key, default_value){
    if( key in localStorage ){
        return localStorage[key];
    }
    return default_value;
}

rockpool.setPersistentValue = function(key, value){
    localStorage.setItem(key, value);
}

rockpool.saveListLoad = function(){

    var saves = rockpool.getPersistentValue('save_index',[]);

    if( typeof(saves) === "string" ){
        saves = saves.split(',');
    }

    return saves;

}

rockpool.saveListSave = function(list){

	list = list.join(',');
	rockpool.setPersistentValue('save_index',list)

}

rockpool.saveLoad = function(id){

	id = id.toLowerCase().replace(' ','_');

	var save = rockpool.getPersistentValue('save_' + id, null);

	if( save != null ){
		return save;
		save = JSON.parse(save);
	}

	return null;

}

rockpool.saveSave = function(title, data){

	var id = title.toLowerCase().replace(' ','_');

	if( typeof(data) !== "string" ){
		data = JSON.stringify(data);
	}

	var savelist = rockpool.saveListLoad();

	if( savelist.indexOf(id) == -1 ){
		savelist.push(id);
		rockpool.saveListSave(savelist);
	}

	rockpool.setPersistentValue('save_' + id, data);

}

rockpool.saveDelete = function(id){

	id = id.toLowerCase().replace(' ','_');

	var savelist = rockpool.saveListLoad();
	var idx;

	if( (idx = savelist.indexOf(id)) >-1 ){
		savelist.splice(idx,1);
		rockpool.saveListSave(savelist);
		rockpool.delPersistentValue('save' + id);
	}

}

rockpool.loadState = function(name){

	var data = rockpool.saveLoad(name);
	if( data != null ){
		rockpool.deserialize(data);
	}

}

rockpool.saveCurrentState = function(name){

	var data = rockpool.serialize();
	rockpool.saveSave(name, data);

}
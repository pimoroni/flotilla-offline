var rockpool = rockpool || {};

rockpool.personalise = function(host){

	var dom_ui = $("<div>").addClass("personalise palette");

	$("<header><h1>name your dock</h1></header>").appendTo(dom_ui);

	var dom_user_label = $("<p>").text("Your name:").appendTo(dom_ui);
	var dom_user = $("<input>").attr({maxlength:8}).addClass("dockUser").val(rockpool.dock_user).appendTo(dom_ui);

	var dom_name_label = $("<p>").text("Dock name:").appendTo(dom_ui);
	var dom_name = $("<input>").attr({maxlength:8}).addClass("dockName").val(rockpool.dock_name).appendTo(dom_ui);

	var submit = $("<i>").addClass("dockSubmit").appendTo(dom_ui);

	submit.on('click',function(){
		var dock_name = dom_name.val();
		var dock_user = dom_user.val();

		if(dock_name.length > 8){
			// Validation error
			return;
		}
		if(dock_user.length > 8){
			// Validation error
			return;
		}

		rockpool.setDockName(host, dock_name);
		rockpool.setDockUser(host, dock_user);

		rockpool.closePrompt();
	});

	rockpool.prompt(dom_ui, false);

}
window.onload = function() {
	(() => {
		user_info_str = localStorage.getItem('user_info');
		if (user_info_str) {
			if (typeof user_info_str === 'object') {
				set_user_info(user_info_str);
			} else {
				set_user_info(JSON.parse(user_info_str));
			}
		}
	})();

	function getUserName() {
		user_info_str = localStorage.getItem('user_info');
		if (user_info_str) {
			if (typeof user_info_str === 'object') {
				return user_info_str.username;
			} else {
				return JSON.parse(user_info_str).username;
			}
		}
	}

	function getUserToken() {
		user_info_str = localStorage.getItem('user_info');
		if (user_info_str) {
			if (typeof user_info_str === 'object') {
				return user_info_str.token;
			} else {
				return JSON.parse(user_info_str).token;
			}
		}
	}

	function getUserGroups() {
		user_info_str = localStorage.getItem('user_info');
		if (user_info_str) {
			if (typeof user_info_str === 'object') {
				return user_info_str.groups;
			} else {
				return JSON.parse(user_info_str).groups;
			}
		}
	}

	function open_login_modal(event) {
		document.getElementById('id01').style.display = 'block';
	}
	document.getElementById('open_login').onclick = open_login_modal;

	function open_register_modal(event) {
		document.getElementById('id02').style.display = 'block';
	}
	document.getElementById('open_register').onclick = open_register_modal;

	function cancel_login_modal(event) {
		document.getElementById('id01').style.display = 'none';
	}
	document.getElementById('cancel_login').onclick = cancel_login_modal;

	function cancel_register_modal(event) {
		document.getElementById('id02').style.display = 'none';
	}
	document.getElementById('cancel_register').onclick = cancel_register_modal;

	function cancel_groups_modal(event) {
		document.getElementById('id03').style.display = 'none';
	}
	document.getElementById('cancel_groups').onclick = cancel_groups_modal;

	document.getElementById('logout').onclick = () => {
		chrome.tabs.query({active:true, currentWindow:true}, function(tabs){
			chrome.tabs.sendMessage(tabs[0].id, { type:"destroyToken" }, (response) => {
				localStorage.removeItem('user_info');
				show_login_buttons();
			});
		});
	}

	document.getElementById('groups').onclick = () => {
		document.getElementById('id03').style.display = 'block';
		update_user_groups();
	}

	Element.prototype.remove = function() {
		this.parentElement.removeChild(this);
	}

	NodeList.prototype.remove = HTMLCollection.prototype.remove = function() {
		for(var i = this.length - 1; i >= 0; i--) {
			if(this[i] && this[i].parentElement) {
				this[i].parentElement.removeChild(this[i]);
			}
		}
	}

	function update_user_groups() {

		// Remove all elements before repopulating list
		document.getElementsByClassName("populated").remove();
		var groupsDiv = document.getElementById('currentGroups');

		// Add default option "Myself"
		var value = "Myself";
		var radio = document.createElement('input');
		var label = document.createElement('label');

		radio.type = 'radio';
		radio.name = 'groupOption';
		radio.value = value;
		radio.className = 'populated';
		radio.style="vertical-align: middle; margin: 0px;";
		radio.checked = true;

		label.setAttribute("for", value);
		label.innerHTML = value;
		label.className = 'populated';
		label.style="vertical-align: middle; margin: 0px;";

		var spacing = document.createElement('br');
		spacing.className = 'populated';

		groupsDiv.appendChild(radio);
		groupsDiv.appendChild(label);
		groupsDiv.appendChild(spacing);

		// Add other groups
		getUserGroups().forEach(function(element) {
			//console.log(element.name);
			var value = element.name;
			var radio = document.createElement('input');
			var label = document.createElement('label');

			radio.type = 'radio';
			radio.name = 'groupOption';
			radio.value = value;
			radio.className = 'populated';
			radio.style="vertical-align: middle;  margin: 0px;";
			radio.onchange = radioListener;

			label.setAttribute("for", value);
			label.innerHTML = value;
			label.className = 'populated';
			label.style="vertical-align: middle;  margin: 0px;";

			var spacing = document.createElement('br');
			spacing.className = 'populated';

			groupsDiv.appendChild(radio);
			groupsDiv.appendChild(label);
			groupsDiv.appendChild(spacing);
		});
	}

	function radioListener() {
		console.log(this.value);
		chrome.tabs.query({active:true, currentWindow:true}, function(tabs){
			chrome.tabs.sendMessage(tabs[0].id, {type:"setActiveGroup", message: this.value}, (response) => {
			});
		});
	}

	function show_login_buttons() {
		document.getElementById('account-buttons').style.display = 'block';
		document.getElementById('account-info').style.display = 'none';
	}

	function set_user_info(user_info) {
		document.getElementById('username').textContent = 'Hello, ' + user_info.username;

		document.getElementById('account-buttons').style.display = 'none';
		document.getElementById('account-info').style.display = 'block';
	}

	const serialize_form = form => JSON.stringify(
	  Array.from(new FormData(form).entries())
		   .reduce((m, [ key, value ]) => Object.assign(m, { [key]: value }), {})
	);

	user_info_str = localStorage.getItem('user_info');
		if (user_info_str) {
			if (typeof user_info_str === 'object') {
				return user_info_str.token;
			} else {
				return JSON.parse(user_info_str).token;
			}
		}

	$('#create-group-button').on('click', function(event) {
		$.ajax({
			type: "POST",
			url: "https://api.swimfanatic.net:6443/groups/create",
			success: function(result){
					// alert(JSON.stringify(result, undefined, 2));
					var user_info = { username: getUserName(), groups: result.memberTo, token: getUserToken()}
					localStorage.setItem('user_info', JSON.stringify(user_info));
					console.log("New group created: " + result.created);
					update_user_groups();
				},
			error: function(error) {
				// TODO: Feedback for user
				alert("ERROR Code 102\n" + JSON.stringify(error, undefined, 2));
			},
			dataType: "json",
			contentType : "application/json",
			headers:
			{
				'Authorization': 'Bearer ' + getUserToken()
			}
		});
	});

	$('#groups_form button').on('click', function(event) {
		event.preventDefault();
		const json = serialize_form(this.parentElement.parentElement);

		if($(this).attr("value")=="join") {
			//console.log("join");
			$.ajax({
				type: "POST",
				url: "https://api.swimfanatic.net:6443/groups/join",
				data: json,
				success: function(result) {
					var user_info = {
						id: result.user.id,
						username: result.user.username,
						token: result.user.token,
						groups: result.user.groups,
					};
					localStorage.setItem('user_info', JSON.stringify(user_info));
					update_user_groups();
				},
				error: function(error){
					// TODO: Feedback for user
					alert("ERROR Code 101\n" + JSON.stringify(error, undefined, 2));
				},
				dataType: "json",
				contentType : "application/json",
				headers:
				{
					'Authorization': 'Bearer ' + getUserToken()
				}
			});
		}
		else if($(this).attr("value")=="leave") {
			//console.log("leave");
			$.ajax({
				type: "POST",
				url: "https://api.swimfanatic.net:6443/groups/leave",
				data: json,
				success: function(result) {
					var user_info = {
						id: result.user.id,
						username: result.user.username,
						token: result.user.token,
						groups: result.user.groups,
					};
					localStorage.setItem('user_info', JSON.stringify(user_info));
					update_user_groups();
				},
				error: function(error){
					// TODO: Feedback for user
					alert("ERROR Code 101\n" + JSON.stringify(error, undefined, 2));
				},
				dataType: "json",
				contentType : "application/json",
				headers:
				{
					'Authorization': 'Bearer ' + getUserToken()
				}
			});
		}

		//$("#groups_form").submit();
	});

	$('#register_form').on('submit', function(event) {
		event.preventDefault();
		const json = serialize_form(this);

		$.ajax({
			type: "POST",
			url: "https://api.swimfanatic.net:6443/users/signup",
			data: json,
			success: function(result){
				var token = result.newUser.token;
				chrome.tabs.query({active:true, currentWindow:true}, function(tabs){
					chrome.tabs.sendMessage(tabs[0].id, {type:"setToken", message: token}, (response) => {
						var user_info = {
							id: result.user.id,
							username: result.user.username,
							token: result.user.token,
							groups: result.user.groups,
						};
						localStorage.setItem('user_info', JSON.stringify(user_info));
						set_user_info(user_info);
						cancel_register_modal();
					});
				});
				// chrome.tabs.query({active:true, currentWindow:true}, function(tabs){
				// 	chrome.tabs.sendMessage(tabs[0].id, {type:"setUpComments", message: token}, (response) => {});
				// });
			},
			error: function(error){
				// TODO: Feedback for user
				alert("ERROR Code 101\n" + JSON.stringify(error, undefined, 2));
			},
			dataType: "json",
			contentType : "application/json"
		});

	});


	$('#login_form').on('submit', function(event) {
		event.preventDefault();
		const json = serialize_form(this);

		$.ajax({
			type: "POST",
			url: "https://api.swimfanatic.net:6443/users/login",
			data: json,
			success: function(result){
				// alert(JSON.stringify(result, undefined, 2));
				var token = result.user.token;
				chrome.tabs.query({active:true, currentWindow:true}, function(tabs){
					chrome.tabs.sendMessage(tabs[0].id, {type:"setToken", message: token}, (response) => {
						var user_info = {
							id: result.user.id,
							username: result.user.username,
							token: result.user.token,
							groups: result.user.groups,
						};
						localStorage.setItem('user_info', JSON.stringify(user_info));
						set_user_info(user_info);
						cancel_login_modal();
					});
				});
				// chrome.tabs.query({active:true, currentWindow:true}, function(tabs){
				// 	chrome.tabs.sendMessage(tabs[0].id, {type:"setUpComments", message: token}, (response) => {});
				// });
			},
			error: function(error) {
				// TODO: Feedback for user
				alert("ERROR Code 102\n" + JSON.stringify(error, undefined, 2));
			},
			dataType: "json",
			contentType : "application/json"
		});
	});

}

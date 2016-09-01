var gitapp = {
	appName : 'gitapp',
	BASE_URL : 'https://api.github.com/users/',
	users : [],
	sortedby : null,
	// get the users from local storage
	getAllUsers : function(){
		var self = this;
		self.users = JSON.parse(localStorage.getItem('githubUsers'));
		if (self.users) {
			for (var i = 0; i < self.users.length; i++) {
				self.addUser(self.users[i]);
			}
		}else{
			var temp = [];
			self.users = [];
			localStorage.setItem('githubUsers',JSON.stringify(temp))
		}
		
	},
	// get the users from gihub api
	fetchUser : function(){
		var githubLogin = document.getElementById('login-input').value;
		document.getElementById('login-input').value = '';
		githubLogin = githubLogin.trim();
		var self = this;
		if (!self.validate(githubLogin)) {
			return;
		}
		var url = this.BASE_URL + githubLogin;
		var req = new XMLHttpRequest();
		req.onreadystatechange = function() {
			var loader = document.getElementById('loader').style;
			loader.visibility = 'visible';
		    if (req.readyState == 1) {
		    	loader.width = '35%';
		    }
		    if (req.readyState == 2) {
		    	loader.width = '45%';
		    }
		    if (req.readyState == 3) {
		    	loader.width = '60%';
		    }
		    if (req.readyState == 4) {
		    	loader.width = '100%';
		    	if (req.status == 200) {
		    		var user = JSON.parse(req.responseText);
	        		// push to user array if doesn't exist already
					if(self.pushUser(user)){
			        	self.addUser(user);
			    	}
			    }else if(req.status == 404){
			    	var tempError = JSON.parse(req.responseText);
			    	tempError.userInput = githubLogin;
			    	tempError.status = 404;
			    	self.handleError(tempError);
			    }else if(req.status == 403){
			    	var tempError = JSON.parse(req.responseText);
			    	tempError.userInput = githubLogin;
			    	tempError.status = 403;
			    	self.handleError(tempError);
			    }
			    loader.visibility = 'hidden';
			    setTimeout(function() {
		    		loader.width = '0%';
			    }, 1000);

		    }
		};
		req.open("GET", url, true);
		req.send();
	},
	// add a user from gihub api
	addUser : function(user){
		// got our template
		var template = document.getElementById('template');
		// fill the appropriate values to the element
		template.content.querySelector("li").setAttribute('id','user-'+user.id);
		template.content.querySelector(".html_link").href = user.html_url;
		template.content.querySelector(".avatar img").src = user.avatar_url;
		template.content.querySelector(".about .name .value").innerHTML = user.name?user.name:'NAME NOT PROVIDED';
		template.content.querySelector(".about .location .value").innerHTML = user.location?user.location:'N/A';
		template.content.querySelector(".about .followers .value").innerHTML = user.followers;
		// append it to the container
		var container = document.getElementById('users');
		var clone = document.importNode(template.content,true);
		container.insertBefore(clone,container.childNodes[0]);
	},
	// remove a user from the app
	removeUser : function(id){
		var self = this;
		var index;
		for (var i = 0; i < self.users.length; i++) {
			if(self.users[i].id == id){
				index = i;
				self.users.splice(i,1);
				localStorage.setItem('githubUsers',JSON.stringify(self.users));
				return;
			}
		}
	},
	// error handler
	handleError : function(error){
		var errorText;
		if (error.status == 404) {
			errorText = "No user found by the handle name " + error.userInput;
		}
		else if (error.duplicate) {
			errorText = error.error;
		}else if(error.empty){
			errorText = error.error;
			document.querySelector('#login-input').focus();
		}else if(error.status == 403){
			errorText = error.message;
		} 
		var errContainer = document.getElementById('error-container')
		errContainer.innerHTML = errorText;
		errContainer.setAttribute('class','error-container shown-error');
		
	},
	// validate input data
	validate : function(data){
		var self = this;
		var error = {};
		if (!data || data.length == 0) {
			error = {
				empty:true,
				error : "github login can't be blank"
			};
			self.handleError(error);
			return false;
		}
		for (var i = 0; i < self.users.length; i++) {
			if(self.users[i].login.toLowerCase() == data.toLowerCase()){
				error = {
					duplicate : true,
					error : 'user ' + data + ' is already added in the list',
					matched : self.users[i]
				}
				self.handleError(error)
				return false;
			}
		}
		return true;
	},
	// add necessary event listeners
	pushUser : function(user){
		var self = this;
		var users = self.users;
		for (var i = 0; i < users.length; i++) {
			if(users[i].id == user.id){
				var error = {
					duplicate : true,
					error : 'Already added the user',
					matched : users[i]
				}
				self.handleError(error);
				return false;
			} 
		}
		users.push(user);
		localStorage.setItem('githubUsers',JSON.stringify(users));
		return true;
		console.log(self.users);
	},
	sortUser:function(type){
		var self = this;
		var container = document.getElementById('users');
		container.innerHTML = '';
		
		var nodes = document.getElementById('filter-option').childNodes;
		for(var i=0; i<nodes.length; i++) {
		    if (nodes[i].nodeName.toLowerCase() == 'li') {
		        nodes[i].setAttribute('class','unSorted')
		    }
		}

		if (self.sortedby == type) {
			self.sortedby = null;
			self.getAllUsers();
			return;
		}else{
			self.sortedby = type;
		}

		document.getElementById('sort-'+type).setAttribute('class','sorted');
		if (type == 'name') {
			self.users.sort(self.compareName);
		}else if(type == 'follower'){
			self.users.sort(self.compareFollower);
		}
		for (var i = 0; i < self.users.length; i++) {
			self.addUser(self.users[i]);
		}
	},
	compareName:function(obj1,obj2){
		if (!obj1.name)
			return -1
		if (!obj2.name)
			return 1;
		if (obj1.name > obj2.name)
			return -1;
		if (obj1.name < obj2.name)
			return 1;
		return 0;
	},
	compareFollower:function(obj1,obj2){
		if (obj1.followers < obj2.followers)
			return -1;
		if (obj1.followers > obj2.followers)
			return 1;
		return 0;
	}
};

function getUser(){
	gitapp.fetchUser('e-reaper');
}
function sort(type){
	gitapp.sortUser(type);
}
function hideError(){
	var errContainer = document.getElementById('error-container')
	errContainer.setAttribute('class','error-container');
}
window.onload = function (argument) {
	gitapp.getAllUsers();
	document.getElementById('users').onclick = function(e){
		console.log(e.target);
		var deleter = e.target;
		if (e.target.getAttribute('class') == 'fa fa-close' || e.target.getAttribute('class') == 'remove-user' ) {
			console.log(e.target.parentNode);	
			var target = e.target;
			while(target.getAttribute('class') != 'user-card' && target != null){
				target = target.parentNode;
			}		
			console.log(target.id);
			target.setAttribute('class','user-card deleted');
			gitapp.removeUser(target.id.split('-')[1]);
			document.getElementById(target.id).parentNode.removeChild(target);
		}
	}
}

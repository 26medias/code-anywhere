(function() {
	
	var ftl = function() {
		this.auth			= false;
		this._jsonPrefix 	= ":json:";
		this.page			= 'projects';
	};
	ftl.prototype.apicall	= function(options) {
		var scope = this;
		
		options	= _.extend({
		}, options);
		
		var ajaxObj = {
			url: 		options.url,
			dataType: 	options.type||'json',
			type:		options.type||"POST",
			data:		options.params,
			headers:	options.headers,
			success: 	function(response, status){
				options.callback(response, status);
			},
			error: function(jqXHR, data, errorThrown, core) {
				console.log("AJAX Error", {
					core:			core,
					data:			data,
					options:		options,
					errorThrown:	errorThrown
				});
				window.ftl.dialog.open('ajax-error', {
					req:	options,
					error:	data
				});
				if (options.onError) {
					options.onError({
						error:		true,
						message:	errorThrown
					});
				}
			}
		};
		
		//console.log("ajaxObj",ajaxObj);
		
		if (options.json) {
			ajaxObj.data = JSON.stringify(ajaxObj.data);
		}
		
		if (options.crossDomain) {
			ajaxObj.crossDomain	= true;
			ajaxObj.contentType = "application/json";
		}
		
		$.ajax(ajaxObj);
	};
	ftl.prototype.qs = function() {
		var urlParams;
		var match,
		pl     = /\+/g,  // Regex for replacing addition symbol with a space
		search = /([^&=]+)=?([^&]*)/g,
		decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
		query  = window.location.search.substring(1);
	
		urlParams = {};
		while (match = search.exec(query))
		urlParams[decode(match[1])] = decode(match[2]);
		return urlParams;
	};
	ftl.prototype.uuid	= function() {
		return 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
			return v.toString(16);
		});
	};
	ftl.prototype.sid	= function() {
		return 'xxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
			return v.toString(16);
		});
	};
	// Open links in the OS's default browser
	ftl.prototype.openLink	= function(link) {
		console.log("openLink", link);
		shell.openExternal(link);
	};
	
	// Cookies
	ftl.prototype._setCookie = function(name,value,days) {
		
		// encode JSON if required
		if (typeof value != "string" && typeof value != "number") {
			value = this._jsonPrefix+JSON.stringify(value);
		}
		
		if (days) {
			var date = new Date();
			date.setTime(date.getTime()+(days*24*60*60*1000));
			var expires = "; expires="+date.toGMTString();
		} else{
			var expires = "";
		}
		document.cookie = name+"="+value+expires+"; path=/;";
		
		return true;
	};
	ftl.prototype.setCookie = function(name,value,days) {
		this._setCookie(name,value,days);
		this._setCookie(name+'_created',(new Date()).getTime(),days);
		return true;
	};
	ftl.prototype.getCookie = function(name) {
		try {
			var nameEQ = name + "=";
			var ca = document.cookie.split(';');
			for(var i=0;i < ca.length;i++) {
				var c = ca[i];
				while (c.charAt(0)==' ') c = c.substring(1,c.length);
				if (c.indexOf(nameEQ) == 0){
					var cookieValue = c.substring(nameEQ.length,c.length);
					//console.log("cookieValue",cookieValue.substr(0, this._jsonPrefix.length) == this._jsonPrefix, cookieValue.substr(this._jsonPrefix.length));
					// Now we decode if required
					if (cookieValue.substr(0, this._jsonPrefix.length) == this._jsonPrefix) {
						cookieValue = JSON.parse(cookieValue.substr(this._jsonPrefix.length));
						//console.log("cookieValue", cookieValue);
						return cookieValue;
					}
					return null;//cookieValue;
				}
			}
		} catch(e) {
			console.log("Invalid Json Cookie:", name, cookieValue);
			return null;
		}
		return false;
	};
	ftl.prototype.getCookies = function() {
		var cookies = {};
		if (document.cookie && document.cookie != '') {
			var split = document.cookie.split(';');
			for (var i = 0; i < split.length; i++) {
				var name_value = split[i].split("=");
				name_value[0] = name_value[0].replace(/^ /, '');
				cookies[decodeURIComponent(name_value[0])] = decodeURIComponent(name_value[1]);
				if (cookies[decodeURIComponent(name_value[0])].substr(0, this._jsonPrefix.length) == this._jsonPrefix) {
					cookies[decodeURIComponent(name_value[0])] = JSON.parse(cookies[decodeURIComponent(name_value[0])].substr(this._jsonPrefix.length));
				}
			}
		}
		return cookies;
	};
	ftl.prototype.cookieAge = function(name) {
		var cookie = this.getCookie(name+'_created');
		
		if (!cookie) {
			return false;
		}
		
		var cookieCreation	= new Date(parseInt(cookie)).getTime();
		var timestamp		= new Date().getTime()
		
		return timestamp-cookieCreation;
	};
	ftl.prototype.map_value = function(x,  in_min,  in_max,  out_min,  out_max) {
		return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
	};
	
	window.ftl = new ftl();
	
	// FTL plugins
	
	// == Dialog ==
	window.ftl.dialog = {
		visible:	true,
		front:	 	"",
		status:	 	{},
		payload:	{},
		open:	function(id, payload) {
			//console.log("dialog.open", id);
			//console.trace();
			window.ftl.dialog.status[id]	= true;
			window.ftl.dialog.payload[id]	= payload;
			window.ftl.dialog.front			= id;
			window.Arbiter.inform("dialog.opened", {id:id, payload:payload});
		},
		close:	function(id) {
			window.ftl.dialog.status[id]	= false;
			window.ftl.dialog.front			= null;
			delete window.ftl.dialog.payload[id];
			window.Arbiter.inform("dialog.closed", {id:id});
		},
		hide:	function() {
			window.ftl.dialog.visible		= false;
			window.Arbiter.inform("dialog.hidden", {});
		},
		show:	function() {
			window.ftl.dialog.visible		= true;
			window.Arbiter.inform("dialog.shown", {});
		},
	};
	
	window.ftl.editor = {
		openProject:	function(pid) {
			// Select the project
			window.ftl.data.settings.settings.project = pid;
			// Close the open files
			window.ftl.data.settings.files	= [];
			// Delete the cache
			window.ftl.data.cache			= {};
			// Show the file list
			window.ftl.data.settings.settings.project	= pid;
			window.ftl.data.settings.settings.sidebar	= 'files';
		},
		open:	function(filename, callback) {
			if (!window.ftl.data.settings) {
				return false;
			}
			// Open the file content
			window.ftl.apicall({
				url:		'/api/projects/file/open',
				params:		{
					root:	window.ftl.data.settings.projects[window.ftl.data.settings.settings.project].directory,
					file:	filename
				},
				callback:	function(response) {
					//console.log("/api/projects/file/open response",response);
					
					if (!window.ftl.data.settings.files) {
						window.ftl.data.settings.files = [];
					}
					if (!_.contains(window.ftl.data.settings.files, filename)) {
						window.ftl.data.settings.files.push(filename);
					}
					window.ftl.data.settings.settings.file	= filename;
					window.ftl.data.cache[filename]			= response.data;
					if (callback) {
						callback(response.data);
					}
				}
			});
		},
		close:	function(filename) {
			window.ftl.data.settings.files = _.filter(window.ftl.data.settings.files, function(item) {
				return filename!=item;
			});
			delete window.ftl.data.cache[filename];
		},
		current: {
			save:	function(callback) {
				if (!window.ftl.data.settings) {
					return false;
				}
				window.Arbiter.inform('file.save.start');
				// Open the file content
				window.ftl.apicall({
					url:		'/api/projects/file/save',
					params:		{
						root:	window.ftl.data.settings.projects[window.ftl.data.settings.settings.project].directory,
						file:	window.ftl.data.settings.settings.file,
						data:	window.ftl.data.cache[window.ftl.data.settings.settings.file]
					},
					callback:	function(response) {
						//console.log("/api/projects/file/save response",response);
						window.Arbiter.inform('file.save.end');
						if (callback) {
							callback();
						}
					}
				});
			},
			saveAs:	function() {
				if (!window.ftl.data.settings) {
					return false;
				}
				window.ftl.dialog.open('save-as', {
					name:	'copy_'+window.ftl.data.settings.settings.file,
					callback:	function(name) {
						// Open the file content
						window.ftl.apicall({
							url:		'/api/projects/file/save',
							params:		{
								root:	window.ftl.data.settings.projects[window.ftl.data.settings.settings.project].directory,
								file:	name,
								data:	window.ftl.data.cache[window.ftl.data.settings.settings.file]
							},
							callback:	function(response) {
								console.log("/api/projects/file/save-as response",response);
								if (callback) {
									callback();
								}
							}
						});
					}
				})
			},
			remove:	function() {
				var c = confirm("Are you sure?");
				if (!c) {
					return false;
				}
				window.ftl.apicall({
					url:		'/api/projects/file/remove',
					params:		{
						root:	window.ftl.data.settings.projects[window.ftl.data.settings.settings.project].directory,
						file:	window.ftl.data.settings.settings.file
					},
					callback:	function(response) {
						//console.log("/api/projects/file/remove response",response);
						// Close the file
						window.ftl.editor.close(window.ftl.data.settings.settings.file);
						if (callback) {
							callback();
						}
					}
				});
			}
		}
	};
	
	// Data provider
	// I/O
	window.ftl.data = {
		cache:			{},
		getSettings:	function(callback) {
			window.ftl.apicall({
				url:		'/api/settings/get',
				params:		{},
				callback:	function(response) {
					//console.log("/api/settings/get response",response);
					window.ftl.data.settings = response;
					if (callback) {
						callback();
					}
				}
			});
		},
		saveSettings:	function(callback) {
			//console.log("saveSettings()", window.ftl.data.settings);
			if (!window.ftl.data.settings) {
				console.log("No settings found");
				return false;
			}
			window.ftl.apicall({
				url:		'/api/settings/save',
				params:		{
					settings:	window.ftl.data.settings
				},
				callback:	function(response) {
					if (callback) {
						callback();
					}
				}
			});
		},
		recordHistory:	function(name, id, data, callback) {
			// Read the settings
			var homedir	= require('os').homedir();
			var filename	= path.normalize(homedir+"/Quant-Studio/history_"+name+".json");
			fstool.file.readJson(filename, function(jsonSettings) {
				if (!jsonSettings) {
					jsonSettings = {};
				}
				if (!jsonSettings.history) {
					jsonSettings.history = {};
				}
				jsonSettings.history[id] = {
					date:	new Date().getTime(),
					data:	data
				};
				fstool.file.write(filename, JSON.stringify(jsonSettings, null, 4), function() {
					if (callback) {
						callback(jsonSettings);
					}
				});
			});
		},
		getHistory:	function(name, callback) {
			// Read the settings
			var homedir	= require('os').homedir();
			var filename	= path.normalize(homedir+"/Quant-Studio/history_"+name+".json");
			fstool.file.readJson(filename, function(jsonSettings) {
				if (!jsonSettings || !jsonSettings.history) {
					callback(false);
					return false;
				}
				jsonSettings.history = _.values(jsonSettings.history);
				jsonSettings.history.sort(function(a,b) {
					return b.date-a.date;
				});
				callback(jsonSettings.history);
			});
		},
		read:	function(name, callback) {
			// Read the settings
			var homedir	= require('os').homedir();
			var filename	= path.normalize(homedir+"/Quant-Studio/"+name+".json");
			fstool.file.readJson(filename, function(jsonSettings) {
				if (callback) {
					callback(jsonSettings);
				}
			});
		},
		update:	function(name, modifier, callback) {
			// Read the settings
			var homedir	= require('os').homedir();
			var filename	= path.normalize(homedir+"/Quant-Studio/"+name+".json");
			var filepath	= path.dirname(filename);
			
			fstool.file.readJson(filename, function(jsonSettings) {
				modifier(jsonSettings, function(response) {
					fstool.file.write(filename, JSON.stringify(response, null, 4), function() {
						if (callback) {
							callback(response);
						}
					});
				});
			});
		},
		write:	function(name, data, callback) {
			// Read the settings
			var filename	= path.normalize(homedir+"/Quant-Studio/"+name+".json");
			var filepath	= path.dirname(filename);
			fstool.file.write(filename, JSON.stringify(data, null, 4), function() {
				if (callback) {
					callback();
				}
			});
		}
	};
	
})(window)
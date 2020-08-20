var path	= require('path');
var fs		= require('fs');
var pstack	= require('pstack');
var fstool	= require('fs-tool');
var glob	= require("glob");
var walk	= require("walk");
var _		= require("underscore");
var mkdirp	= require("mkdirp");

var homedir	= __dirname; //require('os').homedir();
var appDir	= path.normalize(homedir+'/settings/');
var core = {};

//console.log("homedir",homedir);
//console.log("appDir",appDir);


core.sid	= function() {
	return 'xxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
		return v.toString(16);
	});
};


core.projects	= {
	list:	function(callback) {
		var stack	= new pstack();
		var buffer	= {};
		
		// Get the settings
		stack.add(function(done) {
			core.data.getSettings(function(settings) {
				buffer.settings = settings;
				done();
			});
		});
		
		stack.start(function() {
			callback(buffer.settings.projects);
		});
	},
	files:	function(pid, callback) {
		var stack	= new pstack();
		var buffer	= {};
		
		// Get the settings
		stack.add(function(done) {
			core.data.getSettings(function(settings) {
				buffer.settings = settings;
				buffer.project	= buffer.settings.projects[pid];
				done();
			});
		});
		
		// Get the settings
		stack.add(function(done) {
			
			var directory = buffer.project.directory
			
			//console.log("buffer.project.directory", directory);
			var options = {
				followLinks: 	false,
				filters: 		buffer.project.ignore||[]
			};
			
			var ignore	= [];
			var files	= [];
			
			// Walker options
			var walker  = walk.walk(directory, options);
			
			walker.on('directory', function(root, stat, next) {
				if (_.contains(buffer.project.ignore||[], stat.name)) {
					ignore.push(path.normalize(root + '/' + stat.name))
				}
				next();
			});
			
			walker.on('file', function(root, stat, next) {
				var filename	= path.normalize(root + '/' + stat.name);
				//console.log("filename",filename);
				//console.log("ignore",ignore);
				var allowed		= true;
				var i;
				for (i=0;i<ignore.length;i++) {
					//console.log("------",ignore[i], filename.substring(0, ignore[i].length));
					if (ignore[i] == filename.substring(0, ignore[i].length)) {
						allowed = false;
						break;
					}
				}
				if (allowed) {
					files.push(filename.substring(buffer.project.directory.length+1));
				}
				next();
			});
			
			
			walker.on('end', function() {
				//console.log("files",files);
				buffer.files = files;
				done();
			});
		});
		
		// Create the tree
		stack.add(function(done) {
			buffer.files	= buffer.files.sort();
			var roots		= {};
			var tree		= [];
			buffer.files	= _.map(buffer.files, function(file) {
				var root		= path.dirname(file);
				var basename	= path.basename(file);
				return {
					root:		root,
					filename:	basename,
					full:		file
				}
			});
			buffer.files.sort(function(a, b) {
				return a.root>b.root?1:-1;
			});
			_.each(buffer.files, function(file) {
				if (file.root !='.' && !roots[file.root]) {
					roots[file.root]	= true;
					var state			= {};
					if (buffer.project.filetree && buffer.project.filetree.opened && buffer.project.filetree.opened[file.root]) {
						state.opened = true;
					}
					if (buffer.project.filetree && buffer.project.filetree.selected == file.root) {
						state.selected = true;
					}
					tree.push({
						id:		file.root,
						parent:	path.dirname(file.root)=='.'?'#':path.dirname(file.root),
						text:	path.basename(file.root),
						state:	state,
						data: {
							type: 'dir'
						}
					});
				}
				var state			= {};
				if (buffer.project.filetree && buffer.project.filetree.selected == file.full) {
					state.selected = true;
				}
				tree.push({
					id:		file.full,
					parent:	file.root=='.'?'#':file.root,
					text:	file.filename,
					state:	state,
					icon:	"jstree-file",
					data: {
						type: 'file'
					}
				});
			});
			/*tree.sort(function(a, b) {
				return a.id>b.id?1:-1;
			});*/
			buffer.tree	= tree;
			done();
		});
		
		stack.start(function() {
			callback(buffer.tree);
		});
	},
	create:	function(options, callback) {
		var stack	= new pstack();
		var buffer	= {
			project_id:	core.sid()
		};
		
		// Update the settings
		stack.add(function(done) {
			core.data.update('settings', function(settings, update) {
				settings.projects[buffer.project_id]	= {
					id:			buffer.project_id,
					name:		options.name,
					directory:	options.directory
				};
				update(settings);
			}, function(settings) {
				done();
			});
		});
		
		stack.start(function() {
			callback(buffer);
		});
	},
	file: {
		open:	function(params, callback) {
			fstool.file.read(path.normalize(params.root+'/'+params.file), function(response) {
				callback({
					data:	response
				});
			});
		},
		save:	function(params, callback) {
			console.log("save", path.normalize(params.root+'/'+params.file));
			fstool.file.write(path.normalize(params.root+'/'+params.file), params.data, function(response) {
				console.log("save response", response);
				callback({
					status:	response
				});
			});
		},
		remove:	function(params, callback) {
			fstool.file.remove(path.normalize(params.root+'/'+params.file), function(response) {
				callback({
					status:	response
				});
			});
		}
	}
};

// Data provider
// I/O
core.data = {
	filenameToTree:	function(filenames, basePath) {
		var tree = {};
		_.each(filenames, function(filename) {
			var tpath	= filename.split(path.sep);
			var name	= tpath[tpath.length-1];
			tpath.pop();
			try {
				var jsonContent = JSON.parse(fs.readFileSync(path.normalize(basePath+'/'+filename), 'utf8'));
				
				// Ensure the path exists
				_.each(tpath, function(p, n) {
					var currPath = tpath.slice(0, n+1);
					var accessPath = "['"+currPath.join("']['")+"']";
					var vm	= eval("(function() {var tree="+JSON.stringify(tree)+";if (!tree"+accessPath+") {tree"+accessPath+" = {};}return tree;})");
					tree = vm();
				});
				// Inject the value
				var accessPath = "['"+tpath.join("']['")+"']";
				var vm	= eval("(function(var_name, var_value) {var tree="+JSON.stringify(tree)+";if (!tree"+accessPath+"[var_name]) {tree"+accessPath+"[var_name] = var_value;}return tree;})");
				tree = vm(name, {
					name:		jsonContent.name,
					filename:	path.normalize(basePath+'/'+filename)
				});
			} catch (e) {
				//console.log("Error", filename, e.message, e.stack);
			}
		});
		return tree;
	},
	getSettings:	function(callback) {
		core.data.update('settings', function(settings, update) {
			if (!settings) {
				var p_id	= core.sid();
				settings = {
					projects:	{},
					files:		[],
					settings: {
						sidebar: "projects"
					}
				};
				settings.projects[p_id] = {
					id:			p_id,
					name:		'Code Anywhere',
					directory:	__dirname
				}
			}
			update(settings);
		}, function(settings) {
			callback(settings);
		});
	},
	saveSettings:	function(settings, callback) {
		core.data.write('settings', settings, function() {
			if (callback) {
				callback(settings);
			}
		});
	},
	recordHistory:	function(name, id, data, callback) {
		// Read the settings
		var filename	= path.normalize(appDir+"history_"+name+".json");
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
		var filename	= path.normalize(appDir+"history_"+name+".json");
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
		var filename	= path.normalize(appDir+""+name+".json");
		fstool.file.readJson(filename, function(jsonSettings) {
			if (callback) {
				callback(jsonSettings);
			}
		});
	},
	update:	function(name, modifier, callback) {
		// Read the settings
		var filename	= path.normalize(appDir+""+name+".json");
		var filepath	= path.dirname(filename);
		mkdirp.sync(filepath);
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
		var filename	= path.normalize(appDir+""+name+".json");
		var filepath	= path.dirname(filename);
		mkdirp.sync(filepath);
		fstool.file.write(filename, JSON.stringify(data, null, 4), function() {
			if (callback) {
				callback();
			}
		});
	}
};

module.exports	= core;
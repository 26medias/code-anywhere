var express		= require('express');
var path		= require('path');
var cors		= require('cors');
var bodyParser	= require('body-parser');
var ide			= require('./ide');
var Handler		= require('./handler');
var app			= express();
var port		= 3000;

app.use(bodyParser.json({limit: '50mb'}))
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}))
app.use(cors());
app.use(express.static('ide'));

var handler = new Handler(app);

handler.on('/api/settings/get', function(params, callback, req, res) {
	ide.data.getSettings(callback);
});
handler.on('/api/settings/save', function(params, callback, req, res) {
	//callback(params);
	ide.data.saveSettings(params.settings, callback);
});


handler.on('/api/projects/list', function(params, callback, req, res) {
	ide.projects.list(callback);
});
handler.on('/api/projects/files', function(params, callback, req, res) {
	console.log("/api/projects/files",params);
	ide.projects.files(params.project, callback);
});
handler.on('/api/projects/create', function(params, callback, req, res) {
	ide.projects.create(params, callback);
});

handler.on('/api/projects/file/open', function(params, callback, req, res) {
	ide.projects.file.open(params, callback);
});
handler.on('/api/projects/file/save', function(params, callback, req, res) {
	ide.projects.file.save(params, callback);
});
handler.on('/api/projects/file/remove', function(params, callback, req, res) {
	ide.projects.file.remove(params, callback);
});

app.all(/api\/(.)?/gmi, function(req, res) {
	handler.on(req, res);
});

app.get('/', function (req, res) {
	res.sendFile(path.join(__dirname + '/ide/ide.html'));
});

app.listen(port, function () {
	console.log("Started ("+port+")")
});


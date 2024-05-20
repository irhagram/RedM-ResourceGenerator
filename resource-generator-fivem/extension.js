// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const { readFileSync, readdirSync, mkdirSync, writeFileSync } = require('fs');
const vscode = require('vscode');
var extensionPath = "";



// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	loadInputs();
	
	let disposable = vscode.commands.registerCommand('fivem-resource-generator.generate-resource', function (uri) {
		loadInputs(uri.fsPath)
	});
	extensionPath = context.extensionPath + "/template"
	
	
	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
function deactivate() {}


var InputData = {
	resourceName : {
		title : "Resource name",
		placeholder : "B_Jobs, Phone, esx_garage, ...",
		nextInput : "description",
		value : "",
		input : null
	},
	description : {
		title : "Resource description",
		placeholder : "This resource is ...",
		nextInput : "author",
		value : "",
		input : null
	},
	author : {
		title : "Resource author",
		placeholder : "Bentozox, ...",
		nextInput : "version",
		value : "",
		input : null
	},
	version : {
		title : "Resource version",
		placeholder : "1.0.0, ...",
		nextInput : "useLua54",
		value : "",
		input : null
	},
	useLua54 : {
		title : "Use Lua 5.4?",
		placeholder : "yes or no",
		nextInput : "useOxLib",
		value : "",
		input : null
	},
	useOxLib : {
		title : "Use ox_lib?",
		placeholder : "yes or no",
		nextInput : "",
		value : "",
		input : null
	},

}

var startInput = "resourceName"


function loadInputs(resource) {

	for (const key in InputData) {

		InputData[key].input = vscode.window.createInputBox();
		
		InputData[key].input.title = InputData[key].title;
		InputData[key].input.placeholder = InputData[key].placeholder;
	
		InputData[key].input.onDidAccept(function() {
			if (InputData[key].input.value.trim().length > 0) {
				InputData[key].value = InputData[key].input.value

				InputData[key].input.hide()

				if (InputData[key].nextInput != "") {
					InputData[InputData[key].nextInput].input.show()
				} else {
					startProcessing(resource)
				}

		
			} else {
				vscode.window.showErrorMessage(`You need to complete this input (${InputData[key].title}).`)
			}

		})
	
		if (startInput == key) {
			InputData[key].input.show();
		}

	}
	
	
}


function startProcessing(url) {
	var folder = getGeneratedFolder("");

	
	mkdirSync(`${url}/${InputData.resourceName.value}`)
	writeFolder(`${url}/${InputData.resourceName.value}`, folder);

	vscode.window.showInformationMessage(`You just created a new FiveM Lua Resource named '${InputData.resourceName.value}'.`)
}

function Folder(url) {
	var folder = {
		url : url,
		files : {},
		folders : {}
	}

	return folder
}


function getGeneratedFolder(url) {
	var folder = Folder(url)

	var files = readdirSync(extensionPath + url, { withFileTypes: true, encoding : 'utf-8' });

		
	for (const file of files) {
		if (file.isDirectory()) {
			folder.folders[file.name] = getGeneratedFolder(`${url}/${file.name}`)
		} else {
			folder.files[file.name] = readFileSync(`${extensionPath + url}/${file.name}`, {encoding : 'utf-8'})
			
			for (const key in InputData) {
				folder.files[file.name] = folder.files[file.name].replace("${" + key + "}", InputData[key].value)
			}
			if (InputData.useOxLib.value.toLowerCase() === "yes") {
				if (file.name === 'fxmanifest.lua') {
					folder.files[file.name] = folder.files[file.name].replace("shared_scripts {", "shared_scripts {\n\t'@ox_lib/init.lua',")
				}
			}
			if (InputData.useLua54.value.toLowerCase() === "yes") {
				if (file.name === 'fxmanifest.lua') {
					folder.files[file.name] = folder.files[file.name].replace("fx_version 'cerulean'", "fx_version 'cerulean'\nlua54 'yes'")
				}
			}
		}
	}

	return folder;
}



function writeFolder(url, folder) {

	url = url

	for (const key in folder.files) {
		writeFileSync(url + "/"+ key, folder.files[key], {encoding : 'utf-8'});
	}


	for (const key in folder.folders) {
		var fold = folder.folders[key]
		mkdirSync(url  + "/" + folder.url + fold.url)

		writeFolder(url  + "/" + folder.url + fold.url, fold)
	}

}







module.exports = {
	activate,
	deactivate
}

const fs = require('fs');

const readline = require('readline');

const { translate, getSupportedLanguages, quit } = require('deepl-scraper');
const { exit } = require('process');

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

var path, contents, obj, props;

function sleep(millis) {
	return new Promise(resolve => setTimeout(resolve, millis));
}

async function asyncForEach(array, callback) {
	for (let index = 0; index < array.length; index++) {
		await callback(array[index], index, array);
	}
}

function isEmptyOrSpaces(str) {
	return !str || str.match(/^ *$/) !== null;
}

function SortOrder() {

	// make sortable id array
	var orders = [];
	for (var p in props) {
		var ord = props[p].order;
		if (!orders.includes(ord))
			orders.push(ord);
	}
	// sort them
	orders.sort((a, b) => a - b);

	console.log("Got properties:");
	console.log(orders);

	rl.question('Increment from (0 to ignore): ', (indx) => {
		var idx = parseInt(indx);
		if (isNaN(idx)) {
			console.log("input error!");
			return;
		}
		rl.question('Increment by (0 to ignore): ', (incby) => {
			var by = parseInt(incby);
			if (isNaN(by)) {
				console.log("input error!");
				return;
			}
			// process properties
			var newProps = "";
			for (var o of orders) {
				for (var p in props) {
					var prop = JSON.parse(JSON.stringify(props[p]));
					if (o === prop.order) {
						if (idx > 0 && o >= idx && by != 0) {
							prop.order += by;
						}
						var pstr = "\"" + p + "\" : " + JSON.stringify(prop, null, 2);
						if (newProps != "") newProps += ",\r\n";
						newProps += pstr;
					}
				}
			}
			// prepare new object
			obj.general.properties = {};
			var output = JSON.stringify(obj, null, 2);

			// fix tabstops
			newProps = "\r\n\t\t\t" + newProps.replace(/\r\n|\n/g, "\r\n\t\t\t");
			newProps += "\r\n\t\t";

			// insert
			var regx = /("properties": {)(}+)/;
			var output = output.replace(regx, "$1" + newProps + "$2");

			// last fix
			output = output.replace(/  /g, "\t");

			// save new file
			var fpath = path + ".new";
			fs.writeFileSync(fpath, output);
			rl.close();
		});
	});
}

// left side = wallpaper engine
// right side = deepl source language
var SourceTranslationMap = {
	"ar-sa": "",
	"bg-bg": "",
	"cs-cz": "",
	"da-dk": "",
	"de-de": "de",
	"el-gr": "",
	"en-us": "en",
	"es-es": "es",
	"eu-es": "es",
	"fi-fi": "",
	"fr-fr": "fr",
	"he-il": "",
	"hu-hu": "",
	"id-id": "",
	"it-it": "it",
	"ja-jp": "ja",
	"ko-kr": "",
	"lt-lt": "",
	"nb-no": "",
	"nl-nl": "nl",
	"pl-pl": "pl",
	"pt-br": "",
	"pt-pt": "",
	"ro-ro": "",
	"ru-ru": "ru",
	"sk-sk": "",
	"sl-si": "",
	"sv-se": "",
	"th-th": "",
	"tr-tr": "",
	"uk-ua": "",
	"vi-vn": "",
	"zh-chs": "zh",
	"zh-cht": "zh",
};

// left side = wallpaper engine
// right side = deepl target language
var TargetTranslationMap = {
	"de-de": "de-DE",
	"en-us": "en-US",
	"es-es": "es-ES",
	"fr-fr": "fr-FR",
	"it-it": "it-IT",
	"ja-jp": "ja-JA",
	"nl-nl": "nl-NL",
	"pl-pl": "pl-PL",
	"ru-ru": "ru-RU",
	"zh-chs": "zh-ZH",
};

async function AutoTranslate() {

	var locali = obj.general.localization;
	if (!locali) {
		console.log("No localization object found.");
		return;
	}

	var languages = Object.keys(locali);
	console.log("Existing languages: ");
	console.log(languages);

	rl.question('Select translation source language: ', async (srcLang) => {
		var srcData = locali[srcLang];
		if (!srcData) {
			console.log("Invalid language selected.");
			return;
		}
		var dSrcLang = SourceTranslationMap[srcLang];
		if (!dSrcLang || dSrcLang == "") {
			console.log("Source language not supported by DeepL.");
			return;
		}

		await asyncForEach(Object.keys(TargetTranslationMap), async (element) => {
			// get or make target object
			if (!locali[element])
				locali[element] = {}
			var target = locali[element];
			// get target "deepl" language
			var tLang = TargetTranslationMap[element];
			console.log("Translating: " + tLang);

			await TranslateBlock(srcData, dSrcLang, target, tLang);
		});

		console.log("Finished translating... writing file.")
		var output = JSON.stringify(obj, null, 2);
		var fpath = path + ".neww";
		fs.writeFileSync(fpath, output);
		console.log("Finished writing:   " + fpath);


		console.log("Starting proof-read translation...");
		var proofRead = {};
		// get target (source) "deepl" language
		var tLang = TargetTranslationMap[srcLang];

		await asyncForEach(Object.keys(locali), async (element) => {

			// Skip check same
			if(srcLang == element) {
				console.log("Skipping origin language...");
				return;
			}
			// Skip check language exists
			if(SourceTranslationMap[element] && SourceTranslationMap[element] != "")
				dSrcLang = SourceTranslationMap[element];
			else {
				console.log("Language can not be back-translated: " + element);
				return;
			}

			// get or create target object
			if(!proofRead[element])
				proofRead[element] = {};
			var target = proofRead[element];

			// get source object
			var source = locali[element];
			console.log("Translating back: " + dSrcLang);

			await TranslateBlock(source, dSrcLang, target, tLang);
		});

		console.log("Finished translating back... writing file.")
		output = JSON.stringify(proofRead, null, 2);
		fpath = path + ".proof";
		fs.writeFileSync(fpath, output);
		console.log("Finished writing:   " + fpath);
		console.log("Program complete.");
		console.log("Thanks for using. Bye :)");
		exit(0);
	});
}

async function TranslateBlock(origin, srcLang, targ, trgLang) {

	const errString = "<!-- ERROR -->";

	await asyncForEach(Object.keys(origin), async (entry) => {

		// check target
		if (!isEmptyOrSpaces(targ[entry]) && !targ[entry].startsWith(errString)) {
			console.log("Skip translate: " + trgLang + " for: " + entry + " + " + targ[entry]);
			return;
		}
		// do text request
		var txt = origin[entry];
		var result = await translate(txt, srcLang, trgLang).catch(exx => { });

		// check result && set data
		if (result && result.target) {
			if (result.target.sentences) {
				targ[entry] = result.target.sentences[0];
			}
			if (result.target.translation) {
				targ[entry] = result.target.translation;
			}
		}
		// check again
		if (isEmptyOrSpaces(targ[entry]) || targ[entry].startsWith(errString)) {
			targ[entry] = errString + txt;
			console.log("Translate error: " + trgLang + " for: " + entry + " # " + txt);
		}
		else {
			console.log("Got translation: " + trgLang + " for: " + entry + " | " + targ[entry]);
		}

		// make sure to not hit rate limiting
		await sleep(850 + 700 * Math.random());
	});
}

console.log("wallpaper engine project.json helper by Hexxon");

rl.question('Input project.json: ', (gpth) => {

	path = gpth;

	console.log("reading file...");

	contents = fs.readFileSync(path, 'utf8');

	obj = JSON.parse(contents);

	props = obj.general.properties;

	console.log(`Possible actions: 
		0. sort & order properties
		1. auto-translate`);

	rl.question('Choose action: ', (acti) => {
		switch (acti) {
			case '0':
				SortOrder();
				break;
			case '1':
				AutoTranslate();
				break;
		}
	});
});
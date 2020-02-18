const fs = require('fs');

const readline = require('readline');

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

console.log("wallpaper engine project.json helper by Hexxon");

rl.question('Input project.json: ', (path) => {

	console.log("reading file...")

	var contents = fs.readFileSync(path, 'utf8');

	var obj = JSON.parse(contents);

	var props = obj.general.properties;

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
});
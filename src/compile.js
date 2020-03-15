#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
let inlineHtmlScripts = async htmlPath => {
	const scriptTagRegex = /<script src="([\w.\/-]+)"><\/script>/;
	let html = await fs.readFile(htmlPath, 'utf8');
	let scriptPromises = html
		.match(new RegExp(scriptTagRegex, 'g'))
		.map(scriptTag => scriptTag.match(scriptTagRegex)[1])
		.map(relScriptPath => path.resolve(path.dirname(htmlPath), relScriptPath))
		.map(scriptPath => fs.readFile(scriptPath, 'utf8'));
	let i = 0;
	return Promise.all(scriptPromises).then(scripts =>
		html.replace(new RegExp(scriptTagRegex, 'g'), () =>
			`<script>${scripts[i++]}</script>`));
};

inlineHtmlScripts(process.argv[2]).then(x => {
	console.log()
})


let wrapper = async handler => {
	if (process.argv.length !== 4)
		return console.error('Expected 2 parameters: entry HTML path and write HTML path. If they are the same, you may use `.` as teh 2nd parameter.');
	let entryPath = process.argv[2];
	let outputPath = process.argv[3] === '.' ? entryPath : process.argv[3];

	let output = await handler(entryPath);
	await fs.mkdir(path.dirname(outputPath), {recursive: true});
	fs.writeFile(outputPath, output);
};

wrapper(inlineHtmlScripts)

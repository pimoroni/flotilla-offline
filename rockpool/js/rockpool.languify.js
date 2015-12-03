var rockpool = rockpool || {};

rockpool.lang_missing = []

rockpool.lang = 'en';

rockpool.languify = function(string){
	if( rockpool.lang == 'en' ){
		return string;
	}

	if( rockpool.strings[rockpool.lang] && rockpool.strings[rockpool.lang][string] ){
		return rockpool.strings[rockpool.lang][string]
	}
	console.log('No ' + rockpool.lang + ' translation found for ' + string)
	rockpool.lang_missing.push(string);
	return string;
}

rockpool.strings = {}

rockpool.strings['de'] = {
	'Pick Your Dock': 'Pick Sie Dock',
	'Help': 'Hilfe',
	'Inputs': 'Eing&auml;nge',
	'Outputs': 'Ausg&auml;nge',
	'Variables': 'Variablen',
	'Converters': 'Konverter',
	'Generators': 'Generatoren',
	'Invert': 'Umkehren',
	'On': 'Auf',
	'Off': 'Ab',
	'Pattern': 'Muster',
	'Inspect': 'Pr&uuml;fen',
	'Empty': 'Leer',
	'Greater Than': 'Gr&ouml;&szlig;er Als',
	'Mix': 'Mischen',
	'Less Than': 'Weniger Als',
	'Smooth': 'Glatt',
	'Difference': 'Unterschied',
	'Latch': 'Reigel',
	'Toggle': 'Knebel',
	'Add': 'F&uuml;gen',
	'Analog': 'Analog',
	'Keyboard': 'Tastatur',
	'None': 'Nichts',
	// Colours
	'Red': 'Rote',
	'Orange': 'Orange',
	'Yellow': 'Gelb',
	'Green': 'Gr&uuml;n',
	'Blue': 'Blau',
	'Indigo': 'Indigo',
	'Violet': 'Violett',
	// Patterns
	'Waveforms': 'Wellenformen',
	'Sine': 'Sinus',
	'Random': 'Zuf&auml;llig',
	'Pulse': 'Puls',
	'Square': 'Platz',
	'Triangle': 'Dreieck',
	'Saw': 'S&auml;ge',
	'Clock': 'Uhr',

	'General': 'Allgemeiner ',
	'Halve': 'Halbieren',
	'Deciders': 'Entscheidenen',
	'Min': 'Min',
	'Max': 'Max',
	'Position': 'Position',
	'Slider': 'Schieberegler',
	'Brightness': 'Helligkeit',

	'Speed': 'Geschwindigkeit',
	'Forwards': 'Vorw&auml;rts',
	'Backwards': 'R&uuml;ckw&auml;rts',
	'Motor': 'Motor',
	'Dial': 'W&auml;hlen'
}
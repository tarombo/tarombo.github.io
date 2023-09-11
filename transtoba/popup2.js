let map_prefilter_id = new Map();
let map_prefilter_de = new Map();
let str_in = "";
let str_out = "";
let cache_keys = []; // Initialize an empty array
let cache_vals = []; // Initialize an empty array
let toggle_whitespaces = false; // Initialize it as false (assuming it's initially off)

let pf_in = []; // Initialize an empty array for String[]
let pf_out = []; // Initialize an empty array for String[]
let tt_range = []; // Initialize an empty array for ArrayList<Integer>
let tt_in = []; // Initialize an empty array for ArrayList<String>
let tt_out = []; // Initialize an empty array for ArrayList<String>
let tt_os = []; // Initialize an empty array for ArrayList<Integer>

let ttc; // Define ttc as an integer variable
let pfc; // Define pfc as an integer variable


function actionTextInMain() {

	console.clear();

	let input = document.getElementById('input').value;
	let output = document.getElementById('output');

	console.log("actionTextInMain: input is " + input);

	read_prefilter("de", map_prefilter_de);
	read_prefilter("id", map_prefilter_id);
	read_transtoba_code();
	//load_ttf_fonts();
	//build_window_layout();

	str_out = input;

	apply_prefilter();
	apply_transtoba();
	//ausgabe.setText(str_out);
	output.value = str_out;
}

async function read_prefilter(lang, map) {
	const resourcePath = `transtoba-prefilter-${lang}.dat`;

	try {
		const response = await fetch(resourcePath);

		if (!response.ok) {
			throw new Error(`Failed to fetch resource: ${response.status} ${response.statusText}`);
		}

		const blob = await response.blob();
		const text = await readBlobAsText(blob);

		const lines = text.trim().split('\n');
		for (const line of lines) {
			const [key, value] = line.trim().split(/\s+/);
			if (value) {
				map.set(key, value);
				//console.log("read_prefilter: map is " + key + "," + value);
			}
		}
	} catch (error) {
		console.error(error);
	}
}

async function readBlobAsText(blob) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = () => {
			resolve(reader.result);
		};

		reader.onerror = () => {
			reject(new Error('Failed to read blob as text.'));
		};

		reader.readAsText(blob);
	});
}

/******************************************************************************
  prefiltering - replacing characters we don't have replacements for ;)
 ******************************************************************************/

/* currently for Indonesian/English only */
/*
function apply_prefilter() {
  str_out = input;
  if (true) { 
	  for (const [key, value] of map_prefilter_id.entries()) {
		  str_out = str_out.replaceAll(key.toLowerCase(), value.toLowerCase());
		  str_out = str_out.replaceAll(key.toUpperCase(), value.toUpperCase());
	  }
  } else {
	  for (const [key, value] of map_prefilter_de.entries()) {
		  str_out = str_out.replaceAll(key.toLowerCase(), value.toLowerCase());
		  str_out = str_out.replaceAll(key.toUpperCase(), value.toUpperCase());
	  }
  }
}
*/

function apply_prefilter() {

	console.log("apply_prefilter: str_out is " + str_out);

	if (typeof str_out !== 'string') {
		console.log("apply_prefilter: str_out is not a string");
		// Convert str_out to a string if it's not already
		str_out = String(str_out);
	}

	console.log("apply_prefilter: map_prefilter_id is " + map_prefilter_id);
	/* currently for Indonesian/English only */
	//if (toggle_prefilter.getSelectedItem() === toggle_prefilter_opts[glid][0]) {
	for (const [key, value] of map_prefilter_id.entries()) {
		const regex = new RegExp(escapeRegExp(key), 'gi');
		let prevstr_out = str_out;
		str_out = str_out.replace(regex, (match) => {
			// Check the case of the match and replace accordingly
			if (match === key.toLowerCase()) {
				return value.toLowerCase();
			} else {
				return value.toUpperCase();
			}
		});
	}
	console.log("apply_prefilter: " + prevstr_out + " -> " + str_out);
	//} else {
	//	for (const [key, value] of map_prefilter_de.entries()) {
	//		const regex = new RegExp(escapeRegExp(key), 'gi');
	//		str_out = str_out.replace(regex, (match) => {
	// Check the case of the match and replace accordingly
	//			if (match === key.toLowerCase()) {
	//				return value.toLowerCase();
	//			} else {
	//				return value.toUpperCase();
	//			}
	//		});
	//	}
	//}
}

function escapeRegExp(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}



/******************************************************************************
  main transliteration functions
 ******************************************************************************/

function procCache(k, v) {
	const i = cache_keys.indexOf(k);
	if (i !== -1) {
		cache_keys.splice(i, 1);
		cache_vals.splice(i, 1);
	}
	cache_keys.push(k);
	cache_vals.push(v);
	if (cache_keys.length > 250) {
		cache_keys.shift();
		cache_vals.shift();
	}
}

function apply_transtoba() {
	let out = "";
	let temp = "";
	let workon = "";
	let cache;
	let pi = 0;
	let check = 0;
	let i = 0;
	let j = 0;

	let tempb = String(str_out).toUpperCase().split("\n");
	console.log("apply_transtoba: tempb is " + tempb);

	for (j = 0; j < tempb.length; j++) {

		console.log("apply_transtoba: tempb.length is " + tempb.length + ", j is now " + j);
		/*
		if (progress !== null) {
			progress.setValue(100 - (100 / tempb.length) * j);
			progress.paintImmediately(progress.getVisibleRect());
		}*/
		const tempa = tempb[j].split(/\s+/);

		console.log("apply_transtoba: tempa is " + tempa);

		for (i = 0; i < tempa.length; i++) {
			console.log("apply_transtoba: tempa.length is " + tempa.length + ", i is now "+i);
			workon = tempa[i];
			if (!cache_keys.includes(workon)) {
				cache = "";
				let x = 0;
				let ready = false;
				while (x < workon.length) {
					for (let z = 0; z < ttc && !ready; z++) {
						if (tt_in[z].charAt(0) === '^') {
							if (x === 0) {
								if (workon.match(tt_in[z] + ".*")) {
									out += tt_out[z];
									cache += tt_out[z];
									x += tt_range[z];
									ready = true;
								}
							}
						} else if (
							workon.length > x + tt_os[z] &&
							x + tt_os[z] >= 0
						) {
							if (
								workon.substring(x + tt_os[z]).match(
									"^" + tt_in[z] + ".*"
								)
							) {
								out += tt_out[z];
								cache += tt_out[z];
								x += tt_range[z];
								ready = true;
							}
						}
					}
					if (!ready) {
						out += workon.charAt(x);
						cache += workon.charAt(x);
						x += 1;
					}
				}
				procCache(workon, cache);
			} else {
				out += cache_vals[cache_keys.indexOf(workon)];
				procCache(workon, cache_vals[cache_keys.indexOf(workon)]);
			}
			out += " ";
		}
		out += "\n";

		console.log("apply_transtoba: tempa is " + tempa);
		console.log("apply_transtoba: out is " + out);
	}

	for (let x = 3; x < out.length; x++) {
		if (
			toba_is_konsonant(out.charAt(x - 3)) &&
			toba_is_konsonant(out.charAt(x - 1)) &&
			toba_is_diacritic(out.charAt(x - 2)) &&
			toba_is_diacritic(out.charAt(x)) &&
			out.charAt(x - 2) !== String.fromCharCode(0x5C) &&
			out.charAt(x) === String.fromCharCode(0x5C)
		) {
			out =
				out.substring(0, x - 2) +
				out.substring(x - 1, x - 0) +
				out.substring(x - 2, x - 1) +
				out.substring(x);
		}
		console.log("apply_transtoba: out now is " + out);
	}

	for (let x = 2; x < out.length; x++) {
		if (
			toba_is_konsonant_u(out.charAt(x - 2)) &&
			toba_is_konsonant(out.charAt(x - 1)) &&
			out.charAt(x) === String.fromCharCode(0x5C)
		) {
			out =
				out.substring(0, x - 2) +
				String.fromCharCode(out.charCodeAt(x - 2) + 0x20) +
				String.fromCharCode(out.charCodeAt(x - 1) - 0x20) +
				out.substring(x);
		}
		console.log("apply_transtoba: out now is " + out);
	}

	if (!toggle_whitespaces) {
		out = out.replaceAll(" ", "");
	}

	console.log("apply_transtoba: out now is " + out);

	str_out = out;
	/*
	if (progress !== null) {
		progress.setValue(0);
		progress.paintImmediately(progress.getVisibleRect());
	}
	*/
}

/******************************************************************************
  loading transtoba data files
 ******************************************************************************/

async function read_transtoba_code() {
	let result;
	let s;
	let ins = null;
	let ti = 0;

	try {
		const codeurl = "transtoba-code.dat"; // Set the path to your resource here
		const response = await fetch(codeurl);

		if (!response.ok) {
			throw new Error(`Failed to fetch resource: ${response.status} ${response.statusText}`);
		}

		const text = await response.text();
		const lines = text.trim().split('\n');
		ttc = 0;

		for (const line of lines) {
			//console.log("read_transtoba_code: line is " + line);
			result = line.trim().split(/\s+/);
			if (result.length > 2) {
				tt_os.push(parseInt(result[0]));
				tt_range.push(parseInt(result[1]));
				tt_in.push(result[2]);
				tt_out.push(hex2asc(result[3]));
				ttc++;
			}
		}
	} catch (error) {
		console.error(error);
	}
}

function hex2asc(input) {
	let temp = input;
	let out = '';
	let pi = 0;

	while (temp.length !== 0) {
		pi = parseInt(temp.substring(0, 4), 16);
		out += String.fromCharCode(pi);
		temp = temp.substring(4);
	}

	return out;
}

/*
function readPrefilter(lang, map) {
  let result;
  let s;
  let ins = null;
  try {
	  const codeurl = transtoba2.class.getClassLoader().getResource("transtoba-prefilter-" + lang + ".dat");
	  try { ins = codeurl.openStream(); }
	  catch (e) {
		  console.error(e);
	  }
	  const reader = new InputStreamReader(ins);
	  const br = new BufferedReader(reader);
	  while ((s = br.readLine()) !== null) {
		  result = s.trim().split(/\s+/);
		  if (result.length > 1) {
			  map.set(result[0], result[1]);
		  }
	  }
  } catch (e) {
	  console.error(e);
  }
}
*/

async function readPrefilter(lang, map) {
	try {
		const codeurl = `transtoba-prefilter-${lang}.dat`; // Replace with the actual URL
		const response = await fetch(codeurl);

		if (!response.ok) {
			throw new Error(`Failed to fetch resource: ${response.status} ${response.statusText}`);
		}

		const text = await response.text();
		const lines = text.trim().split('\n');

		for (const line of lines) {
			const result = line.trim().split(/\s+/);
			if (result.length > 1) {
				map.set(result[0], result[1]);
			}
		}
	} catch (error) {
		console.error(error);
	}
}



/******************************************************************************
  little helpers, probably not used currently
 ******************************************************************************/

function toba_is_konsonant(inChar) {
	const kons = [0x61, 0x68, 0x6B, 0x62, 0x70, 0x6E, 0x77, 0x67, 0x6A, 0x64, 0x72, 0x6D, 0x74, 0x73, 0x79, 0x3C, 0x6C, 0x00];
	for (let x = 0; inChar !== kons[x]; x++) {
		if (kons[x] === 0x00) return false;
	}
	return true;
}

function toba_is_konsonant_u(inChar) {
	const k_u = [0x41, 0x48, 0x4B, 0x42, 0x50, 0x4E, 0x57, 0x47, 0x4A, 0x44, 0x52, 0x4D, 0x54, 0x53, 0x59, 0x3E, 0x4C, 0x00];
	for (let x = 0; inChar !== k_u[x]; x++) {
		if (k_u[x] === 0x00) return false;
	}
	return true;
}


document.addEventListener('DOMContentLoaded', function () {
	//document.getElementById('alertButton').addEventListener('click', myAlert);
	document.getElementById('transliterate').addEventListener('click', actionTextInMain);
});

let isHex = false;
let map_prefilter_id = new Map();
let map_prefilter_de = new Map();
let str_in = "";
let str_out = "";
let prevstr_out = "";
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


async function actionTextInMain() {

	console.clear();

	let input = document.getElementById('input').value;
	let output = document.getElementById('output');

	//console.log("actionTextInMain: input is " + input);

	//read_prefilter("de", map_prefilter_de);
	//read_prefilter("id", map_prefilter_id);
	//read_transtoba_code();
	//load_ttf_fonts();
	//build_window_layout();

	str_out = input;

	await apply_prefilter();
	await apply_transtoba();
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
	//console.log("apply_prefilter: map.entries.length is " + map.entries.length);
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

async function apply_prefilter() {

	//console.log("apply_prefilter: str_out is " + str_out);

	if (typeof str_out !== 'string') {
		// Convert str_out to a string if it's not already
		str_out = String(str_out);
	} else {
		//console.log("apply_prefilter: str_out is a string");
	}

	prevstr_out = str_out;
	//console.log("apply_prefilter: prevstr_out is " + prevstr_out);

	/* currently for Indonesian/English only */
	//if (toggle_prefilter.getSelectedItem() === toggle_prefilter_opts[glid][0]) {
	try {
		// Assuming lang is a variable with the desired language
		await read_prefilter("id", map_prefilter_id);

		// Now you can safely iterate over map_prefilter_id
		for (const [key, value] of map_prefilter_id.entries()) {
			const regex = new RegExp(escapeRegExp(key), 'gi');
			//console.log("apply_prefilter: RegExp(escapeRegExp(key), 'gi') is " + regex);
			str_out = str_out.replace(regex, (match) => {
				// Check the case of the match and replace accordingly
				if (match === key.toLowerCase()) {
					return value.toLowerCase();
				} else {
					return value.toUpperCase();
				}
			});
		}
	} catch (error) {
		console.error(error);
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

async function apply_transtoba() {
	let out = "";
	let temp = "";
	let workon = "";
	let cache;
	let pi = 0;
	let check = 0;
	let i = 0;
	let j = 0;

	let tempb = String(str_out).toUpperCase().split("\n");
	//console.log("apply_transtoba: tempb is " + tempb);

	try {
		await read_transtoba_code();

		for (j = 0; j < tempb.length; j++) {

			//console.log("apply_transtoba: tempb.length is " + tempb.length + ", j is now " + j);
			/*
			if (progress !== null) {
				progress.setValue(100 - (100 / tempb.length) * j);
				progress.paintImmediately(progress.getVisibleRect());
			}*/
			const tempa = tempb[j].split(/\s+/);

			//console.log("apply_transtoba: tempa is " + tempa);

			for (i = 0; i < tempa.length; i++) { // go through each character in the input text
				//console.log("apply_transtoba: tempa.length is " + tempa.length + ", i is now " + i);
				workon = tempa[i];
				//console.log("apply_transtoba: workon is " + workon + ", ttc="+ttc+", cache_keys's length = " + cache_keys.length);

				if (!cache_keys.includes(workon)) {
					//console.log("apply_transtoba: !cache_keys.includes(workon) is true ");
					cache = "";

					let x = 0;
					while (x < workon.length) {
						//console.log("apply_transtoba: x=" + x);
						let ready = false;
						for (let z = 0; z < ttc && !ready; z++) { // go through each data in transtoba-code.data to compare with the character
							//console.log("apply_transtoba: tt_os[" + z + "]=" + tt_os[z] + ", tt_in[" + z + "]=" + tt_in[z] + ", tt_in[" + z + "].chartAt(0)=" + tt_in[z].charAt(0) + ", tt_range[" + z + "]=" + tt_range[z]);
							if (tt_in[z].charAt(0) === '^') {
								//console.log("apply_transtoba: tt_in[z].charAt(0) === '^'");
								if (x === 0) {
									if (workon.match(tt_in[z] + ".*")) {
										out += tt_out[z];
										cache += tt_out[z];
										x += tt_range[z];
										ready = true;
										//console.log("apply_transtoba: tt_in[z].charAt(0) === '^', ready=" + ready + ", out=" + out);
									}
								}
							} else if (
								workon.length > x + tt_os[z] &&
								x + tt_os[z] >= 0
							) {
								//console.log("apply_transtoba: workon.length > x + tt_os[z] && x + tt_os[z] >= 0");
								if (
									workon.substring(x + tt_os[z]).match(
										"^" + tt_in[z] + ".*"
									)
								) {
									out += tt_out[z];
									cache += tt_out[z];
									//console.log("apply_transtoba: x="+x+", tt_range[z]="+tt_range[z]);
									x += tt_range[z];
									//console.log("apply_transtoba: x += tt_range[z]="+x);
									ready = true;
									//console.log("apply_transtoba: workon.length > x + tt_os[z] && x + tt_os[z] >= 0, now ready, out=" + out);
								}
							}
						}
						if (!ready) {
							out += workon.charAt(x);
							//console.log("apply_transtoba: if (!ready), not ready, out=" + out);
							cache += workon.charAt(x);
							x += 1;
						}
					}
					procCache(workon, cache);
					//console.log("apply_transtoba: procCache(workon, cache)="+workon+","+cache);
				} else {
					//console.log("apply_transtoba: !cache_keys.includes(workon) is false ");
					out += cache_vals[cache_keys.indexOf(workon)];
					procCache(workon, cache_vals[cache_keys.indexOf(workon)]);
				}
				out += " ";
			}
			out += "\n";

			console.log("apply_transtoba: tempa is " + tempa + ", out after regex is " + out);
		}

		//console.log("apply_transtoba: let x = 3; x < out.length; x++, out.length=" + out.length);
		for (let x = 3; x < out.length; x++) {
			//console.log("apply_transtoba: konsonant? " + toba_is_konsonant(out.charAt(x - 3)) + ", x=" + x + ", out.charAt(x - 3)=" + out.charAt(x - 3));
			//console.log("apply_transtoba: konsonant? " + toba_is_konsonant(out.charAt(x - 1)) + ", x=" + x + ", out.charAt(x - 1)=" + out.charAt(x - 1));
			//console.log("apply_transtoba: diacritic? " + toba_is_diacritic(out.charAt(x - 2)) + ", x=" + x + ", out.charAt(x - 2)=" + out.charAt(x - 2));
			//console.log("apply_transtoba: diacritic? " + toba_is_diacritic(out.charAt(x)) + ", x=" + x + ", out.charAt(x)=" + out.charAt(x));
			//console.log("apply_transtoba: out.charAt(x - 2) !== String.fromCharCode(0x5C) ? " + (out.charAt(x - 2) !== String.fromCharCode(0x5C)) + ", out.charAt(x - 2)=" + out.charAt(x - 2) + ", String.fromCharCode(0x5C)=" + String.fromCharCode(0x5C));
			//console.log("apply_transtoba: out.charAt(x) === String.fromCharCode(0x5C) ? " + (out.charAt(x) === String.fromCharCode(0x5C)) + ", out.charAt(x)=" + out.charAt(x) + ", String.fromCharCode(0x5C)=" + String.fromCharCode(0x5C));
			if (
				toba_is_konsonant(out.charAt(x - 3)) &&
				toba_is_konsonant(out.charAt(x - 1)) &&
				toba_is_diacritic(out.charAt(x - 2)) &&
				toba_is_diacritic(out.charAt(x)) &&
				out.charAt(x - 2) !== String.fromCharCode(0x5C) &&
				out.charAt(x) === String.fromCharCode(0x5C)
			) {
				//console.log("apply_transtoba: Yes. Previous out=" + out);
				out =
					out.substring(0, x - 2) +
					out.substring(x - 1, x - 0) +
					out.substring(x - 2, x - 1) +
					out.substring(x);
					//console.log("apply_transtoba: New out=" + out);
			}
		}

		//console.log("apply_transtoba: let x = 2; x < out.length; x++, out.length=" + out.length);
		for (let x = 2; x < out.length; x++) {
			//console.log("apply_transtoba: konsonant? " + toba_is_konsonant_u(out.charAt(x - 2)) + ", x=" + x + ", out.charAt(x - 2)=" + out.charAt(x - 2));
			//console.log("apply_transtoba: konsonant? " + toba_is_konsonant(out.charAt(x - 1)) + ", x=" + x + ", out.charAt(x - 1)=" + out.charAt(x - 1));
			//console.log("apply_transtoba: out.charAt(x) === String.fromCharCode(0x5C) ? " + (out.charAt(x) === String.fromCharCode(0x5C)) + ", out.charAt(x)=" + out.charAt(x) + ", String.fromCharCode(0x5C)=" + String.fromCharCode(0x5C));
			if (
				toba_is_konsonant_u(out.charAt(x - 2)) &&
				toba_is_konsonant(out.charAt(x - 1)) &&
				out.charAt(x) === String.fromCharCode(0x5C)
			) {
				//console.log("apply_transtoba: Yes. Previous out=" + out);
				out =
					out.substring(0, x - 2) +
					String.fromCharCode(out.charCodeAt(x - 2) + 0x20) +
					String.fromCharCode(out.charCodeAt(x - 1) - 0x20) +
					out.substring(x);
					//console.log("apply_transtoba: New out=" + out);
			}
		}

		if (!toggle_whitespaces) {
			out = out.replaceAll(" ", "");
		}
	} catch (error) {
		console.error(error);
	}

	console.log("apply_transtoba: out finally is " + out);

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

		const codeurl = "transtoba-code-hex.dat"; // Set the path to your resource here
		const response = await fetch(codeurl);

		if (!response.ok) {
			throw new Error(`Failed to fetch resource: ${response.status} ${response.statusText}`);
		}

		const text = await response.text();
		const lines = text.trim().split('\n');
		//console.log("read_transtoba_code: text is " + text);
		ttc = 0;
		//console.log("read_transtoba_code: no. of lines in transtoba-code.dat is " + lines.length);

		for (const line of lines) {
			result = line.trim().split(/\s+/);
			//console.log("read_transtoba_code: result is " + result);
			if (result.length > 2) {
				tt_os.push(parseInt(result[0]));
				tt_range.push(parseInt(result[1]));
				tt_in.push(result[2]);
				tt_out.push(hex2asc(result[3]));
				ttc++;
				//console.log("read_transtoba_code: tt_os is added with " + parseInt(result[0]));
				//console.log("read_transtoba_code: tt_range is added with " + parseInt(result[1]));
				//console.log("read_transtoba_code: tt_in is added with " + result[2]);
				//console.log("read_transtoba_code: tt_out is added with " + hex2asc(result[3]));
			}
		}
		//console.log("read_transtoba_code: for (const line of lines) is done");
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
	const kons = ['a', 'h', 'k', 'b', 'p', 'n', 'w', 'g', 'j', 'd', 'r', 'm', 't', 's', 'y', '<', 'l', 0x00];
	for (let x = 0; inChar !== kons[x]; x++) {
		if (kons[x] === 0x00) return false;
	}
	return true;
}

function toba_is_konsonant_u(inChar) {
	const k_u = ['A', 'H', 'K', 'B', 'P', 'N', 'W', 'G', 'J', 'D', 'R', 'M', 'T', 'S', 'Y', '>', 'L', 0x00];
	for (let x = 0; inChar !== k_u[x]; x++) {
		if (k_u[x] === 0x00) return false;
	}
	return true;
}

function roman_is_vokal(inChar) {
	const dv = ['A', 'E', 'I', 'O', 'U', 0x00];
	for (let x = 0; x < dv.length; x++) {
		if (dv[x] === inChar) {
			return true;
		}
	}
	return false;
}

function toba_is_diacritic(inChar) {
	const dia = ['\\', 'e', 'i', 'o', 'x', 0x00];
	for (let x = 0; x < dia.length; x++) {
		if (dia[x] === inChar) {
			return true;
		}
	}
	return false;
}


document.addEventListener('DOMContentLoaded', function () {
	//document.getElementById('alertButton').addEventListener('click', myAlert);
	document.getElementById('transliteratehex').addEventListener('click', actionTextInMain);
});

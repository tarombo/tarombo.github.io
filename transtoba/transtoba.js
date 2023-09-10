/*

A Chrome extension for transliterating Indonesian text to Batak Toba script
Transliteration logic is based on https://github.com/leanderseige/transtoba2

By Arnold Siboro

*/


let pf_in, pf_out;
let tt_range = [];
let tt_in = [];
let tt_out = [];
let tt_os = [];
let ttc, pfc;
//alert(chrome.runtime.id);

function hex2asc(hexString) {
  let hex = hexString.toString();
  let str = '';
  for (let i = 0; i < hex.length; i += 2) {
    let charCode = parseInt(hex.substr(i, 2), 16);
    str += String.fromCharCode(charCode);
  }
  return str;
}

async function read_transtoba_code() {

  const url = chrome.runtime.getURL('transtoba-code.txt');
  alert(url);

  // fetch(url).then((response) => response.text());

  const tt_os = [];
  const tt_range = [];
  const tt_in = [];
  const tt_out = [];
  let ttc = 0;

  try {
    const response = await fetch(url);
    const text = await response.text();
    alert(text);
    text.trim().split(/\r?\n/).forEach((line) => {
      console.log(line);
      const [os, range, input, output] = line.trim().split(/\s+/);
      if (os && range && input && output) {
        tt_os.push(parseInt(os));
        tt_range.push(parseInt(range));
        tt_in.push(input);
        tt_out.push(hex2asc(output));
        ttc++;
      }
    });

  } catch (error) {
    alert(error);
  }

  const code = { tt_os, tt_range, tt_in, tt_out };
  return code;
}

function prefilter(idText) {

  let prefilterMap = {
    'x': 'ks',
    'v': 'p',
    'f': 'p',
    'q': 'k',
    'z': 'j',
    'ck': 'k',
    'ie': 'i',
    'cl': 'kl',
    'ss': 's',
    'kk': '<k',
    'tt': 'nt',
    'pp': 'mp',
    'ff': 'f',
    'dd': 'd',
    'chr': 'kr',
    'qu': 'kw',
    'tj': 's',
    'oo': 'u',
    'oe': 'u',
    'v': 'p'
  };

  let outputText = '';
  for (let i = 0; i < idText.length; i++) {
    let c = idText.charAt(i).toLowerCase();
    if (prefilterMap[c]) {
      outputText += prefilterMap[c];
    } else {
      outputText += c;
    }
  }
  return outputText.trim();
}

function transliterate() {
  let input = document.getElementById('input').value;
  let output = document.getElementById('output');

  let batakMap = {
    'a': 'ᯀ',
    'b': 'ᯁ',
    'c': 'ᯂ',
    'd': 'ᯃ',
    'e': 'ᯄ',
    'g': 'ᯆ',
    'h': 'ᯇ',
    'i': 'ᯈ',
    'j': 'ᯉ',
    'k': 'ᯊ',
    'l': 'ᯋ',
    'm': 'ᯌ',
    'n': 'ᯍ',
    'o': 'ᯎ',
    'p': 'ᯏ',
    'r': 'ᯑ',
    's': 'ᯒ',
    't': 'ᯓ',
    'u': 'ᯔ',
    'w': 'ᯖ',
    'y': 'ᯘ'
  };

  let outputText = '';
  input = prefilter(input);
  for (let i = 0; i < input.length; i++) {
    let c = input.charAt(i).toLowerCase();
    if (batakMap[c]) {
      outputText += batakMap[c];
    } else {
      outputText += c;
    }
  }
  output.value = outputText
}

async function read_prefilter(lang, map) {

  const response = chrome.runtime.getURL('transtoba-prefilter-id.txt');
  alert(response);

  const data = await response.text();
  const lines = data.trim().split("\n");
  for (let i = 0; i < lines.length; i++) {
    const [key, value] = lines[i].trim().split(/\s+/);
    if (key && value) {
      map.set(key, value);
    }
  }
}

/******************************************************************************
prefiltering - replacing characters we don't have replacements for ;)
******************************************************************************/

function apply_prefilter() {
  str_out = str_in;
  if (toggle_prefilter.getSelectedItem() === toggle_prefilter_opts[glid][0]) {
    for (const [key, value] of Object.entries(map_prefilter_id)) {
      str_out = str_out.replaceAll(key.toLowerCase(), value.toLowerCase());
      str_out = str_out.replaceAll(key.toUpperCase(), value.toUpperCase());
    }
  } else {
    for (const [key, value] of Object.entries(map_prefilter_de)) {
      str_out = str_out.replaceAll(key.toLowerCase(), value.toLowerCase());
      str_out = str_out.replaceAll(key.toUpperCase(), value.toUpperCase());
    }
  }
}
/******************************************************************************
main transliteration functions
******************************************************************************/

function proc_cache(k, v) {
  let i = cache_keys.indexOf(k);
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

  // run through all input lines
  let tempb = str_out.toUpperCase().split("\n");
  for (j = 0; j < tempb.length; j++) {
    if (progress != null) {
      progress.setValue(100 - (100 / tempb.length) * j);
      progress.paintImmediately(progress.getVisibleRect());
    }
    // run through all input words for each line
    let tempa = tempb[j].split("\s+");
    for (i = 0; i < tempa.length; i++) {
      workon = tempa[i];
      // run through every input word
      if (cache_keys.includes(workon) == false) {
        cache = "";
        for (let x = 0; x < workon.length;) {
          // run through the list of regex strings
          let ready = false;
          for (let z = 0; z < ttc && ready == false; z++) {
            // does this rule only match word beginnings?
            // yes, we don't have to add "^" because it's already there; 'coz we're checking a beginning-of-word-rule
            if (tt_in.get(z).charAt(0) == "^") {
              if (x == 0) {
                if (workon.match(tt_in.get(z) + ".")) {
                  out = out + tt_out.get(z);
                  cache = cache + tt_out.get(z);
                  // console.log(tt_in.get(z)+"=>"+workon.substring(x)+"("+out+")");
                  x = x + tt_range.get(z);
                  ready = true;
                }
              }
              // no, we have to add "^" ('coz we always need to pass it to regex)
            } else if (
              workon.length > x + tt_os.get(z) &&
              x + tt_os.get(z) >= 0
            ) {
              if (
                workon
                  .substring(x + tt_os.get(z))
                  .match("^" + tt_in.get(z) + ".")
              ) {
                out = out + tt_out.get(z);
                cache = cache + tt_out.get(z);
                // console.log(tt_in.get(z)+"=>"+workon.substring(x)+"("+out+")");
                x = x + tt_range.get(z);
                ready = true;
              }
            }
          }
          if (ready == false) {
            out = out + workon.charAt(x);
            cache = cache + workon.charAt(x);
            x = x + 1;
          }
        }
        // console.log("to cache: "+workon);
        proc_cache(workon, cache);
      } else {
        // console.log("from cache: "+workon);
        out =
          out +
          cache_vals.get(cache_keys.indexOf(workon));
        proc_cache(
          workon,
          cache_vals.get(cache_keys.indexOf(workon))
        );
      }
      out = out + " ";
    }
    out = out + "\n";
  }

  // warp diacritics around c: t=out.charAt(x-1); out.charAt(x-1)=out(x-2); out.charAt(x-2)=t;
  for (let x = 3; x < out.length; x++) {
    if (toba_is_konsonant(out.charAt(x - 3)) &&
      toba_is_konsonant(out.charAt(x - 1)) &&
      toba_is_diacritic(out.charAt(x - 2)) &&
      toba_is_diacritic(out.charAt(x)) &&
      out.charAt(x - 2) != 0x5C &&
      out.charAt(x) == 0x5C
    ) {
      out = out.substring(0, x - 2) +
        out.substring(x - 1, x) +
        out.substring(x - 2, x - 1) +
        out.substring(x);
    }
  }

  // c: out.charAt(x-2)+=0x20; out.charAt(x-1)-=0x20;
  for (let x = 2; x < out.length; x++) {
    if (toba_is_konsonant_u(out.charAt(x - 2)) &&
      toba_is_konsonant(out.charAt(x - 1)) &&
      out.charAt(x) == 0x5C
    ) {
      out = out.substring(0, x - 2) +
        String.fromCharCode(out.substring(x - 2, x - 1).charCodeAt(0) + 0x20) +
        String.fromCharCode(out.substring(x - 1, x).charCodeAt(0) - 0x20) +
        out.substring(x);
    }
  }

  if (toggle_whitespaces.isSelected() == false) {
    out = out.replaceAll(" ", "");
  }

  str_out = out;
  if (progress != null) {
    progress.setValue(0);
    progress.paintImmediately(progress.getVisibleRect());
  }

  // console.log("cache: "+cache_keys.size()); // Uncomment to print the statement to console.

}


function myAlert() {
  //alerttext = read_transtoba_code();
  //alert(alerttext);
  read_transtoba_code();
  //console.log(tt_in[0]);
  //alert(tt_in);
}

document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('alertButton').addEventListener('click', myAlert);
  document.getElementById('transliterate').addEventListener('click', transliterate);
});

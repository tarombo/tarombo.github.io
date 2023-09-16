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

  read_transtoba_code();
  
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
  outputText = outputText + "inputted text: " + input + "\n"
  input = prefilter(input);
  outputText = outputText + "prefiltered text: " + input + "\n"
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


// import { decompressUrlSafe } from './lzma-url.js';
import { compressUrlSafe, decompressUrlSafe } from './lzma-url.js';



function loadFile(filePath) {
  var result = null;
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open("GET", filePath, false);
  xmlhttp.send();
  if (xmlhttp.status == 200) {
    result = xmlhttp.responseText;
  }
  return result;
}

let csv = loadFile("bruh.csv");

let hash_keys = {};

let stats = {};


String.prototype.hashCode = function() {
  var hash = 0,
    i, chr;
  if (this.length === 0) return hash;
  for (i = 0; i < this.length; i++) {
    chr = this.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

let BASE_CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ._~()\'!*:@,'.split('');
let MAX_BASE = BASE_CHARS.length;
function convertBase(value, from_base, to_base) {
  var range = BASE_CHARS;
  var from_range = range.slice(0, from_base);
  var to_range = range.slice(0, to_base);
  
  var dec_value = value.split('').reverse().reduce(function (carry, digit, index) {
    if (from_range.indexOf(digit) === -1) throw new Error('Invalid digit `'+digit+'` for base '+from_base+'.');
    return carry += from_range.indexOf(digit) * (Math.pow(from_base, index));
  }, 0);

  var new_value = '';
  while (dec_value > 0) {
    new_value = to_range[dec_value % to_base] + new_value;
    dec_value = (dec_value - (dec_value % to_base)) / to_base;
  }
  return new_value || '0';
}


function convert_to_char(elem) {
  let name = elem.getAttribute("name") || "error";

  let name_str = convertBase(String(name.hashCode()), 10, MAX_BASE);

  let negatives = [];

  let angle = elem.getAttribute("angle") || 0;
  negatives[0] = (angle < 0);
  let angle_str = convertBase(String(Math.abs(angle)), 10 , MAX_BASE);
  
  let scale = elem.getAttribute("scale") || 10;
  let scale_str = convertBase(String(Math.abs(scale)), 10 , MAX_BASE);
  
  let z_index_value = elem.getAttribute("z_index") || 0;
  negatives[1] = (z_index_value < 0);
  let z_index_str = convertBase(String(Math.abs(z_index_value)), 10 , MAX_BASE);
  
  
  let flip_h_value = (elem.getAttribute("flip_h") || "false") == "true";
  let flip_v_value = (elem.getAttribute("flip_v") || "false") == "true";
  
  let flip_h_v_str = convertBase(((flip_h_value) ? "1":"0") + ((flip_v_value) ? "1":"0"), 2, MAX_BASE);
  
  let x = elem.style.left.replaceAll("%", "");
  negatives[2] = (x < 0);
  let x_str = convertBase(String(Math.round(Math.abs(x)*1000)), 10 , MAX_BASE);
  
  
  let y = elem.style.top.replaceAll("%", "");
  let y_str = convertBase(String(Math.round(Math.abs(y)*1000)), 10 , MAX_BASE);
  negatives[3] = (y < 0);

  let neg_str = convertBase(negatives.map((v) => {return (v)?"1":"0"}).join(""), 2, MAX_BASE);

  let text =  [neg_str, name_str, angle_str, scale_str, z_index_str, flip_h_v_str, x_str, y_str].join(";");
  return text;
}

function load_from_url() {
  if (window.location.href.split('=').length != 2 || window.location.href.split('=')[1] == "") {
    return;
  }
  let text = decompressUrlSafe(window.location.href.split('=')[1]);
  let text_array = text.split(";");


  for (let offset = 0; offset < text_array.length; offset += 8) {
    let neg_str = text_array[offset + 0];
    let name_str = text_array[offset + 1];
    let angle_str = text_array[offset + 2];
    let scale_str = text_array[offset + 3];
    let z_index_str = text_array[offset + 4];
    let flip_h_v_str = text_array[offset + 5];
    let x_str = text_array[offset + 6];
    let y_str = text_array[offset + 7];
    
    let temp = convertBase(neg_str,MAX_BASE,2);
    console.log(temp);
    console.log(("0".repeat(4-temp.length)+temp).split(""))
    let negatives = ("0".repeat(4-temp.length)+temp).split("").map((a) => {return (a=="1")?-1:1});
    console.log(negatives);
    let name = hash_keys[name_str] || name_str;

    let container = document.createElement("div");

    let img = document.createElement("img");
    img.src = "img/"+name+".png";
    img.className = "part_img";
    container.appendChild(img);

    container.style.left = parseInt(convertBase(x_str, MAX_BASE, 10)/1000) * negatives[2] + "%";
    container.style.top = parseInt(convertBase(y_str, MAX_BASE, 10)/1000) * negatives[3] + "%";

   
    container.setAttribute("z_index", parseInt(convertBase(z_index_str,MAX_BASE,10))*negatives[1] + "");
    container.setAttribute("name", name + "");
    container.setAttribute("scale", parseInt(convertBase(scale_str,MAX_BASE,10)) + "");
    container.setAttribute("angle", parseInt(convertBase(angle_str,MAX_BASE,10)) * negatives[0] + "");

    let hv_str = convertBase(flip_h_v_str, MAX_BASE, 2);
    if (hv_str == "0") {
      hv_str = "0,0";
    }

    console.log(hv_str);

    container.setAttribute("flip_h", (hv_str[0]=="1"));
    container.setAttribute("flip_v", (hv_str[1]=="1"));

    container.setAttribute("target", true);
    container.className = "part_container";

    dragElement(container);
    
    canvas.appendChild(container);
    
    update_item_attb_menu();
    update_item_val();
    
    container.setAttribute("target", false);
  }

}





let obj_list = document.getElementById("item_list");
let part_attb = document.getElementById("item_attb");
let canvas = document.getElementById("part_canvas");

let angle_slider = document.getElementById("angle");
let scale_slider = document.getElementById("scale");
let name_text = document.getElementById("name");
let del_button = document.getElementById("del_button");
let z_index = document.getElementById("z_index");
let flip_h = document.getElementById("flip_h");
let flip_v = document.getElementById("flip_v");

if (!csv.startsWith("name")) {
  obj_list.innerText = csv;
}

del_button.onclick = () => {
  for (let elm of document.getElementsByClassName("part_container")) {
    if (elm.getAttribute("target") == "true") {
      elm.remove();
      return;
    }
  }
};

window.onkeydown = (e) => {
  console.log(e.keyCode);
  if (e.keyCode === 8 || e.keyCode === 46) {
    del_button.click();
  }
}

function update_item_val(e) {
  let focus = null;
  for (let elm of document.getElementsByClassName("part_container")) {
    if (elm.getAttribute("target") == "true") {
      focus = elm;
    }
  }

  focus.setAttribute("angle", (angle_slider.value || 0) + "");
  focus.setAttribute("scale", (scale_slider.value || 10) + "");
  focus.setAttribute("z_index", (z_index.value || 0) + "");
  focus.setAttribute("flip_h", (flip_h.checked || false) + "");
  focus.setAttribute("flip_v", (flip_v.checked || false) + "");

  let transform =
    "scale(" +
    String(scale_slider.value / 10) +
    ") rotate(" +
    String(angle_slider.value) +
    "deg) rotateX(" +
    (flip_v.checked ? 180 : 0) +
    "deg)" +
    "rotateY(" +
    (flip_h.checked ? 180 : 0) +
    "deg)";
  focus.style.transform = transform;
  focus.style.WebkitTransform = transform;

  focus.style.zIndex = z_index.value + "";
}

part_attb.oninput = update_item_val;

function update_item_attb_menu() {
  let focus = null;
  for (let elm of document.getElementsByClassName("part_container")) {
    if (elm.getAttribute("target") == "true") {
      focus = elm;
    }
  }

  if (focus === null) {
    return;
  }

  let name = focus.getAttribute("name") || "no item selected";
  let angle = focus.getAttribute("angle") || 0;
  let scale = focus.getAttribute("scale") || 10;
  let z_index_value = focus.getAttribute("z_index") || 0;
  let flip_h_value = focus.getAttribute("flip_h") || "false";
  let flip_v_value = focus.getAttribute("flip_v") || "false";

  angle_slider.value = angle;
  scale_slider.value = scale;
  z_index.value = z_index_value;
  flip_h.checked = flip_h_value == "true";
  flip_v.checked = flip_v_value == "true";
  name_text.innerText = name;
}

function spawn_part(e) {
  e.preventDefault();
  for (let elm of document.getElementsByClassName("part_container")) {
    elm.setAttribute("target", "false");
  }
  // calculate the new cursor position:
  this.setAttribute("target", true);

  // set the element's new position:

  let part = document.createElement("div");
  part.className = "part_container";

  let img = document.createElement("img");
  img.setAttribute("src", this.getAttribute("src"));
  part.appendChild(img);
  img.className = "part_img";

  let keys = ["name", "int", "pwr", "def", "mbl", "hp", "stl"];

  for (let i = 0; i < 7; i += 1) {
    part.setAttribute(keys[i], this.getAttribute(keys[i]));
  }

  dragElement(part);
  canvas.appendChild(part);

  part.onmousedown(e);

  part.style.left =
    e.pageX -
    canvas.getBoundingClientRect().left -
    (e.pageX - this.getBoundingClientRect().left) +
    "px";
  part.style.top =
    e.pageY -
    canvas.getBoundingClientRect().top -
    (e.pageY - this.getBoundingClientRect().top) +
    "px";
}

for (let line of csv.split("\n")) {
  line = line.replaceAll(" ", "");
  let attb = line.split(",");
  if (attb[0] == "name") {
    continue;
  }
  let elm = document.createElement("div");
  let img = document.createElement("img");

  elm.ondragstart = spawn_part;

  elm.className = "body_part";
  img.setAttribute("src", "img/" + attb[0] + ".png");
  img.setAttribute("loading","lazy");
  img.setAttribute("alt",attb[0]);
  elm.setAttribute("src", "img/" + attb[0] + ".png");

  elm.appendChild(img);

  let keys = ["name", "int", "pwr", "def", "mbl", "hp", "stl"];
  let names = [
    "name",
    "intelligence",
    "power",
    "defense",
    "mobility",
    "health",
    "stealth",
  ];

  hash_keys[convertBase(String(attb[0].hashCode()),10,MAX_BASE)] = attb[0];

  for (let i = 0; i < 7; i += 1) {
    let text = document.createElement("p");
    text.innerText = names[i] + ": " + attb[i];
    elm.setAttribute(keys[i], attb[i]);
    if (i != 0) {
      elm.appendChild(text);
    }
  }

  obj_list.appendChild(elm);
}

document.getElementById("part_canvas").onmousedown = (e) => {
  for (let elm of document.getElementsByClassName("part_container")) {
    elm.setAttribute("target", "false");
  }
};

function dragElement(elmnt) {
  var pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0;
  if (document.getElementById(elmnt.id + "header")) {
    // if present, the header is where you move the DIV from:
    document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
  } else {
    // otherwise, move the DIV from anywhere inside the DIV:
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;

    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    if (elmnt.className == "part_container") {
      elmnt.setAttribute("target", true);
      update_item_attb_menu();
    }
    // set the element's new position:
    elmnt.style.top = Math.round((elmnt.offsetTop - pos2)/canvas.clientHeight * 1000) / 10 + "%";
    elmnt.style.left = Math.round((elmnt.offsetLeft - pos1)/canvas.clientWidth * 1000) / 10 + "%";
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    elmnt.setAttribute("target", true);
    update_item_attb_menu();

    document.onmouseup = null;
    document.onmousemove = null;
  }
}
load_from_url();

setInterval(()=> {
  if (window.history.replaceState) {
    let data = "";
    for (let elem of document.getElementsByClassName("part_container")) {
      let d = convert_to_char(elem);
      data = data + ((data=="")? "":";") + d;
    }
    data = compressUrlSafe(data);
        window.history.replaceState({}, null, window.location.href.split('?')[0] + "?d="+data
  );
  }

}, 2000);
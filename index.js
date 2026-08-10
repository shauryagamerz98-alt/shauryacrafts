const mineflayer = require('mineflayer')
const fs = require('fs');

let rawdata = fs.readFileSync('config.json');
let data = JSON.parse(rawdata);

var lasttime = -1;
var moving = 0;
var connected = 0;
var actions = [ 'forward', 'back', 'left', 'right'];
var lastaction;
var pi = 3.14159;
var moveinterval = 2;
var maxrandom = 5;

var host = data["ip"];
var username = data["name"];

var bot = mineflayer.createBot({
    host: host,
    port: data["port"],
    username: username,
    version: '1.21.11'
});

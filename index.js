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
    version: '1.21.10'
});


bot.on('login', () => {
    console.log('BOT LOGGED IN');
});

bot.on('spawn', () => {
    console.log('BOT SPAWNED');
});

bot.on('kicked', (reason) => {
    console.log('BOT KICKED:', reason);
});

bot.on('error', (err) => {
    console.log('BOT ERROR:', err);
});

bot.on('end', (reason) => {
    console.log('BOT DISCONNECTED:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION:', err);
});

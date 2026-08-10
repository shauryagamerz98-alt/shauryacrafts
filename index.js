const mineflayer = require('mineflayer');
const fs = require('fs');

let rawdata = fs.readFileSync('config.json');
let data = JSON.parse(rawdata);

var lasttime = -1;
var moving = 0;
var connected = 0;
var actions = ['forward', 'back', 'left', 'right'];
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

let nightBedUsed = false;
let sleepingBed = null;

bot.on('spawn', () => {
    console.log('BOT SPAWNED');

    // Login after joining
    setTimeout(() => {
        bot.chat('/login shaurya98');
    }, 3000);
});


// Check Minecraft time every 5 seconds
setInterval(async () => {

    // Don't do anything before the bot has spawned
    if (!bot.time) {
        return;
    }

    const time = bot.time.timeOfDay;

    // Minecraft nighttime
    const isNight = time >= 12500 && time < 23500;

    // Reset when daytime starts
    if (!isNight) {
        nightBedUsed = false;
        sleepingBed = null;
        return;
    }

    // Already slept this night
    if (nightBedUsed || bot.isSleeping) {
        return;
    }

    // Find a nearby bed
    const bed = bot.findBlock({
        matching: block => bot.isABed(block),
        maxDistance: 6
    });

    if (!bed) {
        console.log('No bed found nearby.');
        return;
    }

    try {
        sleepingBed = bed;
        nightBedUsed = true;

        await bot.activateBlock(bed);

        console.log('BOT RIGHT-CLICKED BED 🌙');

    } catch (err) {
        console.log('Could not right-click bed:', err.message);
        nightBedUsed = false;
    }

}, 5000);


// When the bot wakes up, face the bed
bot.on('wake', () => {

    setTimeout(async () => {

        if (!sleepingBed) {
            return;
        }

        try {

            await bot.lookAt(
                sleepingBed.position.offset(0.5, 0.5, 0.5),
                true
            );

            console.log('BOT WOKE UP AND IS FACING BED');

        } catch (err) {
            console.log('Could not face bed:', err.message);
        }

    }, 500);

});


// Kicked
bot.on('kicked', (reason) => {
    console.log('BOT KICKED:', reason);
});


// Error
bot.on('error', (err) => {
    console.log('BOT ERROR:', err);
});


// Disconnected
bot.on('end', (reason) => {
    console.log('BOT DISCONNECTED:', reason);
});


// Unexpected errors
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION:', err);
});

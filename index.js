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


bot.on('spawn', () => {
    console.log('BOT SPAWNED');

    setTimeout(() => {
        bot.chat('/login shaurya98');
    }, 3000);

    let nightBedUsed = false;
let sleepingBed = null;

setInterval(async () => {
    const time = bot.time.timeOfDay;

    // Minecraft nighttime
    const isNight = time >= 12500 && time < 23500;

    // Reset for the next night
    if (!isNight) {
        nightBedUsed = false;
        sleepingBed = null;
        return;
    }

    // Already used the bed this night
    if (nightBedUsed || bot.isSleeping) {
        return;
    }

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

bot.on('wake', () => {
    setTimeout(async () => {
        if (sleepingBed) {
            try {
                await bot.lookAt(
                    sleepingBed.position.offset(0.5, 0.5, 0.5),
                    true
                );

                console.log('BOT WOKE UP AND IS FACING BED');
            } catch (err) {
                console.log('Could not face bed:', err.message);
            }
        }
    }, 500);
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

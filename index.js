const mineflayer = require('mineflayer');
const fs = require('fs');

const rawdata = fs.readFileSync('config.json');
const data = JSON.parse(rawdata);

const host = data["ip"];
const username = data["name"];

const bot = mineflayer.createBot({
    host: host,
    port: data["port"],
    username: username,
    version: '1.21.10'
});

let nightBedUsed = false;
let sleepingBed = null;
let sleepCycleRunning = false;


// =========================
// BOT SPAWN
// =========================

bot.on('spawn', () => {
    console.log('BOT SPAWNED');

    // Login after 3 seconds
    setTimeout(() => {
        bot.chat('/login shaurya98');
    }, 3000);
});


// =========================
// SLEEP / WAKE SYSTEM
// =========================

setInterval(async () => {

    // Prevent multiple sleep checks from running together
    if (sleepCycleRunning) {
        return;
    }

    if (!bot.time) {
        return;
    }

    const time = bot.time.timeOfDay;

    // Minecraft nighttime
    const isNight = time >= 12500 && time < 23500;

    // Morning/daytime = reset for next night
    if (!isNight) {
        nightBedUsed = false;
        sleepingBed = null;
        return;
    }

    // Already slept this night
    if (nightBedUsed || bot.isSleeping) {
        return;
    }

    sleepCycleRunning = true;

    try {

        // Find a bed within 6 blocks
        const bed = bot.findBlock({
            matching: block => bot.isABed(block),
            maxDistance: 6
        });

        if (!bed) {
            console.log('No bed found nearby.');
            sleepCycleRunning = false;
            return;
        }

        sleepingBed = bed;

        console.log(
            'BED FOUND:',
            bed.position.x,
            bed.position.y,
            bed.position.z
        );

        // Right-click the bed
        await bot.activateBlock(bed);

        console.log('BOT RIGHT-CLICKED BED 🌙');

        // Give Minecraft a moment to put the bot into sleeping state
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Check whether the bot actually started sleeping
        if (!bot.isSleeping) {
            console.log('BOT DID NOT START SLEEPING');
            sleepingBed = null;
            sleepCycleRunning = false;
            return;
        }

        console.log('BOT IS SLEEPING 💤');

        // Mark this night as completed
        nightBedUsed = true;

        // Wait until the bot wakes up
        while (bot.isSleeping) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log('BOT WOKE UP');

        // Wait a tiny bit after waking
        await new Promise(resolve => setTimeout(resolve, 500));

        // Turn toward the bed
        if (sleepingBed) {

            try {

                await bot.lookAt(
                    sleepingBed.position.offset(0.5, 0.5, 0.5),
                    true
                );

                console.log('BOT WOKE UP AND IS FACING BED');

            } catch (err) {

                console.log(
                    'Could not face bed:',
                    err.message
                );

            }
        }

    } catch (err) {

        console.log(
            'Could not sleep:',
            err.message
        );

        sleepingBed = null;

    } finally {

        sleepCycleRunning = false;

    }

}, 5000);


// =========================
// KICKED
// =========================

bot.on('kicked', (reason) => {
    console.log('BOT KICKED:', reason);
});


// =========================
// ERROR
// =========================

bot.on('error', (err) => {
    console.log('BOT ERROR:', err);
});


// =========================
// DISCONNECTED
// =========================

bot.on('end', (reason) => {
    console.log('BOT DISCONNECTED:', reason);
});


// =========================
// EXTRA ERROR PROTECTION
// =========================

process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION:', err);
});

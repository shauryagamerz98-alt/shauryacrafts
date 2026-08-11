const mineflayer = require('mineflayer');
const fs = require('fs');

const rawdata = fs.readFileSync('config.json');
const data = JSON.parse(rawdata);

const host = data["ip"];
const username = data["name"];

let bot = null;
let sleepInterval = null;
let reconnectTimer = null;
let scheduleInterval = null;

let nightBedUsed = false;
let sleepingBed = null;
let sleepCycleRunning = false;


// =====================================================
// INDIA TIME CHECK
// =====================================================

function getIndiaHour() {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: 'numeric',
        hour12: false
    }).formatToParts(new Date());

    const hourPart = parts.find(part => part.type === 'hour');

    return Number(hourPart.value);
}


// =====================================================
// SHOULD BOT BE OFFLINE?
// 12:00 AM - 7:00 AM IST
// =====================================================

function isOfflineTime() {

    const indiaHour = getIndiaHour();

    return indiaHour >= 0 && indiaHour < 7;

}


// =====================================================
// CONNECT BOT
// =====================================================

function connectBot() {

    // Don't connect between midnight and 7 AM IST
    if (isOfflineTime()) {

        console.log(
            'BOT IS OFFLINE: 12:00 AM - 7:00 AM IST'
        );

        return;
    }


    // Prevent duplicate connections
    if (bot) {
        return;
    }


    console.log('CONNECTING BOT...');


    bot = mineflayer.createBot({
        host: host,
        port: data["port"],
        username: username,
        version: '1.21.10'
    });


    // =================================================
    // SPAWN
    // =================================================

    bot.on('spawn', () => {

        console.log('BOT SPAWNED');


        // Login after 3 seconds
        setTimeout(() => {

            if (bot && bot.player && !isOfflineTime()) {

                bot.chat('/login shaurya98');

                console.log('BOT LOGIN COMMAND SENT');

            }

        }, 3000);


        // Reset sleep variables
        nightBedUsed = false;
        sleepingBed = null;
        sleepCycleRunning = false;


        // Clear old interval
        if (sleepInterval) {

            clearInterval(sleepInterval);

        }


        // =================================================
        // SLEEP CHECK
        // =================================================

        sleepInterval = setInterval(async () => {

            // Don't do anything during offline hours
            if (isOfflineTime()) {
                return;
            }


            if (!bot || !bot.time) {
                return;
            }


            if (sleepCycleRunning) {
                return;
            }


            const time = bot.time.timeOfDay;


            // Minecraft nighttime
            const isNight = time >= 12500 && time < 23500;


            // Daytime = reset for next night
            if (!isNight) {

                nightBedUsed = false;
                sleepingBed = null;

                return;
            }


            // Already slept this night
            if (nightBedUsed) {
                return;
            }


            // Already sleeping
            if (bot.isSleeping) {
                return;
            }


            sleepCycleRunning = true;


            try {

                // Find nearby bed
                const bed = bot.findBlock({
                    matching: block => bot.isABed(block),
                    maxDistance: 6
                });


                if (!bed) {

                    console.log('NO BED FOUND NEARBY');

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


                // Right-click bed
                await bot.activateBlock(bed);

                console.log('BOT RIGHT-CLICKED BED 🌙');


                // Give Minecraft time to start sleeping
                await new Promise(resolve =>
                    setTimeout(resolve, 1000)
                );


                // Check sleeping state
                if (!bot.isSleeping) {

                    console.log('BOT DID NOT START SLEEPING');

                    sleepingBed = null;
                    sleepCycleRunning = false;

                    return;
                }


                console.log('BOT IS SLEEPING 💤');


                // Mark this night as completed
                nightBedUsed = true;


                // Wait until wake-up
                while (bot && bot.isSleeping) {

                    await new Promise(resolve =>
                        setTimeout(resolve, 500)
                    );

                }


                console.log('BOT WOKE UP');


                // Small delay
                await new Promise(resolve =>
                    setTimeout(resolve, 500)
                );


                // Face the bed
                if (sleepingBed && bot) {

                    try {

                        await bot.lookAt(
                            sleepingBed.position.offset(
                                0.5,
                                0.5,
                                0.5
                            ),
                            true
                        );


                        console.log(
                            'BOT WOKE UP AND IS FACING BED'
                        );

                    } catch (err) {

                        console.log(
                            'COULD NOT FACE BED:',
                            err.message
                        );

                    }

                }


            } catch (err) {

                console.log(
                    'COULD NOT SLEEP:',
                    err.message
                );

                sleepingBed = null;

            } finally {

                sleepCycleRunning = false;

            }

        }, 5000);

    });


    // =================================================
    // KICKED
    // =================================================

    bot.on('kicked', (reason) => {

        console.log(
            'BOT KICKED:',
            reason
        );

    });


    // =================================================
    // ERROR
    // =================================================

    bot.on('error', (err) => {

        console.log(
            'BOT ERROR:',
            err.message || err
        );

    });


    // =================================================
    // DISCONNECTED
    // =================================================

    bot.on('end', (reason) => {

        console.log(
            'BOT DISCONNECTED:',
            reason
        );


        if (sleepInterval) {

            clearInterval(sleepInterval);

            sleepInterval = null;

        }


        bot = null;

        sleepCycleRunning = false;
        sleepingBed = null;


        // Don't reconnect during 12 AM - 7 AM IST
        if (isOfflineTime()) {

            console.log(
                'BOT WILL STAY OFFLINE UNTIL 7:00 AM IST'
            );

            return;
        }


        // Prevent multiple reconnect timers
        if (reconnectTimer) {
            return;
        }


        console.log(
            'RECONNECTING BOT IN 15 SECONDS...'
        );


        reconnectTimer = setTimeout(() => {

            reconnectTimer = null;

            connectBot();

        }, 15000);

    });

}


// =====================================================
// SCHEDULE CHECK
// =====================================================

scheduleInterval = setInterval(() => {

    // Midnight → 7 AM
    if (isOfflineTime()) {

        // Bot is currently online → disconnect it
        if (bot) {

            console.log(
                'MIDNIGHT IST: DISCONNECTING BOT UNTIL 7:00 AM 🌙'
            );


            if (sleepInterval) {

                clearInterval(sleepInterval);

                sleepInterval = null;

            }


            nightBedUsed = false;
            sleepingBed = null;
            sleepCycleRunning = false;


            try {

                bot.quit(
                    'Scheduled offline time: 12 AM - 7 AM IST'
                );

            } catch (err) {

                console.log(
                    'COULD NOT DISCONNECT BOT:',
                    err.message
                );

            }

        }

        return;
    }


    // 7 AM → connect
    if (!bot && !reconnectTimer) {

        console.log(
            '7:00 AM IST: STARTING BOT ☀️'
        );

        connectBot();

    }

}, 10000);


// =====================================================
// START BOT
// =====================================================

if (isOfflineTime()) {

    console.log(
        'CURRENT TIME IS BETWEEN 12 AM AND 7 AM IST.'
    );

    console.log(
        'BOT WILL START AUTOMATICALLY AT 7:00 AM IST.'
    );

} else {

    connectBot();

}


// =====================================================
// EXTRA ERROR PROTECTION
// =====================================================

process.on('uncaughtException', (err) => {

    console.error(
        'UNCAUGHT EXCEPTION:',
        err
    );

});


process.on('unhandledRejection', (err) => {

    console.error(
        'UNHANDLED REJECTION:',
        err
    );

});

const mineflayer = require('mineflayer');
const fs = require('fs');

const rawdata = fs.readFileSync('config.json');
const data = JSON.parse(rawdata);

const host = data["ip"];
const username = data["name"];

let bot = null;
let sleepInterval = null;
let reconnectTimer = null;

let nightBedUsed = false;
let sleepingBed = null;
let sleepCycleRunning = false;


// =====================================================
// CONNECT BOT
// =====================================================

function connectBot() {

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

            if (bot && bot.player) {
                bot.chat('/login shaurya98');
                console.log('BOT LOGIN COMMAND SENT');
            }

        }, 3000);


        // Reset sleep variables after reconnect
        nightBedUsed = false;
        sleepingBed = null;
        sleepCycleRunning = false;


        // Clear old interval if any
        if (sleepInterval) {
            clearInterval(sleepInterval);
        }


        // =================================================
        // SLEEP CHECK
        // =================================================

        sleepInterval = setInterval(async () => {

            if (!bot || !bot.time) {
                return;
            }

            // Don't run multiple sleep cycles
            if (sleepCycleRunning) {
                return;
            }


            const time = bot.time.timeOfDay;


            // Minecraft nighttime
            const isNight = time >= 12500 && time < 23500;


            // Daytime
            // Reset so the bot can sleep again next night
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


                // =========================================
                // RIGHT CLICK BED
                // =========================================

                await bot.activateBlock(bed);

                console.log('BOT RIGHT-CLICKED BED 🌙');


                // Give Minecraft time to start sleeping
                await new Promise(resolve =>
                    setTimeout(resolve, 1000)
                );


                // =========================================
                // CHECK IF ACTUALLY SLEEPING
                // =========================================

                if (!bot.isSleeping) {

                    console.log('BOT DID NOT START SLEEPING');

                    sleepingBed = null;
                    sleepCycleRunning = false;

                    return;
                }


                console.log('BOT IS SLEEPING 💤');


                // Mark this night as completed
                nightBedUsed = true;


                // =========================================
                // WAIT UNTIL BOT WAKES
                // =========================================

                while (bot && bot.isSleeping) {

                    await new Promise(resolve =>
                        setTimeout(resolve, 500)
                    );

                }


                console.log('BOT WOKE UP');


                // Small delay after waking
                await new Promise(resolve =>
                    setTimeout(resolve, 500)
                );


                // =========================================
                // FACE THE BED
                // =========================================

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


        // Stop sleep checking
        if (sleepInterval) {

            clearInterval(sleepInterval);

            sleepInterval = null;

        }


        sleepCycleRunning = false;
        sleepingBed = null;


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
// START BOT
// =====================================================

connectBot();


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

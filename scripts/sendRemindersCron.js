// import cron from 'node-cron';
// import fetch from 'node-fetch';
//
// cron.schedule('51,55 16 * * *', async () => {
//     console.log('⏰ Running reminder task...');
//
//     try {
//         const res = await fetch('http://localhost:3000/api/send-reminders', {
//             method: 'POST',
//         });
//
//         const data = await res.json();
//         console.log('✅ Reminders sent:', data);
//     } catch (error) {
//         console.error('❌ Error sending reminders:', error);
//     }
// });
//
// console.log('🚀 Reminder cron started...');


import cron from 'node-cron';
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();
// Read the time from reminderTime.json
async function getScheduledTime() {
    const filePath = path.join(process.cwd(), 'reminderTime.json');
    try {
        const file = await fs.readFile(filePath, 'utf-8');
        const { hour, minute } = JSON.parse(file);
        return { hour, minute };
    } catch (error) {
        console.error('❌ Failed to read reminder time, using default 9:00');
        return { hour: '9', minute: '0' }; // fallback
    }
}

async function startReminderJob() {
    const { hour, minute } = await getScheduledTime();

    const cronExpression = `${minute} ${hour} * * *`; // e.g., "0 9 * * *"

    console.log(`🕓 Scheduling reminders at ${hour}:${minute} every day...`);

    cron.schedule(cronExpression, async () => {
        console.log('⏰ Running reminder task...');

        try {
            const res = await fetch(`${process.env.BASE_URL}/api/send-reminders`, {
                method: 'GET',
            });

            const data = await res.json();
            console.log('✅ Reminders sent:', data);
        } catch (error) {
            console.error('❌ Error sending reminders:', error);
        }
    });
}

startReminderJob();
console.log('🚀 Reminder cron started...');
import mongoose from "mongoose";
import { env } from "./env.js";
import gradient from "gradient-string";

export const connectDB = async () => {
    const blueWhite = gradient(['#1e3a8a', '#3b82f6', '#93c5fd', '#ffffff']);
    const lightBlue = gradient(['#60a5fa', '#dbeafe']);
    const greenGradient = gradient(['#059669', '#10b981', '#6ee7b7']);
    const redGradient = gradient(['#dc2626', '#ef4444', '#fca5a5']);
    
    try {
        await mongoose.connect(env.database);
        
        console.log('\n');
        console.log(blueWhite('  DATABASE CONNECTION'));
        console.log(lightBlue('  ──────────────────'));
        console.log(`\n  ${greenGradient('● Connected successfully')}\n`);
        
    } catch (error) {
        console.log('\n');
        console.log(blueWhite('  DATABASE CONNECTION'));
        console.log(lightBlue('  ──────────────────'));
        console.log(`\n  ${redGradient('✖ Error: ' + error.message)}\n`);
        process.exit(1);
    }
}
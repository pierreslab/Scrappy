const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config(); // In case we use env, but we'll read from config.js

// Mocking the config import since it's a JS file with exports
const configPath = path.join(__dirname, '../data/config.js');
const configContent = fs.readFileSync(configPath, 'utf8');

// Extract keys using regex
const supabaseUrlMatch = configContent.match(/SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/);
const supabaseKeyMatch = configContent.match(/SUPABASE_ANON_KEY\s*=\s*['"]([^'"]+)['"]/);

if (!supabaseUrlMatch || !supabaseKeyMatch) {
    console.error('Could not find Supabase credentials in config.js');
    process.exit(1);
}

const supabaseUrl = supabaseUrlMatch[1];
const supabaseAnonKey = supabaseKeyMatch[1];

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const images = [
    {
        name: 'Plastic Bottle Planter',
        path: '/Users/pierre/.gemini/antigravity/brain/f847da57-24a3-4bce-be8c-ca3426869805/chloe_bottle_planter_1768143171165.png',
        userId: '15b21db2-f992-49f7-a26a-439690d36a84'
    },
    {
        name: 'Cardboard Castle',
        path: '/Users/pierre/.gemini/antigravity/brain/f847da57-24a3-4bce-be8c-ca3426869805/chloe_cardboard_castle_1768143190292.png',
        userId: '15b21db2-f992-49f7-a26a-439690d36a84'
    },
    {
        name: 'Decorated Can Organizer',
        path: '/Users/pierre/.gemini/antigravity/brain/f847da57-24a3-4bce-be8c-ca3426869805/james_can_organizer_1768143401444.png',
        userId: '8f7fd71b-cca0-40d2-8d6b-56bc6ca946de'
    }
];

async function uploadImages() {
    for (const img of images) {
        try {
            const fileBuffer = fs.readFileSync(img.path);
            const fileName = `${img.userId}/${path.basename(img.path)}`;

            console.log(`Uploading ${img.name}...`);

            const { data, error } = await supabase.storage
                .from('crafts')
                .upload(fileName, fileBuffer, {
                    contentType: 'image/png',
                    upsert: true
                });

            if (error) {
                console.error(`Error uploading ${img.name}:`, error.message);
                continue;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('crafts')
                .getPublicUrl(data.path);

            console.log(`Successfully uploaded ${img.name}. Public URL: ${publicUrl}`);

            // Update database
            const { error: dbError } = await supabase
                .from('crafts')
                .update({ photo_url: publicUrl })
                .eq('user_id', img.userId)
                .eq('name', img.name);

            if (dbError) {
                console.error(`Error updating database for ${img.name}:`, dbError.message);
            } else {
                console.log(`Database updated for ${img.name}`);
            }
        } catch (err) {
            console.error(`Unexpected error for ${img.name}:`, err.message);
        }
    }
}

uploadImages();

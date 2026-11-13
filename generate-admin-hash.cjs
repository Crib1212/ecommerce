
const {
    scryptSync,
    randomBytes
} = require('node:crypto');

const readline = require('node:readline/promises');

async function main() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const password = await rl.question('Enter your new admin password: ');
    rl.close();

    if (password.length < 12 || password.length > 256) {
        console.error('Password must be between 12 and 256 characters.');
        process.exitCode = 1;
        return;
    }

    const salt = randomBytes(16).toString('hex');

    const hash = scryptSync(password, salt, 64).toString('hex');

    console.log('\nYour new environment variable:\n');
    console.log(`ADMIN_PASSWORD_HASH=${salt}$${hash}`);
}

main().catch(error => {
    console.error('Error:', error.message);
    process.exitCode = 1;
});

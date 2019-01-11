#!/usr/bin/env node

const fs = require('fs');
const chalk = require('chalk');
const log = console.log;
const glob = require('glob');

let useTimestamp = (process.argv.includes('-t') || process.argv.includes('--timestamp'));

// Combine styled and normal strings
log(chalk.blue('Bumping client dependency files'));

function bump(file) {
    return new Promise(resolve => {
        fs.readFile(file, 'utf8', function(err, contents) {
            const regex = /(clientDependency.*version=")(\d*)(")/;

            let matches = contents.match(regex);

            let oldVersionNum = parseInt(matches[2]);
            let newVersionNum = oldVersionNum + 1;

            if(useTimestamp) {
                newVersionNum = new Date().getTime();
                // trim numbers of the front, to prevent it being larger than an int
                newVersionNum = Math.floor(newVersionNum / 1000);
            }

            log(`Bumping ${chalk.yellow(file)} from ${chalk.red(oldVersionNum)} to ${chalk.green(newVersionNum)}`);

            contents = contents.replace(regex, `$1${newVersionNum}$3`);

            fs.writeFile(file, contents, function(err) {
                resolve();
            });
        });
    });
}

glob('**/*/config/ClientDependency.config', {}, function(err, files) {
    if(err) console.error(err);

    if(files.length == 0) {
        console.warn('Couldn\'t find any files');
        process.exit(1);
    }

    let promises = [];
    files.forEach(file => {
        if(file.includes("packages/")) {
            log(chalk.yellow(`Skipping ${file} inside packages dir`));
        } else {
            promises.push(bump(file));
        }
    });

    Promise.all(promises).then(x => {
        console.log('Completed');
        process.exit(0);
    });
});

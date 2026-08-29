

const fs = require('fs')

let jdata = fs.readFileSync("tools/modcmds.json").toString()
let cmd_table = JSON.parse(jdata)

let target = fs.readFileSync("index.js").toString()

let unimplemented = {}

for ( let cmd in cmd_table ) {
    if ( target.indexOf(cmd) < 0 ) {
        unimplemented[cmd] = cmd_table[cmd]
    }
}


let json_out = JSON.stringify(unimplemented,null,2)
console.log("cmd count:",Object.keys(unimplemented).length)
console.log(json_out)

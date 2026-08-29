
const fs = require('fs')


let data = fs.readFileSync("known_cmd.txt").toString()


let cmd_line_matcher = /[A-Z]{4} \:\:/

let all_cmds = {}

data = data.split("\n")
for ( let line of data ) {
    line = line.trim()
    if ( line.length ) {
        if ( cmd_line_matcher.exec(line) ) {
            let cmd = line.substring(0,4)
            let explain = line.substring(line.indexOf('"')+1,line.lastIndexOf('"')-1)
            all_cmds[cmd] = explain
        }
    }
}



let json_out = JSON.stringify(all_cmds,null,2)
console.log(json_out)


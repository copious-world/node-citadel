'use strict'

const net = require('net')
const fs = require('fs')
//const EventEmitter = require('events');
//


class RoomDescriptor {
    constructor(fields) {
        this.QName = fields[0]
        this.QRpasswd = fields[1]
        this.QRdirname = fields[2]
        this.QRflags = parseInt(fields[3])
        this.QRfloor = parseInt(fields[4])
        this.QRorder = parseInt(fields[5])
        this.QRdefaultview = parseInt(fields[6])
        this.QRflags2 = parseInt(fields[7])
    }
}

class CitadelUser {
    constructor() {
        this.fullname = fields[0]
        this.password = fields[1]
        this.flags = parseInt(fields[2])
        this.timescalled = parseInt(fields[3])
        this.posted = parseInt(fields[4])
        this.axlevel = parseInt(fields[5])
        this.usernum = parseInt(fields[6])
        this.lastcall = parseInt(fields[7])
        this.USuserpurge = parseInt(fields[8])
    }
}

class ExpirationPolicy {
    constructor(em,ev) {
        this.expire_mode = em
		this.expire_value = ev
    }
}



function shortLines(text) {
    if ( text.length > 1000 ) {
        let lines = text.split('\n')
        let shortLines = lines.map((line) => {
            if ( line.length > 1000 ) {
                let edited = ""
                while ( line.length > 1000 ) {
                    let fline = line.slice(0,999)
                    line = line.slice(999)
                    edited += '\n' + fline
                }
                edited += '\n' + line
                line = edited.trim()
            }
            return(line)
        })
        return(shortLines.join('\n').trim())
    } else {
        return(text)
    }
}

class CitadelClient {

    // ---- ---- ---- ---- ----
    constructor() {
        this.schedule = []
        this.client = null
        this.nowait = true
        this.roomMap = {}
        this.room_types = [ "LKRA", "LKRN", "LKRO", "LZRM", "LRMS", "LPRM" ]
        this.message_proto = [ "ALL", "OLD", "NEW", "LAST", "FIRST", "GT", "LT" ]
        this.policy_scope = [ "room", "floor", "site", "mailboxes" ];
        //
        this.restart_agent = null;
        //
        this.PUBLIC_ROOM = 1
        this.HIDDEN_ROOM = 2
        this.INVITATION_ROOM = 4
        this.PERSONAL_ROOM = 5
        //
        this.last_writer = null
        //
        this.CLIENT_VERSION = 1000

        this.uploading = false
        this.downloading = false
        this.binary_data = false
        this.accrue = ''
        //
        this.download_promise = null
        this.failed_data = null
        this.section_count = -1
        //
    }

    //
    set_restart_agent(agent) {
        if ( agent && (typeof agent === 'object') ) {
            this.restart_agent = agent;
        }
    }

    // ---- ---- ---- ---- ----
    connect(restart_agent) {
        //
        this.restart_agent = (restart_agent !== undefined) ? restart_agent : null;
        //
        let resolver = null
        let rejector = null
        let p = new Promise((resolve,reject) => {
            resolver = () => { rejector = null; resolve(true); resolver = null;  }
            rejector = () => { reject(false) }
        })
        //
        let client = net.createConnection({ port: 504 }, () => {
            console.log('connected to server!');
            this.client = client;
            if ( resolver ) resolver()
            else client.end()
          });
          
        //
        client.on('error',(err) => {
            console.log(err.message)
            if ( rejector ) rejector()
        });
        //
        client.on('data', (data) => {
            if ( this.downloading ) {
                let sdata = data.toString()
                this.accrue += sdata
                if ( this.test_ready(this.accrue) ) {
                    this.download_promise(this.accrue)
                }
                return;
            }
            let line = data.toString().trim();
            let resp = line.split(' ')
            let status = parseInt(resp.shift())
            let bucket = status/100
            if ( (bucket !== 5) ) {
                if ( this.last_writer !== null ) {
                    let data_resolution = this.last_writer
                    if ( data_resolution.resolver ) {
                        data_resolution.resolver({ 'status' : status, 'bucket' : bucket, 'response' : resp })
                    }
                }
            } else {
                if ( this.last_writer !== null ) {
                    let error_resolution = this.last_writer
                    if ( error_resolution && error_resolution.rejector ) error_resolution.rejector(line)
                }
            }
            if ( bucket === 2 ) {
                this.next_waiting_write()
            }
        });
        //
        client.on('end', () => {
            console.log('disconnected from server');
            if ( this.restart_agent ) {
                this.restart_agent.emit('restart')
            }
        });
        //
        return p
    }

    // ---- ---- ---- ---- ----
    lockWriter() {
        this.uploading = true
        this.holdSchedule = this.schedule
        this.schedule = []
    }

    unlockWriter() {
        this.uploading = false
        this.schedule = this.holdSchedule;
    }

    // ---- ---- ---- ---- ----
    next_waiting_write() {
        if ( this.schedule.length ) {
            let next = this.schedule.shift()
            if ( next.writer ) next.writer()
            this.last_writer = next
        } else {
            this.last_writer = null
            if ( this.nowait ) {
                this.client.end()
            }
        }
    }

    // ---- ---- ---- ---- ----
    clientWrite(str,useDelay,privileged) {
        if ( this.client ) {
            let resolver = null
            let rejector = null
            let p = new Promise((resolve,reject) => {
                resolver = (data) => { resolve(data) }
                rejector = (data) => { reject(data) }
            })

            if ( (this.uploading || this.downloading) && !privileged ) {
                this.holdSchedule.push({ 
                    'resolver' : resolver,
                    'rejector' : rejector, 
                    'writer' : () => { this.client.write(`${str}\n`) }
                })
                return p
            }

            if ( !useDelay ) {
                if ( this.last_writer !== null || this.waitingDelay ) {
                    this.schedule.push({ 
                        'resolver' : resolver,
                        'rejector' : rejector, 
                        'writer' : () => { this.client.write(`${str}\n`) }
                    })
                } else {
                    this.last_writer = { 'resolver' : resolver, 'rejector' : rejector, 'writer' : null }
                    this.client.write(`${str}\n`)
                }
            } else {
                this.waitingDelay = true
                setTimeout(() => { this.waitingDelay = false; resolver('OK'); this.next_waiting_write() }, 1000)
                this.client.write(`${str}\n`)
            }
            return p
        }
    }

    async quit() {
        let resp = await this.clientWrite("QUIT")
        if ( resp.response ) {
            return true
        } else {
            return false
        }
    }

    hande_generic_response(resp) {
        if ( resp.response ) {
            let output = resp.response
            output = output.join(' ')
            return(output)
        } else {
            return false
        }
    }

    async server_time() {
        let resp = await this.clientWrite("TIME")
        return this.hande_generic_response(resp)
    }

    async echo(str) {
        let resp =  await this.clientWrite("ECHO " + str)
        return this.hande_generic_response(resp)
    }

    async noop() {
        let resp =  await this.clientWrite("NOOP")
        return this.hande_generic_response(resp)
    }

    async rooms(rt,floor) {
        //
        if ( rt === undefined ) {
            rt = 0
        }
        if ( floor === undefined ) {
            floor = -1
        }
        //
        let room_type_symbol = this.room_types[rt]
        let cmdstr = `${room_type_symbol} ${floor}`
        //
        let resp =  await this.clientWrite(cmdstr)
        let output = this.hande_generic_response(resp)
        //
        if ( output ) {
            let rlist = output.split('\n')
            let rrecords = rlist.map((rline) => {
                let rdata = rline.split('|')
                let name = rdata.shift()
                return({ 'name' : name, 'rest' : rdata.join('|') })
            })
            //
            this.roomMap = {}
            rrecords.forEach((rec) => {
                if ( rec.name === 'Known rooms:' ) return;
                if ( rec.name === '000' ) return;
                this.roomMap[rec.name] = rec
            })
    
            return(this.roomMap)    
        }
        return(false)
    }

    async user(uname) {
        let cmdstr = "USER " + uname
        let resp =  await this.clientWrite(cmdstr)
        let output = this.hande_generic_response(resp)
        return(output)
    }

    async password(pass) {
        let cmdstr = "PASS " + pass
        let resp =  await this.clientWrite(cmdstr)
        let output = this.hande_generic_response(resp)
        return(output)
    }

    async tryApopPassword(pop_pass) {  // cret ... 
        if (!pop_pass) return -2;
        let cmdstr = "PAS2 " + pop_pass
        let resp =  await this.clientWrite(cmdstr)
        let output = this.hande_generic_response(resp)
        return(output)

    }

    async get_config() {
        let resp =  await this.clientWrite("GETU ")
        let output = this.hande_generic_response(resp)
        return(output)
    }
 
    async logout() {
        let resp =  await this.clientWrite("LOUT")
        let output = this.hande_generic_response(resp)
        return(output)
    }

    async create_room(roomname,type,floor) {
        if ( type != 3 ) {
            let cmd = `CRE8 1|${roomname}|${type}||${floor}`
            let resp =  await this.clientWrite(cmd)
            let output = this.hande_generic_response(resp)
            return(output)
        }
        return("ERR")
    }

    async createPasswordRoom(roomname,floor,password) {
        let cmd = `CRE8 1|${roomname}|3|${password}|${floor}`
        let resp =  await this.clientWrite(cmd)
        let output = this.hande_generic_response(resp)
        return(output)

    }

    async list_floors() {
        let resp =  await this.clientWrite("LFLR")
        let output = this.hande_generic_response(resp)
        return(output)
    }

    async goto_room(room) {
        let cmdstr = "GOTO " + room
        let resp =  await this.clientWrite(cmdstr)
        let output = this.hande_generic_response(resp)
        return(output)
    }
    
    async goto_password_room(room,password) {
        let cmdstr = `GOTO ${room}|${password}`
        let resp =  await this.clientWrite(cmdstr)
        let output = this.hande_generic_response(resp)
        return(output)
    }

    async post_message(msgObject) {
        let msg = `ENT0 ${1}|${msgObject.recipient}|${msgObject.anonymous}|${msgObject.type}|${msgObject.subject}|${msgObject.author}||||||${msgObject.references}|`
        //
        let resp =  await this.clientWrite(msg)
        let output = this.hande_generic_response(resp)

        let text = msgObject.text;
        text = text.trim()
        text = shortLines(text)
        console.log(text)
        text += '\n000'
        output = await this.clientWrite(text,true)  // clientWrite nowait
        return(output)
    }

    async set_password(pass) {
        let cmdstr = "SETP " + pass
        let resp =  await this.clientWrite(cmdstr)
        let output = this.hande_generic_response(resp)
        return(output)
    }

    async create_user(username,pass) {
        try {
            let cmdstr = "NEWU " + username
            let resp =  await this.clientWrite(cmdstr)
            resp = await this.set_password(pass)
            return(resp.response)
        } catch ( e ) {
            console.log("create user: " + e.message)
            return(false)
        }
    }

    async admin_create_user(username) {
        try {
            let cmdstr = "CREU " + username
            let resp = await this.clientWrite(cmdstr)
            let output = this.hande_generic_response(resp)
            return(output)
        } catch ( e ) {
            console.log("admin create user: " + e.message)
            return(false)
        }
    }
    
    async rename_user(oldname,newname) {
        if (!oldname) return -2;
        if (!newname) return -2;
        let cmdstr = `RENU ${oldname}|${newname}`
        let resp = await this.clientWrite(cmdstr)
        let output = this.hande_generic_response(resp)
        return(output)
    }

    // 
    async get_messages(which,whicharg,mtemplate) {
        //
        if ( typeof which !== 'number' ) return -2;
        if ( which < 0 || which > 6 ) return -2;
        let protos = this.message_proto[which]
        //
        let output = null
        let cmdstr = ''
        if ( which <= 2 ) {
            cmdstr = `MSGS ${protos}||${(mtemplate) ? 1 : 0}`
        } else {
            cmdstr = `MSGS ${protos}|${whicharg}|${(mtemplate) ? 1 : 0}`
        }
        let resp = await this.clientWrite(cmdstr)
        if ( resp.bucket !== 1 ) {
            return(resp.status)
        } else {
            output = this.hande_generic_response(resp)
        }
        return(output)
    }

    async who_knows_room() {
        let resp =  await this.clientWrite("WHOK")
        return this.hande_generic_response(resp)
    }

    async server_info() {
        let resp =  await this.clientWrite("INFO")
        return this.hande_generic_response(resp)
    }
    
    async read_directory() {
        let resp =  await this.clientWrite("RDIR")
        return this.hande_generic_response(resp)
    }
    
    async read_directory() {
        let resp =  await this.clientWrite("RDIR")
        return this.hande_generic_response(resp)
    }

    async set_last_read(msgnum) {
        let cmdstr = "SLRP HIGHEST"
        if (msgnum) {
            cmdstr = `SLRP ${msgnum}`
        }
        let resp = await this.clientWrite(cmdstr)
        let output = this.hande_generic_response(resp)
        return(output)
    }

    invite_user_to_room(username) {
        let cmdstr = "INVT " + username
        let resp = await this.clientWrite(cmdstr)
        let output = this.hande_generic_response(resp)
        return(output)
    }

    kickout_user_from_room(username) {
        let cmdstr = "KICK " + username
        let resp = await this.clientWrite(cmdstr)
        let output = this.hande_generic_response(resp)
        return(output)
    }

    //
    async get_room_attributes() {
        let resp =  await this.clientWrite("GETR")
        if ( resp.bucket === 2 ) {
            let output =  this.hande_generic_response(resp)
            let fields = output.split('|')
            return new RoomDescriptor(fields)
        }
        return resp.status
    }

    set_room_attributes(roomDescr,forget) {
        let cmdstr = `SETR ${roomDescr.QRname}|${roomDescr.QRpasswd}|${roomDescr.QRdirname}|`
            cmdstr += `${roomDescr.QRflags}|${forget}|${roomDescr.QRfloor}|${roomDescr.QRorder}|`
            cmdstr += `${roomDescr.QRdefaultview}|${roomDescr.QRflags2}`
        let resp = await this.clientWrite(cmdstr)
        let output = this.hande_generic_response(resp)
        return(output)
    }

    get_room_aide() {
        let cmdstr = "GETA"
        let resp = await this.clientWrite(cmdstr)
        let output = this.hande_generic_response(resp)
        return(output)
    }

    room_info() {
        let cmdstr = "RINF"
        let resp = await this.clientWrite(cmdstr)
        let output = this.hande_generic_response(resp)
        return(output)
    }

    delete_message(msgnum) {
        let cmdstr = `DELE ${msgnum}`
        let resp = await this.clientWrite(cmdstr)
        let output = this.hande_generic_response(resp)
        return(output)
    }

    move_message(msgnum,destroom,copy) {
        let cmdstr = `MOVE ${msgnum}|${destroom}|${copy ? '1' : '0'}`
        let resp = await this.clientWrite(cmdstr)
        let output = this.hande_generic_response(resp)
        return(output)
    }

    create_room(for_real,roomname,type,password,floor) {
        if ( !roomname ) return(-2)
        let cmdstr = ''
        if ( password ) {
            cmdstr = `CRE8 ${for_real}|${roomname}|${type}|${password}|${floor}`
        } else {
            cmdstr = `CRE8 ${for_real}|${roomname}|${type}||${floor}`
        }
        let resp = await this.clientWrite(cmdstr)
        let output = this.hande_generic_response(resp)
        return(output)
    }

    forget_room() {
        let cmdstr = "FORG"
        let resp = await this.clientWrite(cmdstr)
        let output = this.hande_generic_response(resp)
        return(output)
    }

    system_message(message) {
        let cmdstr = "MESG " + message
        let resp = await this.clientWrite(cmdstr)
        let output = this.hande_generic_response(resp)
        return(output)

    }

    unvalidated_user() {
        let cmdstr = "GNUR"
        let resp = await this.clientWrite(cmdstr)
        let output = this.hande_generic_response(resp)
        return(output)
    }

    user_registration(username) {
        let cmdstr = "GREG"
        if (username) {
            cmdstr = "GREG " + username
        }
        let resp = await this.clientWrite(cmdstr)
        let output = this.hande_generic_response(resp)
        return(output)
    }

    validate_user(username,axlevel) {
        if ( !username ) return(-2)
        if ( !axlevel ) return(-2)
        //
        let cmdstr = `VALI ${username}|${axlevel}`
        let resp = await this.clientWrite(cmdstr)
        let output = this.hande_generic_response(resp)
        return(output)
    }

    set_room_info(for_real) {
        let cmdstr = `EINF ${for_real ? '1' : '2'}`
        let resp = await this.clientWrite(cmdstr)
        let output = this.hande_generic_response(resp)
        return(output)
    }

    set_registration() {
        let cmdstr = 'REGI'
        let resp = await this.clientWrite(cmdstr)
        let output = this.hande_generic_response(resp)
        return(output)
    }

    misc_check() {
        let cmdstr = 'CHEK'
        let resp = await this.clientWrite(cmdstr)
        let output = this.hande_generic_response(resp)
        return(output)
    }

    delete_file(filename) {
        let cmdstr = `DELF ${filename}`
        let resp = await this.clientWrite(cmdstr)
        let output = this.hande_generic_response(resp)
        return(output)
    }

    move_file(filename,destroom) {
        if (!filename) return -2;
        if (!destroom) return -2;
        let cmdstr = `MOVF ${filename}|${destroom}`
        let resp = await this.clientWrite(cmdstr)
        let output = this.hande_generic_response(resp)
        return(output)
    }

    on_line_users() {
        let cmdstr = 'RWHO'
        let resp = await this.clientWrite(cmdstr)
        let output = this.hande_generic_response(resp)
        return(output)
    }

    // ---- ---- ---- ---- 
    query_username(username) {
        let cmdstr = 'QUSR ' + username
        let resp = await this.clientWrite(cmdstr)
        let output = this.hande_generic_response(resp)
        return(output)
    }

    floor_isting() {
         let cmdstr = 'LFLR'
         let resp = await this.clientWrite(cmdstr)
         let output = this.hande_generic_response(resp)
         return(output)
     }

     create_floor(name,for_real) {
        if ( !name ) return -2;
        let cmdstr = `CFLR ${name}|${for_real}`
        let resp = await this.clientWrite(cmdstr)
        let output = this.hande_generic_response(resp)
        return(output)
    }
    
    delete_floor(floornum,for_real) {
        if (floornum < 0) return -1;
        let cmdstr = `KFLR ${name}|${for_real}`
        let resp = await this.clientWrite(cmdstr)
        let output = this.hande_generic_response(resp)
        return(output)
    }

    edit_floor(floornum,floorname) {
        if ( !floorname ) return -2;
        if ( floornum < 0 ) return -1;
        let cmdstr = `EFLR ${floornum}|${floorname}`
        let resp = await this.clientWrite(cmdstr)
        let output = this.hande_generic_response(resp)
        return(output)
    }

    identify_software(developerid,clientid,revision,software_name,hostname) {
        if ( !floorname ) return -2;
        if ( floornum < 0 ) return -1;
        //
        if ( (developerid < 0) || (clientid < 0) || (revision < 0) || !software_name ) {
            developerid = 8;
            clientid = 0;
            revision = this.CLIENT_VERSION - 600;
            software_name = "Citadel (libcitadel)";
        }
        if ( !hostname ) return -2;

        let cmdstr = `IDEN ${developerid}|${clientid}|${revision}|${software_name}|${hostname}`
        let resp = await this.clientWrite(cmdstr)
        let output = this.hande_generic_response(resp)
        return(output)
    }


    // ---- ---- ---- ---- 
    get_instant_message() {
        let cmdstr = 'GEXP'
        let resp = await this.clientWrite(cmdstr)
        let output = this.hande_generic_response(resp)
        return(output)
    }

    instant_message_receipt() {
        let cmdstr = `DEXP ${mode}`
        let resp = await this.clientWrite(cmdstr)
        let output = this.hande_generic_response(resp)
        return(output)
    }

    get_bio(username) {
        if ( !bio ) return -2;
        let cmdstr = `RBIO ${username}`
        let resp = await this.clientWrite(cmdstr)
        let output = this.hande_generic_response(resp)
        return(output)
    }


    stealth_mode(mode) {
        let cmdstr = `STEL ${mode}`
        let resp = await this.clientWrite(cmdstr)
        let output = this.hande_generic_response(resp)
        return(output)
    }

    terminate_session(sid) {
        let cmdstr = `TERM ${sid}`
        let resp = await this.clientWrite(cmdstr)
        let output = this.hande_generic_response(resp)
        return(output)
    }

    terminate_server_now() {
        let cmdstr = 'DOWN'
        let resp = await this.clientWrite(cmdstr)
        this.send_text(bio)
        return(resp.status)
    }

    terminate_server_scheduled(mode) {
        let cmdstr = `SCDN ${mode ? 1 : 0}`
        let resp = await this.clientWrite(cmdstr)
        let output = this.hande_generic_response(resp)
        return(output)
    }



    // 
    aide_get_user_parameters(who) {
        let cmdstr = `AGUP ${who}`
        let resp = await this.clientWrite(cmdstr)
        if ( resp.bucket === 2 ) {
            let output =  this.hande_generic_response(resp)
            let fields = output.split('|')
            return new CitadelUser(fields)
        }
        return(resp.status)
    }

    aide_set_user_parameters(cit_user) {
        //
        if ( !(cit_user instanceof CitadelUser) ) return -2;
        let cmdstr = `ASUP ${cit_user.fullname}|${cit_user.password}|${cit_user.flags}|`
            cmdstr += `${cit_user.timescalled}|${cit_user.posted}|${cit_user.axlevel}|${cit_user.usernum}|`
            cmdstr += `${cit_user.lastcall}|${cit_user.lastcall}`        
        let resp = await this.clientWrite(cmdstr)
        let output = this.hande_generic_response(resp)
        return(output)
    }

    aide_get_email_addresses(who) {
        let cmdstr = `AGEA ${who}`
        let resp = await this.clientWrite(cmdstr)
        if ( resp.bucket === 1 ) {
            let output =  this.hande_generic_response(resp)
            return(output)
        }
        return(resp.status)
    }
    


    get_message_expiration_policy(which) {
        if ( (which < 0) || (which > 3) ) return -2;
        let policy = this.expiration_policies[which]
        let cmdstr = `GPEX ${policy}`
        let resp = await this.clientWrite(cmdstr)
        if ( resp.bucket == 2 ) {
            return new ExpirationPolicy(resp.response[0],resp.response[1])
        }
        return(resp.status)
    }

    set_message_expiration_policy(which,policy) {
        if ( (which < 0) || (which > 3) ) return -2;
        let scope = this.policy_scope[which]
        let cmdstr = `SPEX ${scope}|${policy.expire_mode}|${policy.expire_mode}`
        let resp = await this.clientWrite(cmdstr)
        let output =  this.hande_generic_response(resp)
        return(output)
    }


    get_system_config() {
        let cmdstr = `CONF GET`
        let resp = await this.clientWrite(cmdstr)
        let output =  this.hande_generic_response(resp)
        return(output)
    }
    
    

    get_system_config_by_type(mimetype,listing) {
        if ( !mimetype ) return -2;
        let cmdstr = `CONF GETSYS|${mimetype}`
        let resp = await this.clientWrite(cmdstr)
        let output =  this.hande_generic_response(resp)
        return(output)
    }

    // 
    set_system_config_by_type(mimetype) {
        let cmdstr = `CONF PUTSYS|${mimetype}`
        let resp = await this.clientWrite(cmdstr)
        let output =  this.hande_generic_response(resp)
        return(output)
    }

    set_room_network_config(session) {
        if ( session < 0 ) return -2;
        let cmdstr = `SNET`
        let resp = await this.clientWrite(cmdstr)
        this.send_text(listing)
        return(resp.status)
    }

    request_client_logout(session) { //
        if ( session < 0 ) return -2;
        let cmdstr = `REQT ${session}`
        let resp = await this.clientWrite(cmdstr)
        let output =  this.hande_generic_response(resp)
        return(output)
    }

    set_message_seen(msgnum,seen) {
        if ( msgnum < 0 ) return -2;
        let cmdstr = `SEEN ${msgnum}|${seen}`
        let resp = await this.clientWrite(cmdstr)
        let output =  this.hande_generic_response(resp)
        return(output)
    }

    directory_lookup(address) {
        if ( !address ) return -2;
        let cmdstr = `QDIR ${address}`
        let resp = await this.clientWrite(cmdstr)
        let output =  this.hande_generic_response(resp)
        return(output)
    }

    internal_program(secret) {
        let cmdstr = `IPGM ${secret}`
        let resp = await this.clientWrite(cmdstr)
        let output =  this.hande_generic_response(resp)
        return(output)
    }

    // download/upload ...

    file_download(filename) {
        if ( !filename ) return(-2)
        let cmdstr = `OPEN ${filename}`
        let resp = await this.clientWrite(cmdstr)
        if ( resp.bucket == 2 ) {
            this.process_download(resp)
        }
    }

    // 
    attachment_download(msgnum,part) {
        if ( !msgnum ) return(-2)
        if ( !part ) return(-2)
        let cmdstr = `OPNA ${msgnum}|${part}`
        let resp = await this.clientWrite(cmdstr)
        if ( resp.bucket == 2 ) {
            this.process_download(resp,true)
        }
        return(resp.status)
    }

    image_download(filename) {
        if ( !filename ) return(-2)
        let cmdstr = `OIMG ${msgnum}`
        let resp = await this.clientWrite(cmdstr)
        if ( resp.bucket == 2 ) {
            this.process_download(resp,true)
        }
        return(resp.status)
    }

    file_upload(save_as,comment,path) {
        if (!save_as) return -1;
        if (!comment) return -1;
        if (!path) return -1;
        let mimetype = this.approximate_mime_type(path)
        let filedata = this.read_file(path)
        if ( filedata ) {
            this.lockWriter()
            let cmdstr = `UOPN ${save_as}|${mimetype}|${comment}`
            let resp = await this.clientWrite(cmdstr,false,true)
            //
            if ( resp.bucket == 2 ) {
                await this.binary_upload(filedata)
            }
            this.unlockWriter()
        }
    }
    // single message

    image_upload(for_real,save_as,path) {
        if (!save_as) return -1;
        if (!comment) return -1;
        if (!path) return -1;
        let mimetype = this.approximate_mime_type(path)
        let filedata = this.read_file(path)  // a buffer
        this.lockWriter()
        let cmdstr = `UIMG ${for_real}|${mimetype}|${save_as}`
        let resp = await this.clientWrite(cmdstr)
        //
        if ( resp.bucket == 2 ) {
            let success = await this.binary_upload(filedata)
            this.end_upload(success)
        }
        this.unlockWriter()
    }

    // ---- ---- ---- ---- 
    // send text

    send_instant_message(username,text) {
        if ( !username ) return -2;
        let cmdstr = ''
        if (text) {
            cmdstr = `SEXP ${username}|-`
            let resp = await this.clientWrite(cmdstr)
            if ( resp.bucket === 4 ) {
                this.send_text(text)
            }
            return(resp.status)
        } else {
            cmdstr = `SEXP ${username}||`
            let resp = await this.clientWrite(cmdstr)
            return(resp.status)
        }
    }

    set_bio(bio) {
        if ( !bio ) return -2;
        let cmdstr = 'EBIO'
        let resp = await this.clientWrite(cmdstr)
        if ( resp.bucket === 4 ) {
            this.send_text(text)
        }
        return(resp.status)
    }

    list_users_with_bios() {
        let cmdstr = 'LBIO'
        let resp = await this.clientWrite(cmdstr)
        if ( resp.bucket === 4 ) {
            this.send_text(text)
        }
        return(resp.status)
    }

    enter_system_message(filename,text) {
        if ( !filename ) return -2;
        let cmdstr = `EMSG ${filename}`
        let resp = await this.clientWrite(cmdstr)
        if ( resp.bucket === 4 ) {
            this.send_text(text)
        }
        return(resp.status)
    }

    aide_set_email_addresses(who,emailaddrs) {
        if ( !who ) return -2;
        if ( !emailaddrs ) return -2;
        let cmdstr = `ASEA ${who}`
        let resp = await this.clientWrite(cmdstr)
        if ( resp.bucket === 4 ) {
            this.send_text(emailaddrs)
        }
        return(resp.status)
     }

    set_system_config(listing) {
        let cmdstr = `CONF SET`
        let resp = await this.clientWrite(cmdstr)
        if ( resp.bucket === 4 ) {
            this.send_text(listing)
        }
        return(resp.status)
    }

    // 
    send_text(text) {
        this.uploading = true
        this.client.write(`${text}\n000\n`,(err) => {
            this.uploading = false
            this.next_waiting_write()
        })
    }

    async binary_upload(filedata) {
        let dlen = filedata.length
        let offset = 0
        const writeBuf = Buffer.allocUnsafe(4096);
        this.lockWriter()
        let status = false
        try {
            while ( offset < dlen ) {
                let to_write = Math.min(4096,(dlen - offset))
                let cmdstr = `WRIT ${to_write}`
                let resp = await this.clientWrite(cmdstr,false,true)
                if ( resp.bucket === 7 ) {
                    to_write = parseInt(resp.response[2])
                    filedata.copy(writeBuf,0,offset,offset + to_write)
                    offset += to_write
                    await this.binary_write(writeBuf)
                }
            }
            status = true
        } catch (err) {
            //
        }
        this.end_upload(status)
        this.unlockWriter()
        //
        return status
    }

    binary_write(buffer) {
        return new Promise((resolve,reject) => {
            this.client.write(buffer,(err) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(true)
                }
            })
        })
    }

    end_upload(discard) {
        let cmdstr = `UCLS ${discard}`
        let resp = await this.clientWrite(cmdstr,false,true)
        return resp.status
    }
    //  //  //

    test_ready(buffer) {
        return(this.section_count >= buffer.length)
    }

    data_ready(count) {
        this.section_count = count
        let p = new Promise((resolve,reject) => {
            this.download_promise = (data) => { resolve(data.length == count) }
            this.failed_data = (data) => { reject(data.length != count) }
        })
        return(p)
    }

    // sprintf(cret, "%d|%ld|%s|%s", (int) bytes, last_mod, filename, mimetype);
    process_download(resp,is_binary) {
        this.downloading = true
        this.binary_data = is_binary
        let len = rep.response[0]
        let last_mod = resp.response[1]
        let mimetype = (resp.response[2].split('|'))[2]
        this.lockWriter()
        let offset = 0
        while ( offset < len ) {
            let amount = Math.min(4096,len - offset)
            let cmdstr = `READ ${offset}|${amount}`
            this.downloading = false
            let part_resp = await this.clientWrite(cmdstr,false,true)
            this.downloading = true
            if ( part_resp.bucket === 8 ) {   // ???
                await this.data_ready(amount)
            }
        }
        this.binary_data = !is_binary
        this.end_download()
        this.unlockWriter()
       //
    }

    //
    end_download() {
        let cmdstr = `CLOS`
        let resp = await this.clientWrite(cmdstr,false,true)
        this.downloading = false
        return resp.status
    }
    

    approximate_mime_type(path) {

    }

    read_file(path) {
        try {
            return(fs.readFileSync(path))
        } catch(e) {
            return(false)
        }
    }
}


/*

async function run() {
    let cit = new CitadelClient()

    await cit.connect()
    console.log("connected")
    let time_data = await cit.server_time()
    console.log(time_data.split('\n')[0])
    console.log()
    console.log("----")
    //await cit.room('_BASEROOM_')
    console.log(await cit.echo("testing echo"))
    console.log(await cit.server_time())

    await cit.user('admin')
    await cit.password('testit')
    console.log("----")
    let roomData = await cit.rooms(cit.PERSONAL_ROOM,-1)
    console.dir(roomData,{ depth: 2, color : true })
    //
    if ( 'Notes' in roomData ) {
        console.log("NOTES PRESENT")
    }
    if ( 'PageContact' in roomData ) {
        console.log("PageContact PRESENT")
    } else {
        cit.create_room('PageContact',cit.PERSONAL_ROOM,0)
    }

    console.log(await cit.list_floors())

    //
    console.log(await cit.goto_room('PageContact'))
    //
    let msgObject = {
        'recipient' : "admin",
        'anonymous' : false,
        'type' : false,
        'subject' : 'new web page contact',
        'author' : 'jay@bay.org',
        'references' : 'www.whoall.com',
        'text' : 'four score and seven years ago four score and seven years ago four score and seven years ago four score and seven years ago four score and seven years ago four score and seven years agofour score and seven years ago four score and seven years ago four score and seven years ago four score and seven years ago four score and seven years ago four score and seven years ago four score and seven years ago four score and seven years ago four score and seven years ago four score and seven years ago four score and seven years ago four score and seven years ago four score and seven years ago four score and seven years ago four score and seven years ago '
    }

    msgObject.text = msgObject.text + " " + msgObject.text

    console.log(await cit.post_message(msgObject))
   
    //
    await cit.logout()
    cit.quit()
    
}


//run()


*/
module.exports = CitadelClient
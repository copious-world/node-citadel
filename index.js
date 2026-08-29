'use strict'

const net = require('net')
const fs = require('fs')
const mime = require('mime/lite')
//


// https://github.com/mingodad/citadel
// the one that is up to date is on their own git server


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


var g_single_citadel = null

class CitadelClient {

    // ---- ---- ---- ---- ----
    constructor() {
        if ( g_single_citadel !== null ) {
            g_single_citadel.restart_agent = null
            g_single_citadel.client = null
            g_single_citadel = null
          }
        this.port = 504
        this.schedule = []
        this.client = null
        this.nowait = false
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
        g_single_citadel = this
    }

    /**
     * 
     * @param {number} port 
     */
    set_port(port) {
        this.port = port
    }

    //
    /**
     * 
     * @param {*} agent 
     */
    set_restart_agent(agent) {
        if ( agent && (typeof agent === 'object') ) {
            this.restart_agent = agent;
        }
    }

    // ---- ---- ---- ---- ----
    /**
     * 
     * @param {*} restart_agent 
     * @returns 
     */
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
        let client = net.createConnection({ port: this.port }, () => {
            console.log('connected to server!');
            this.client = client;
            this.last_writer = { 'resolver' : resolver, 'rejector' : rejector, 'writer' : null }
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
            let bucket = Math.floor(status/100)
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
                    if ( error_resolution && error_resolution.rejector ) error_resolution.rejector(new Error(line))
                }
            }
            this.next_waiting_write()
        });
        //
        client.on('end', () => {
            console.log('disconnected from server');
            this.client = null;
            if ( this.restart_agent ) {
                this.restart_agent.emit('restart')
            }
        });
        //
        return p
    }

    // ---- ---- ---- ---- ----
    /**
     * 
     */
    lockWriter() {
        this.uploading = true
        this.holdSchedule = this.schedule
        this.schedule = []
    }

    /**
     * 
     */
    unlockWriter() {
        this.uploading = false
        this.schedule = this.holdSchedule;
    }

    // ---- ---- ---- ---- ----
    /**
     * 
     */
    next_waiting_write() {
        if ( this.schedule.length ) {
            let next = this.schedule.shift()
            if ( next.writer ) next.writer()
            this.last_writer = next
        } else {
            this.last_writer = null
            /*
            if ( this.nowait ) {
                this.client.end()
            }
            */
        }
    }

    // ---- ---- ---- ---- ----
    /**
     * 
     * @param {*} str 
     * @param {*} useDelay 
     * @param {*} privileged 
     * @returns 
     */
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

    /**
     * 
     * @returns 
     */
    async quit() {
        let resp = await this.clientWrite("QUIT")
        if ( resp.response ) {
            return true
        } else {
            return false
        }
    }

    /**
     * 
     * @param {*} resp 
     * @returns 
     */
    handle_generic_response(resp) {
        if ( resp.response ) {
            let output = resp.response
            output = output.join(' ')
            return(output)
        } else {
            return false
        }
    }

    /**
     * 
     * @returns 
     */
    async server_time() {
        let resp = await this.clientWrite("TIME")
        return this.handle_generic_response(resp)
    }

    /**
     * 
     * @param {*} str 
     * @returns 
     */
    async echo(str) {
        let resp =  await this.clientWrite("ECHO " + str)
        return this.handle_generic_response(resp)
    }

    /**
     * 
     * @returns 
     */
    async noop() {
        let resp =  await this.clientWrite("NOOP")
        return this.handle_generic_response(resp)
    }

    /**
     * 
     * @param {*} rt 
     * @param {*} floor 
     * @returns 
     */
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
        let output = this.handle_generic_response(resp)
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

    /**
     * 
     * @param {*} uname 
     * @returns 
     */
    async user(uname) {
        let cmdstr = "USER " + uname
        let resp =  await this.clientWrite(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }

    /**
     * 
     * @param {*} pass 
     * @returns 
     */
    async password(pass) {
        let cmdstr = "PASS " + pass
        let resp =  await this.clientWrite(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }

    /**
     * 
     * @param {*} pop_pass 
     * @returns 
     */
    async tryApopPassword(pop_pass) {  // cret ... 
        if (!pop_pass) return -2;
        let cmdstr = "PAS2 " + pop_pass
        let resp =  await this.clientWrite(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)

    }


    /**
     * 
     * @returns 
     */
    async get_user_parameters() {
        let resp =  await this.clientWrite("GETU ")
        let output = this.handle_generic_response(resp)
        return(output)
    }
 

    /**
     * 
     * //   "SETU": "Set User parameters"
     * 
     * @returns 
     */
    async set_user_parameters(params) {
        let cmdstr = `SETU ${params}`
        let resp =  await this.clientWrite(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }
 

    /**
     * 
     * //   "LIST": "List users"
     * 
     * @returns 
     */
    async set_user_parameters(search_pattern) {
        let cmdstr = `LIST ${search_pattern}`
        let resp =  await this.clientWrite(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }
 
    
    /**
     * 
     * //   "SRCH": "Full text search"
     * 
     * @returns 
     */
    async full_text_search(search_pattern) {
        let cmdstr = `SRCH ${search_pattern}`
        let resp =  await this.clientWrite(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }


    /**
     * 
     * //   "MARK": "Mark messages in a sequence set as seen"
     * 
     * @returns 
     */
    async set_user_parameters(sequence_set) {
        let cmdstr = `MARK ${sequence_set}`
        let resp =  await this.clientWrite(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }



    /**
     * 
     * //  "GTSN": "Fetch seen/unread message flags"
     * 
     * @returns 
     */
    async fetch_unread_messages() {
        let cmdstr = `GTSN`
        let resp =  await this.clientWrite(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }
 

    /**
     * 
     * //  "VIEW": "Set preferred view for user/room combination"
     * 
     * @returns 
     */
    async set_preferred_room_view(view_type) {
        switch ( view_type ) {
            case "PUBLIC_ROOM" : {
                view_type = this.PUBLIC_ROOM
                break
            }
            case "HIDDEN_ROOM" : {
                view_type = this.HIDDEN_ROOM
                break
            }
            case "INVITATION_ROOM" : {
                view_type = this.INVITATION_ROOM
                break
            }
            case "PERSONAL_ROOM" : {
                view_type = this.PERSONAL_ROOMs
                break
            }
        }
        let cmdstr = `VIEW ${view_type}`
        let resp =  await this.clientWrite(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }
 

    /**
     * 
     * //   "ISME": "Determine whether an email address belongs to a user"
     * 
     * @returns 
     */
    async check_email_is_mine(address) {
        let cmdstr = `ISME ${address}`
        let resp =  await this.clientWrite(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }



    /**
     * "BIFF": "Count new messages that have arrived in the inbox"
     * @returns 
     */
    async count_new_messages() {
        let resp =  await this.clientWrite("BIFF")
        let output = this.handle_generic_response(resp)
        return(output)
    }



    /**
     * 
     * @returns 
     */
    async logout() {
        let resp =  await this.clientWrite("LOUT")
        let output = this.handle_generic_response(resp)
        return(output)
    }

    /**
     * 
     * @param {*} roomname 
     * @param {*} floor 
     * @param {*} password 
     * @returns 
     */
    async createPasswordRoom(roomname,floor,password) {
        let cmd = `CRE8 1|${roomname}|3|${password}|${floor}`
        let resp =  await this.clientWrite(cmd)
        let output = this.handle_generic_response(resp)
        return(output)

    }

    /**
     * 
     * @returns 
     */
    async list_floors() {
        let resp =  await this.clientWrite("LFLR")
        let output = this.handle_generic_response(resp)
        return(output)
    }

    /**
     * 
     * @param {*} room 
     * @returns 
     */
    async goto_room(room) {
        let cmdstr = "GOTO " + room
        let resp =  await this.clientWrite(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }
    
    /**
     * 
     * @param {*} room 
     * @param {*} password 
     * @returns 
     */
    async goto_password_room(room,password) {
        let cmdstr = `GOTO ${room}|${password}`
        let resp =  await this.clientWrite(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }

    /**
     * 
     * @param {*} msgObject 
     * @returns 
     */
    async post_message(msgObject) {
        let msg = `ENT0 ${1}|${msgObject.recipient}|${msgObject.anonymous}|${msgObject.type}|${msgObject.subject}|${msgObject.author}||||||${msgObject.references}|`
        //
        let resp =  await this.clientWrite(msg)
        let output = this.handle_generic_response(resp)

        let text = msgObject.text;
        text = text.trim()
        text = shortLines(text)
        console.log(text)
        text += '\n000'
        output = await this.clientWrite(text,true)  // clientWrite nowait
        return(output)
    }

    /**
     * 
     * @param {*} pass 
     * @returns 
     */
    async set_password(pass) {
        let cmdstr = "SETP " + pass
        let resp =  await this.clientWrite(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }

    /**
     * 
     * @param {*} username 
     * @param {*} pass 
     * @returns 
     */
    async create_user(username,pass) {
        try {
            let cmdstr = "NEWU " + username
            let resp =  await this.clientWrite(cmdstr)
            await this.set_password(pass)
            return(resp.response)
        } catch ( e ) {
            console.log("create user: " + e.message)
            return(false)
        }
    }

    /**
     * 
     * @param {*} username 
     * @returns 
     */
    async admin_create_user(username) {
        try {
            let cmdstr = "CREU " + username
            let resp = await this.clientWrite(cmdstr)
            let output = this.handle_generic_response(resp)
            return(output)
        } catch ( e ) {
            console.log("admin create user: " + e.message)
            return(false)
        }
    }
    
    /**
     * 
     * @param {*} oldname 
     * @param {*} newname 
     * @returns 
     */
    async rename_user(oldname,newname) {
        if (!oldname) return -2;
        if (!newname) return -2;
        let cmdstr = `RENU ${oldname}|${newname}`
        let resp = await this.clientWrite(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }

    // 
    /**
     * 
     * @param {*} which 
     * @param {*} whicharg 
     * @param {*} mtemplate 
     * @returns 
     */
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
            output = this.handle_generic_response(resp)
        }
        return(output)
    }


    /**
     * // MSG0 :: ctdlproto/serv_messages.c: "Output a message in plain text format"
     * @returns 
     */
    async get_message_plain_text(msgnum,headers_only) {
        if ( headers_only === undefined ) headers_only = 0
        let cmdstr = "MSG0 ${msgnum} ${headers_only}"
        let resp =  await this.clientWrite(cmdstr)
        return this.handle_generic_response(resp)
    }


    /**
     * 
     * // MSG2 :: ctdlproto/serv_messages.c: "Output a message in RFC822 format"
     * 
     * @returns 
     */
    async get_message_RFC822(msgnum,headers_only) {
        if ( headers_only === undefined ) headers_only = 0
        let cmdstr = "MSG2 ${msgnum} ${headers_only}"
        let resp =  await this.clientWrite(cmdstr)
        return this.handle_generic_response(resp)
    }


    /**
     * 
     * // MSG4 :: ctdlproto/serv_messages.c: "Output a message in the client's preferred format"
     * 
     *
     * @returns 
     */
    async get_message_MIME_content_types(msgnum,section_token) {
        if ( headers_only === undefined ) headers_only = 0
        let cmdstr = "MSG4 ${msgnum} ${section_token}"
        let resp =  await this.clientWrite(cmdstr)
        return this.handle_generic_response(resp)
    }


    /**
     * 
     * // MSGP :: ctdlproto/serv_messages.c: "Select preferred format for MSG4 output"
     * 
     * @param {string} format_prefs -- a list of preferred formats or "dont_decode"
     * @returns 
     */
    async get_message_preferred_format(format_prefs ="dont_decode") {
        let cmdstr = "MSGP ${format_prefs}"
        let resp =  await this.clientWrite(cmdstr)
        return this.handle_generic_response(resp)
    }


    /**
     * 
     * // OPNA :: ctdlproto/serv_messages.c: "Open an attachment for download"
     * 
     *
     * @returns 
     */
    async get_message_attachment(msgnum,section_token) {
        let cmdstr = "OPNA ${msgnum} ${section_token}"
        let resp =  await this.clientWrite(cmdstr)
        return this.handle_generic_response(resp)
    }



    /**
     * 
     * DLAT :: ctdlproto/serv_messages.c: "Download an attachment"
     * 
     * @returns 
     */
    async download_message_attachment(msgnum,section_token) {
        let cmdstr = "DLAT ${msgnum} ${section_token}"
        let resp =  await this.clientWrite(cmdstr)
        return this.handle_generic_response(resp)
    }


    /**
     * 
     * @returns 
     */
    async who_knows_room() {
        let resp =  await this.clientWrite("WHOK")
        return this.handle_generic_response(resp)
    }

    
    /**
     * 
     * @returns 
     */
    async server_info() {
        let resp =  await this.clientWrite("INFO")
        return this.handle_generic_response(resp)
    }
    

    /**
     * 
     */
    async read_directory() {
        let resp =  await this.clientWrite("RDIR")
        return this.handle_generic_response(resp)
    }
    
    /**
     * 
     * @returns 
     */
    async read_directory() {
        let resp =  await this.clientWrite("RDIR")
        return this.handle_generic_response(resp)
    }

    /**
     * 
     * @param {*} msgnum 
     * @returns 
     */
    async set_last_read(msgnum) {
        let cmdstr = "SLRP HIGHEST"
        if (msgnum) {
            cmdstr = `SLRP ${msgnum}`
        }
        let resp = await this.clientWrite(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }

    /**
     * 
     * @param {*} username 
     * @returns 
     */
    async invite_user_to_room(username) {
        let cmdstr = "INVT " + username
        let resp = await this.clientWrite(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }

    /**
     * 
     */
    async kickout_user_from_room(username) {
        let cmdstr = "KICK " + username
        let resp = await this.clientWrite(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }

    //
    /**
     * 
     * @returns 
     */
    async get_room_attributes() {
        let resp =  await this.clientWrite("GETR")
        if ( resp.bucket === 2 ) {
            let output =  this.handle_generic_response(resp)
            let fields = output.split('|')
            return new RoomDescriptor(fields)
        }
        return resp.status
    }

    /**
     * 
     * @param {*} roomDescr 
     * @param {*} forget 
     * @returns 
     */
    async set_room_attributes(roomDescr,forget) {
        let cmdstr = `SETR ${roomDescr.QRname}|${roomDescr.QRpasswd}|${roomDescr.QRdirname}|`
            cmdstr += `${roomDescr.QRflags}|${forget}|${roomDescr.QRfloor}|${roomDescr.QRorder}|`
            cmdstr += `${roomDescr.QRdefaultview}|${roomDescr.QRflags2}`
        let resp = await this.clientWrite(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }




    /**
     * //   "SETA" :: ctdlproto/serv_rooms.c: "Set the room admin for this room"
     * 
     * @returns 
     */
    async set_room_admin(administator) {
        let cmdstr = `SETA ${administator}`
        let resp = await this.clientWrite(cmdstr)
        return this.handle_generic_response(resp)
    }


    /**
     * 
     * @returns 
     */
    async get_room_aide() {
        let cmdstr = "GETA"
        let resp = await this.clientWrite(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }


    /**
     * 
     * @returns 
     */
    async room_info() {
        let cmdstr = "RINF"
        let resp = await this.clientWrite(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }

    /**
     * 
     * @param {*} msgnum 
     * @returns 
     */
    async delete_message(msgnum) {
        let cmdstr = `DELE ${msgnum}`
        let resp = await this.clientWrite(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }

    /**
     * 
     * @param {*} msgnum 
     * @param {*} destroom 
     * @param {*} copy 
     * @returns 
     */
    async  move_message(msgnum,destroom,copy) {
        let cmdstr = `MOVE ${msgnum}|${destroom}|${copy ? '1' : '0'}`
        let resp = await this.clientWrite(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }


    /**
     * 
     * @param {*} for_real 
     * @param {*} roomname 
     * @param {*} type 
     * @param {*} password 
     * @param {*} floor 
     * @returns 
     */
    async create_room(for_real,roomname,type,password,floor) {
        if ( !roomname ) return(-2)
        let cmdstr = ''
        if ( floor === undefined ) {
            floor = 0
        }
        if ( password ) {
            cmdstr = `CRE8 ${for_real ? 1 : 0}|${roomname}|${type}|${password}|${floor}`
        } else {
            cmdstr = `CRE8 ${for_real ? 1 : 0}|${roomname}|${type}||${floor}`
        }
        try {
            let resp = await this.clientWrite(cmdstr)
            let output = this.handle_generic_response(resp)
            return(output)    
        } catch (e) {
            console.warn(e.message)
        }
        return(false)
    }

    /**
     * 
     * @returns 
     */
    async forget_room() {
        let cmdstr = "FORG"
        let resp = await this.clientWrite(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }

    /**
     * 
     * @param {*} message 
     * @returns 
     */
    async system_message(message) {
        let cmdstr = "MESG " + message
        let resp = await this.clientWrite(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)

    }

    /**
     * 
     * @returns 
     */
    async unvalidated_user() {
        let cmdstr = "GNUR"
        let resp = await this.clientWrite(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }

    /**
     * 
     * @param {*} username 
     * @returns 
     */
    async user_registration(username) {
        let cmdstr = "GREG"
        if (username) {
            cmdstr = "GREG " + username
        }
        let resp = await this.clientWrite(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }

    /**
     * 
     * @param {*} username 
     * @param {*} axlevel 
     * @returns 
     */
    async validate_user(username,axlevel) {
        if ( !username ) return(-2)
        if ( !axlevel ) return(-2)
        //
        let cmdstr = `VALI ${username}|${axlevel}`
        let resp = await this.clientWrite(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }

    /**
     * 
     * @param {*} for_real 
     * @returns 
     */
    async set_room_info(for_real) {
        let cmdstr = `EINF ${for_real ? '1' : '2'}`
        let resp = await this.clientWrite(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }

    /**
     * 
     * @returns 
     */
    async set_registration() {
        let cmdstr = 'REGI'
        let resp = await this.clientWrite(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }



    /**
     * //   "RBDI": "ReBuild Directory Index",
     * @returns 
     */
    async rebuild_dir_index() {
        let cmdstr = 'RBDI'
        let resp = await this.clientWrite(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }



    /**
     * //   "GVSN": "Get Valid Screen Names
     * @returns 
     */
    async get_valid_screen_names() {
        let cmdstr = 'GVSN'
        let resp = await this.clientWrite(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }



    /**
     * //   "GVEA": "Get Valid Email Addresses"
     * @returns 
     */
    async get_valid_email_addresses() {
        let cmdstr = 'GVEA'
        let resp = await this.clientWrite(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }





    /**
     * //   "DVCA": "Dump VCard Addresses"
     * @returns 
     */
    async get_valid_email_addresses() {
        let cmdstr = 'DVCA'
        let resp = await this.clientWrite(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }




    /**
     * 
     * @returns 
     */
    async misc_check() {
        let cmdstr = 'CHEK'
        let resp = await this.clientWrite(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }

    /**
     * 
     * @param {*} filename 
     * @returns 
     */
    async delete_file(filename) {
        let cmdstr = `DELF ${filename}`
        let resp = await this.clientWrite(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }

    /**
     * 
     * @param {*} filename 
     * @param {*} destroom 
     * @returns 
     */
    async move_file(filename,destroom) {
        if (!filename) return -2;
        if (!destroom) return -2;
        let cmdstr = `MOVF ${filename}|${destroom}`
        let resp = await this.clientWrite(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }

    /**
     * 
     * @returns 
     */
    async on_line_users() {
        let cmdstr = 'RWHO'
        let resp = await this.clientWrite(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }

    // ---- ---- ---- ---- 
    /**
     * 
     * @param {*} username 
     * @returns 
     */
    async query_username(username) {
        let cmdstr = 'QUSR ' + username
        let resp = await this.clientWrite(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }

    /**
     * 
     * @returns 
     */
    async floor_listing() {
         let cmdstr = 'LFLR'
         let resp = await this.clientWrite(cmdstr)
         let output = this.handle_generic_response(resp)
         return(output)
    }

    /**
     * 
     * @param {*} name 
     * @param {*} for_real 
     * @returns 
     */
    async create_floor(name,for_real) {
        if ( !name ) return -2;
        let cmdstr = `CFLR ${name}|${for_real}`
        let resp = await this.clientWrite(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }
    
    /**
     * 
     * @param {*} floornum 
     * @param {*} for_real 
     * @returns 
     */
    async delete_floor(floornum,for_real) {
        if (floornum < 0) return -1;
        let cmdstr = `KFLR ${name}|${for_real}`
        let resp = await this.clientWrite(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }

    /**
     * 
     * @param {*} floornum 
     * @param {*} floorname 
     * @returns 
     */
    async edit_floor(floornum,floorname) {
        if ( !floorname ) return -2;
        if ( floornum < 0 ) return -1;
        let cmdstr = `EFLR ${floornum}|${floorname}`
        let resp = await this.clientWrite(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }

    /**
     * 
     * @param {*} developerid 
     * @param {*} clientid 
     * @param {*} revision 
     * @param {*} software_name 
     * @param {*} hostname 
     * @returns 
     */
    async identify_software(developerid,clientid,revision,software_name,hostname) {
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
        let output = this.handle_generic_response(resp)
        return(output)
    }


    // ---- ---- ---- ---- 
    /**
     * 
     * @returns 
     */
    async get_instant_message() {
        let cmdstr = 'GEXP'
        let resp = await this.clientWrite(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }

    /**
     * 
     * @returns 
     */
    async instant_message_receipt() {
        let cmdstr = `DEXP ${mode}`
        let resp = await this.clientWrite(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }

    /**
     * 
     * @param {*} username 
     * @returns 
     */
    async get_bio(username) {
        if ( !bio ) return -2;
        let cmdstr = `RBIO ${username}`
        let resp = await this.clientWrite(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }


    /**
     * 
     * @param {*} mode 
     * @returns 
     */
    async stealth_mode(mode) {
        let cmdstr = `STEL ${mode}`
        let resp = await this.clientWrite(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }

    /**
     * 
     */
    async terminate_session(sid) {
        let cmdstr = `TERM ${sid}`
        let resp = await this.clientWrite(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }


    /**
     * 
     * @returns 
     */
    async terminate_server_now() {
        let cmdstr = 'DOWN'
        let resp = await this.clientWrite(cmdstr)
        this.send_text(bio)
        return(resp.status)
    }


    /**
     * 
     * //   "HALT": "halt the server without exiting the server process"
     * 
     * @returns 
     */
    async halt_server_now() {
        let cmdstr = 'HALT'
        let resp = await this.clientWrite(cmdstr)
        this.send_text(bio)
        return(resp.status)
    }
    



    /**
     * 
     * @param {*} mode 
     * @returns 
     */
    async terminate_server_scheduled(mode) {
        let cmdstr = `SCDN ${mode ? 1 : 0}`
        let resp = await this.clientWrite(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }

    // 
    /**
     * 
     * @param {*} who 
     * @returns 
     */
    async aide_get_user_parameters(who) {
        let cmdstr = `AGUP ${who}`
        let resp = await this.clientWrite(cmdstr)
        if ( resp.bucket === 2 ) {
            let output =  this.handle_generic_response(resp)
            let fields = output.split('|')
            return new CitadelUser(fields)
        }
        return(resp.status)
    }

    /**
     * 
     * @param {*} cit_user 
     * @returns 
     */
    async aide_set_user_parameters(cit_user) {
        //
        if ( !(cit_user instanceof CitadelUser) ) return -2;
        let cmdstr = `ASUP ${cit_user.fullname}|${cit_user.password}|${cit_user.flags}|`
            cmdstr += `${cit_user.timescalled}|${cit_user.posted}|${cit_user.axlevel}|${cit_user.usernum}|`
            cmdstr += `${cit_user.lastcall}|${cit_user.lastcall}`        
        let resp = await this.clientWrite(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }

    /**
     * 
     * @param {*} who 
     * @returns 
     */
    async aide_get_email_addresses(who) {
        let cmdstr = `AGEA ${who}`
        let resp = await this.clientWrite(cmdstr)
        if ( resp.bucket === 1 ) {
            let output =  this.handle_generic_response(resp)
            return(output)
        }
        return(resp.status)
    }
    

    /**
     * 
     * @param {*} which 
     * @returns 
     */
    async get_message_expiration_policy(which) {
        if ( (which < 0) || (which > 3) ) return -2;
        let policy = this.expiration_policies[which]
        let cmdstr = `GPEX ${policy}`
        let resp = await this.clientWrite(cmdstr)
        if ( resp.bucket == 2 ) {
            return new ExpirationPolicy(resp.response[0],resp.response[1])
        }
        return(resp.status)
    }

    /**
     * 
     * @param {*} which 
     * @param {*} policy 
     * @returns 
     */
    async set_message_expiration_policy(which,policy) {
        if ( (which < 0) || (which > 3) ) return -2;
        let scope = this.policy_scope[which]
        let cmdstr = `SPEX ${scope}|${policy.expire_mode}|${policy.expire_mode}`
        let resp = await this.clientWrite(cmdstr)
        let output =  this.handle_generic_response(resp)
        return(output)
    }




    /**
     * 
     * //   "TDAP": "Manually initiate auto-purger"
     * 
     * @returns 
     */
    async initiate_auto_purger() {
        let cmdstr = 'TDAP'
        let resp = await this.clientWrite(cmdstr)
        this.send_text(bio)
        return(resp.status)
    }
    


    /**
     * 
     * @returns 
     */
    async get_system_config() {
        let cmdstr = `CONF GET`
        let resp = await this.clientWrite(cmdstr)
        let output =  this.handle_generic_response(resp)
        return(output)
    }
    
    
    /**
     * 
     * @param {*} mimetype 
     * @param {*} listing 
     * @returns 
     */
    async get_system_config_by_type(mimetype,listing) {
        if ( !mimetype ) return -2;
        let cmdstr = `CONF GETSYS|${mimetype}`
        let resp = await this.clientWrite(cmdstr)
        let output =  this.handle_generic_response(resp)
        return(output)
    }

    // 
    /**
     * 
     * @param {*} mimetype 
     * @returns 
     */
    async set_system_config_by_type(mimetype) {
        let cmdstr = `CONF PUTSYS|${mimetype}`
        let resp = await this.clientWrite(cmdstr)
        let output =  this.handle_generic_response(resp)
        return(output)
    }

    /**
     * 
     * @param {*} session 
     * @returns 
     */
    async set_room_network_config(session) {
        if ( session < 0 ) return -2;
        let cmdstr = `SNET`
        let resp = await this.clientWrite(cmdstr)
        this.send_text(listing)
        return(resp.status)
    }

    /**
     * 
     * @param {*} session 
     * @returns 
     */
    async request_client_logout(session) { //
        if ( session < 0 ) return -2;
        let cmdstr = `REQT ${session}`
        let resp = await this.clientWrite(cmdstr)
        let output =  this.handle_generic_response(resp)
        return(output)
    }

    /**
     * 
     * @param {*} msgnum 
     * @param {*} seen 
     * @returns 
     */
    async set_message_seen(msgnum,seen) {
        if ( msgnum < 0 ) return -2;
        let cmdstr = `SEEN ${msgnum}|${seen}`
        let resp = await this.clientWrite(cmdstr)
        let output =  this.handle_generic_response(resp)
        return(output)
    }

    /**
     * 
     * @param {*} address 
     * @returns 
     */
    async directory_lookup(address) {
        if ( !address ) return -2;
        let cmdstr = `QDIR ${address}`
        let resp = await this.clientWrite(cmdstr)
        let output =  this.handle_generic_response(resp)
        return(output)
    }

    /**
     * 
     * @param {*} secret 
     * @returns 
     */
    async internal_program(secret) {
        let cmdstr = `IPGM ${secret}`
        let resp = await this.clientWrite(cmdstr)
        let output =  this.handle_generic_response(resp)
        return(output)
    }

    // download/upload ...

    /**
     * 
     * @param {*} filename 
     * @returns 
     */
    async file_download(filename) {
        if ( !filename ) return(-2)
        let cmdstr = `OPEN ${filename}`
        let resp = await this.clientWrite(cmdstr)
        if ( resp.bucket == 2 ) {
            this.process_download(resp)
        }
    }

    // 
    /**
     * 
     * @param {*} msgnum 
     * @param {*} part 
     * @returns 
     */
    async attachment_download(msgnum,part) {
        if ( !msgnum ) return(-2)
        if ( !part ) return(-2)
        let cmdstr = `OPNA ${msgnum}|${part}`
        let resp = await this.clientWrite(cmdstr)
        if ( resp.bucket == 2 ) {
            this.process_download(resp,true)
        }
        return(resp.status)
    }

    /**
     * 
     * @param {*} filename 
     * @returns 
     */
    async image_download(filename) {
        if ( !filename ) return(-2)
        let cmdstr = `OIMG ${msgnum}`
        let resp = await this.clientWrite(cmdstr)
        if ( resp.bucket == 2 ) {
            this.process_download(resp,true)
        }
        return(resp.status)
    }

    /**
     * 
     * @param {*} save_as 
     * @param {*} comment 
     * @param {*} path 
     * @returns 
     */
    async file_upload(save_as,comment,path) {
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

    /**
     * 
     * @param {*} for_real 
     * @param {*} save_as 
     * @param {*} path 
     * @returns 
     */
    async image_upload(for_real,save_as,path) {
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



    /**
     * 
     * @returns 
     */
    async downLoad_room_image() {
        let cmdstr = 'DLRI'
        let resp = await this.clientWrite(cmdstr)
        if ( resp.bucket == 2 ) {
            this.process_download(resp,true)
        }
        return(resp.status)
    }


    /**
     * 
     * @param {*} image_size 
     * @param {*} save_as 
     * @param {*} path 
     * @returns 
     */
    async room_image_upload(image_size,save_as,path) {
        if (!save_as) return -1;
        if (!comment) return -1;
        if (!path) return -1;
        let mimetype = this.approximate_mime_type(path)
        let filedata = this.read_file(path)  // a buffer
        this.lockWriter()
        let cmdstr = `ULRI ${image_size}|${mimetype}|${save_as}`
        let resp = await this.clientWrite(cmdstr)
        //
        if ( resp.bucket == 2 ) {
            let success = await this.binary_upload(filedata)
            this.end_upload(success)
        }
        this.unlockWriter()
    }


    /**
     * 
     * @returns 
     */
    async downLoad_user_image(user_name) {
        let cmdstr = `DLUI ${user_name}`
        let resp = await this.clientWrite(cmdstr)
        if ( resp.bucket == 2 ) {
            this.process_download(resp,true)
        }
        return(resp.status)
    }



    /**
     * 
     * @param {*} image_size 
     * @param {*} user_name 
     * @param {*} path 
     * @returns 
     */
    async user_image_upload(image_size,save_as,path) {
        if (!save_as) return -1;
        if (!comment) return -1;
        if (!path) return -1;
        let mimetype = this.approximate_mime_type(path)
        let filedata = this.read_file(path)  // a buffer
        this.lockWriter()
        let cmdstr = `ULUI ${image_size}|${mimetype}|${user_name}`
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

    /**
     * 
     * @param {*} username 
     * @param {*} text 
     * @returns 
     */
    async send_instant_message(username,text) {
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

    /**
     * 
     * @param {*} bio 
     * @returns 
     */
    async set_bio(bio) {
        if ( !bio ) return -2;
        let cmdstr = 'EBIO'
        let resp = await this.clientWrite(cmdstr)
        if ( resp.bucket === 4 ) {
            this.send_text(bio)
        }
        return(resp.status)
    }

    /**
     * 
     * @returns 
     */
    async list_users_with_bios() {
        let cmdstr = 'LBIO'
        let resp = await this.clientWrite(cmdstr)
        if ( resp.bucket === 4 ) {
            this.send_text(text)
        }
        return(resp.status)
    }

    /**
     * 
     * @param {*} filename 
     * @param {*} text 
     * @returns 
     */
    async enter_system_message(filename,text) {
        if ( !filename ) return -2;
        let cmdstr = `EMSG ${filename}`
        let resp = await this.clientWrite(cmdstr)
        if ( resp.bucket === 4 ) {
            this.send_text(text)
        }
        return(resp.status)
    }

    /**
     * 
     * @param {*} who 
     * @param {*} emailaddrs 
     * @returns 
     */
    async aide_set_email_addresses(who,emailaddrs) {
        if ( !who ) return -2;
        if ( !emailaddrs ) return -2;
        let cmdstr = `ASEA ${who}`
        let resp = await this.clientWrite(cmdstr)
        if ( resp.bucket === 4 ) {
            this.send_text(emailaddrs)
        }
        return(resp.status)
    }

    /**
     * 
     * @param {*} listing 
     * @returns 
     */
    async set_system_config(listing) {
        let cmdstr = `CONF SET`
        let resp = await this.clientWrite(cmdstr)
        if ( resp.bucket === 4 ) {
            this.send_text(listing)
        }
        return(resp.status)
    }

    // 
    /**
     * 
     * @param {*} text 
     */
    async send_text(text) {
        this.uploading = true
        this.client.write(`${text}\n000\n`,(err) => {
            this.uploading = false
            this.next_waiting_write()
        })
    }

    /**
     * 
     * @param {*} filedata 
     * @returns 
     */
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

    /**
     * 
     * @param {*} buffer 
     * @returns 
     */
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


    /**
     * 
     * @param {*} discard 
     * @returns 
     */
    async end_upload(discard) {
        let cmdstr = `UCLS ${discard}`
        let resp = await this.clientWrite(cmdstr,false,true)
        return resp.status
    }
    //  //  //

    /**
     * 
     * @param {*} buffer 
     * @returns 
     */
    test_ready(buffer) {
        return(this.section_count >= buffer.length)
    }

    /**
     * 
     * @param {*} count 
     * @returns 
     */
    data_ready(count) {
        this.section_count = count
        let p = new Promise((resolve,reject) => {
            this.download_promise = (data) => { resolve(data.length == count) }
            this.failed_data = (data) => { reject(data.length != count) }
        })
        return(p)
    }

    // sprintf(cret, "%d|%ld|%s|%s", (int) bytes, last_mod, filename, mimetype);
    /**
     * 
     * @param {*} resp 
     * @param {*} is_binary 
     */
    async process_download(resp,is_binary) {
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
    /**
     * 
     */
    async end_download() {
        let cmdstr = `CLOS`
        let resp = await this.clientWrite(cmdstr,false,true)
        this.downloading = false
        return resp.status
    }
    

    /**
     * 
     * @param {*} path 
     * @returns 
     */
    approximate_mime_type(path) {
        let mtype = mime.getType(path)  // getExtension
        return(mtype)
    }

    /**
     * 
     * @param {*} path 
     * @returns 
     */
    read_file(path) {
        try {
            return(fs.readFileSync(path))
        } catch(e) {
            return(false)
        }
    }




    /**
     * 
     * @returns 
     */
    async generate_JWT() {
        let cmdstr = 'GJWT'
        let resp = await this.clientWrite(cmdstr)
        if ( resp.response ) {
            return true
        } else {
            return false
        }
    }


    /**
     * 
     * @param {*} jwt 
     * @returns 
     */
    async authenticate_JWT(jwt) {
        let cmdstr = `AJWT ${jwt}`
        let resp = await this.clientWrite(cmdstr)
        if ( resp.response ) {
            return true
        } else {
            return false
        }
    }

    /**
     * 
     * @param {*} probe 
     * @returns 
     */
    async autocomplete(probe) {
        let cmdstr = `AUTO ${probe}`
        let resp = await this.clientWrite(cmdstr)
        return this.handle_generic_response(resp)
    }


    // "ICAL": "Citadel iCalendar command",
    /**
     * commands:
     * test
     * freebusy
     * sgi - server_generated_invitations
     * respond
     * handle_rsvp
     * conflicts
     * getics
     * putics
     * 
     * 
     * @param {*} probe 
     * @returns 
     */
    async ical_cmd(cmd_str) {
        let cmdstr = `ICAL ${cmd_str}`
        let resp = await this.clientWrite(cmdstr)
        return this.handle_generic_response(resp)
    }


    /**
     * 
     * //   "LSUB": "List subscribe/unsubscribe"
     * 
     * @param {*} cmd_str 
     * @param {*} roomname 
     * @param {*} emailaddr 
     * @param {*} url 
     * @param {*} supplied_token 
     * @returns 
     */
    async list_serv_subscription(cmd_str,roomname,emailaddr,url,supplied_token) {
        let cmdstr = `LSUB ${cmd_str}|${roomname}|${emailaddr}|${url}|${supplied_token}`
        let resp = await this.clientWrite(cmdstr)
        return this.handle_generic_response(resp)
    }



    //   "RCHT": "Participate in real time chat in a root",

    async real_time_chat(cmd_str,cmd_pars) {
        let cmdstr = `RCHT ${cmd_str}|${cmd_pars}`
        let resp = await this.clientWrite(cmdstr)
        return this.handle_generic_response(resp)
    }




    // "STLS": "Start TLS session",
    /**
     * 
     * @returns 
     */
    async start_TLS_session() {
        let cmdstr = 'STLS'
        let resp = await this.clientWrite(cmdstr)
        return this.handle_generic_response(resp)
    }


    // "GTLS": "Get TLS session status",
    /**
     * 
     * @returns 
     */
    async get_TLS_session() {
        let cmdstr = 'GTLS'
        let resp = await this.clientWrite(cmdstr)
        return this.handle_generic_response(resp)
    }


    /**
     * //   "STAT": "Get mtime of the current root"
     * 
     * @returns 
     */
    async get_root_mtime() {
        let cmdstr = 'STAT'
        let resp = await this.clientWrite(cmdstr)
        return this.handle_generic_response(resp)
    }



    /**
     * //   "KILL": "Kill (delete) the current root"
     * 
     * @returns 
     */
    async delete_current_root() {
        let cmdstr = 'KILL'
        let resp = await this.clientWrite(cmdstr)
        return this.handle_generic_response(resp)
    }

    // /**
    //  * //   "QNOP": "no operation with no respons"s
    //  * 
    //  * @returns 
    //  */
    // async q_noop() {
    //     let cmdstr = 'QNOP'
    //     let resp = await this.clientWrite(cmdstr)
    //     return this.handle_generic_response(resp)
    // }


    /**
     * //   "ASYN": "enable asynchronous server responses"
     * 
     * @returns 
     */
    async enable_asynchronous_server_responses(state) {
        if ( !state ) state = 0
        else state = 1
        let cmdstr = `ASYN ${state}`
        let resp = await this.clientWrite(cmdstr)
        return this.handle_generic_response(resp)
    }


    /**
     * //   "GIBR": "Get InBox Rules"
     * 
     * @returns 
     */
    async get_inbox_rules() {
        let cmdstr = 'GIBR'
        let resp = await this.clientWrite(cmdstr)
        return this.handle_generic_response(resp)
    }


    /**
     * //   "PIBR": "Put InBox Rules"
     * 
     * @returns 
     */
    async put_inbox_rules(new_rules) {
        let cmdstr = 'GIBR'
        let resp = await this.clientWrite(cmdstr)
        if ( resp.status ) {
            await this.send_text(new_rules)
        }
    }


    /**
     * //   "WIKI": "Commands related to Wiki management"
     * @param {*} cmd_str 
     * @param {*} pagename 
     * @param {*} rev 
     * @param {*} operation 
     * @returns 
     */
    async manage_wiki(cmd_str,pagename,rev,operation) {
        let cmdstr = ""
        if ( cmd_str === "history" ) {
             cmdstr = `WIKI ${cmd_str}|${pagename}`
        } else {
            cmdstr = `WIKI ${cmd_str}|${pagename}|${rev}|${operation}`
        }
        let resp = await this.clientWrite(cmdstr)
        return this.handle_generic_response(resp)
    }


}


module.exports = CitadelClient
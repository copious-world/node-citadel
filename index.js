'use strict'

const net = require('net')
const fs = require('fs')
const mime = require('mime/lite')
//

let all_citadel_commands = [
    "NOOP",
    "QNOP",
    "ECHO",
    "TIME",
    "MESG",
    "USER",
    "PASS",
    "LOUT",
    "GJWT",
    "AJWT",
    "IDEN",
    "QUIT",
    "BIFF",
    "RWHO",
    "QDIR",
    "RBDI",
    "AUTO",
    "ISME",
    "INFO",
    "TERM",
    "REQT",
    "STLS",
    "GTLS",
    "ICAL",
    "SEXP",
    "GEXP",
    "DEXP",
    "GOTO",
    "STAT",
    "MSGS",
    "MARK",
    "SLRP",
    "GTSN",
    "VIEW",
    "SRCH",
    "EUID",
    "DELE",
    "MOVE",
    "EMSG",
    //
    "ENT0",
    "GVSN",
    "GVEA",
    "DVCA",
    "MSG0",
    "MSG2",
    "MSG4",
    "MSGP",
    "OPNA",
    "DLAT",
    "WIKI",
    "LFLR",
    "CFLR",
    "KFLR",
    "EFLR",
    "LKRN",
    "LKRO",
    "LZRM",
    "LKRA",
    "LRMS",
    "LPRM",
    "RDIR",
    "GETR",
    "SETR",
    "RINF",
    "GETA",
    "SETA",
    "KILL",
    "CRE8",
    "FORG",
    "EINF",
    "INVT",
    "WHOK",
    "KICK",
    "DELF",
    "MOVF",
    "OPEN",
    "CLOS",
    "READ",
    "UOPN",
    "UCLS",
    "WRIT",
    "UIMG",
    "OIMG",
    "DLRI",
    "ULRI",
    "CONF",
    "GPEX",
    "SPEX",
    "TDAP",
    "SMTP",
    "DOWN",
    "SCDN",
    "HALT",
    "NEWU",
    "CREU",
    "VALI",
    "QUSR",
    "LIST",
    "SETP",
    "GETU",
    "EBIO",
    "RBIO",
    "DLUI",
    "ULUI",
    "AGUP",
    "ASUP",
    "AGEA",
    "ASEA",
    "RENU",
    "GNUR",
    "GREG",
    "REGI",
    "CHEK",
    "STEL",
    "RCHT"
]


let opcounts = {
  "NOOP" : 1,
  "QNOP" : 2,
  "ECHO" : 3,
  "TIME" : 4,
  "MESG" : 5,
  "USER" : 6,
  "PASS" : 7,
  "LOUT" : 8,
  "GJWT" : 9,
  "AJWT" : 10,
  "IDEN" : 11,
  "QUIT" : 12,
  "BIFF" : 13,
  "RWHO" : 14,
  "QDIR" : 15,
  "RBDI" : 16,
  "AUTO" : 17,
  "ISME" : 18,
  "INFO" : 19,
  "TERM" : 20,
  "REQT" : 21,
  "STLS" : 22,
  "GTLS" : 23,
  "ICAL" : 24,
  "SEXP" : 25,
  "GEXP" : 26,
  "DEXP" : 27,
  "GOTO" : 28,
  "STAT" : 29,
  "MSGS" : 30,
  "MARK" : 31,
  "SLRP" : 32,
  "GTSN" : 33,
  "VIEW" : 34,
  "SRCH" : 35,
  "EUID" : 36,
  "DELE" : 37,
  "MOVE" : 38,
  "EMSG" : 39,
  //
  "ENT0" : 40,
  "GVSN" : 41,
  "GVEA" : 42,
  "DVCA" : 43,
  "MSG0" : 44,
  "MSG2" : 45,
  "MSG4" : 46,
  "MSGP" : 47,
  "OPNA" : 48,
  "DLAT" : 49,
  "WIKI" : 50,
  "LFLR" : 51,
  "CFLR" : 52,
  "KFLR" : 53,
  "EFLR" : 54,
  "LKRN" : 55,
  "LKRO" : 56,
  "LZRM" : 57,
  "LKRA" : 58,
  "LRMS" : 59,
  "LPRM" : 60,
  "RDIR" : 61,
  "GETR" : 62,
  "SETR" : 63,
  "RINF" : 64,
  "GETA" : 65,
  "SETA" : 66,
  "KILL" : 67,
  "CRE8" : 68,
  "FORG" : 69,
  "EINF" : 70,
  "INVT" : 71,
  "WHOK" : 72,
  "KICK" : 73,
  "DELF" : 74,
  "MOVF" : 75,
  "OPEN" : 76,
  "CLOS" : 77,
  "READ" : 78,
  "UOPN" : 79,
  "UCLS" : 80,
  "WRIT" : 81,
  "UIMG" : 82,
  "OIMG" : 83,
  "DLRI" : 84,
  "ULRI" : 85,
  "CONF" : 86,
  "GPEX" : 87,
  "SPEX" : 88,
  "TDAP" : 89,
  "SMTP" : 90,
  "DOWN" : 91,
  "SCDN" : 92,
  "HALT" : 93,
  "NEWU" : 94,
  "CREU" : 95,
  "VALI" : 96,
  "QUSR" : 97,
  "LIST" : 98,
  "SETP" : 99,
  "GETU" : 100,
  "EBIO" : 101,
  "RBIO" : 102,
  "DLUI" : 103,
  "ULUI" : 104,
  "AGUP" : 105,
  "ASUP" : 106,
  "AGEA" : 107,
  "ASEA" : 108,
  "RENU" : 109,
  "GNUR" : 110,
  "GREG" : 111,
  "REGI" : 112,
  "CHEK" : 113,
  "STEL" : 114,
  "RCHT" : 115
}


// https://github.com/mingodad/citadel
// the one that is up to date is on their own git server

/**
 * 
 */
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


/**
 * 
 * 
 ```
    // 0    | The name of the room
    // 1    | Number of unread messages in this room
    // 2    | Total number of messages in this room
    // 3    | Info flag: set to nonzero if the user needs to read this room's info file (see RINF command below)
    // 4    | Various flags associated with this room.  (See LKRN cmd above)
    // 5    | The highest message number present in this room
    // 6    | The highest message number the user has read in this room
    // 7    | Boolean flag: 1 if this is a Mail> room, 0 otherwise
    // 8    | Administrator flag: 1 if the user has admin rights to either the current
    //         room or the entire site.
    // 9    | (this position is no longer used)
    // 10   | The floor number this room resides on
    // 11   | The **current** "view" for this room (see views.md for more info)
    // 12   | The **default** "view" for this room (see views.md for more info)
    // 13   | Boolean flag: 1 if this is the user's Trash folder, 0 otherwise.
    // 14   | More flags associated with this room
    // 15   | Timestamp of the last write activity in this room (addition or deletion
    //         of messages, reconfiguration of room, etc)
    // 16   | Boolean flag: 1 if this is the first time the current user has ever
    //         encountered the current room; 0 otherwise
```
    * 
    * 
*/

class CitadelRoom {
    constructor(fields) {
        //
        this.setup_returned_room_features()
        //
        let r_descr = this
        let n = this.room_returned_features.length
        for ( let i = 0; i < n; i++ ) {
            r_descr[this.room_returned_features[i]] = room_parts[i]
        }
        //
    }


    setup_returned_room_features() {
        //
        this.room_returned_features = [
            "name",                 // 0
            "num_unread",           // 1
            "num_messages",         // 2
            "rinf_changed",         // 3
            "flags_lkrn",           // 4
            "max_msg_num",          // 5
            "max_read_num",         // 6
            "is_mail",              // 7
            "is_admin",             // 8
            "unused1",              // 9
            "floor",                // 10
            "current_view",         // 11
            "default_view",         // 12
            "is_trash",             // 13
            "flags",                // 14
            "last_write_time",      // 15
            "first_visit"           // 16
        ]
    }
}


/**
 * 
        0 The user's name
        1 The user's current access level
        2 (empty field)
        3 (empty field)
        4 Various flags (see citadel.h)
        5 User number
        6 Time of last call (UNIX timestamp)
        7 The user principal ID
 * 
 */
class CitadelUser {
    constructor(fields) {
        this.fullname = fields[0]
        this.axlevel = parseInt(fields[1])
        this.flags = parseInt(fields[4])
        this.usernum = parseInt(fields[5])
        this.lastcall = parseInt(fields[6])
        this.user_id = fields[7]
    }
}




/**
 * 
    0  | Session ID.  Citadel fills this with the pid of a server program.
    1  | User name.
    2  | The name of the room the user is currently in.
    3  | The name of the host the client is connecting from, or "localhost"
    4  | Description of the client software being used
    5  | The last time, locally to the server, that a command was received from this client (Note: NOOP's don't count)
    6  | The last command received from a client. (NOOP's don't count)
    7  | Session flags.  These are:
        - (STEALTH mode)
        * (posting) 
        . (idle)
    8  | (no longer used)
    9  | (no longer used)
    10 | (no longer used)
    11 | Nonzero if the session is a logged-in user, zero otherwise.
    12 ]  // Session state (idle, bound, executing, etc.)
 * 
 */
class CitadelOnlineUser {
    constructor(fields) {
        this.session_id = fields[0]
        this.fullname = fields[1]
        this.in_room = fields[2]
        this.hostname = fields[3]
        this.software_descr = fields[4]
        this.last_cmd_time = fields[5]
        this.last_cmd = fields[6]
        this.session_flags = fields[7]
        this.is_logged_in = (fields[11] === 0) ? false : true
        this.session_state = fields[12]
    }
}


/**
 * 
 */
class CitadelAideUser {
    constructor(fields) {
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

/**
 * 
 */
class ExpirationPolicy {
    constructor(em,ev) {
        this.expire_mode = em
		this.expire_value = ev
    }
}



/**
 * 
    0 - a boolean value telling the client whether there are any additional instant messages waiting following this one
    1 - a Unix-style timestamp
    2 - flags (see server.h for more info)
    3 - the name of the sender
    4 - the node this message originated on (deprecated, do not use)
    5 - the email address or XMPP JID of the sender
 * 
 */
class CitadelInstantMessage {
    constructor(fields) {
        this.more_msgs = fields[0]
        this.timestamp = fields[1]
        this.flags = parseInt(fields[2])
        this.sender_name = fields[3]
        this.sender_address = fields[3]
    }
}


/**
 * The generic email message -- a message can be viewed in different types of lists corresponding to rooms
 * 
 * note: in the constructor the 0th parameter is not included. The method includes it. It is a control parameter 
 * differentiating check and send.
 * 
 * // MESSAGE DELIVERY in citadel/citadel/server/msgbase.c
 * // find **CtdlSubmitMsg**
 * 
 * // MESSAGE TO SMTP -- wild world of internet mail
 * // SMTP_SPOOLOUT_ROOM -- the room that the SMTP client picks up messages from...
 * // CtdlSaveMsgPointerInRoom(SMTP_SPOOLOUT_ROOM, newmsgid, 0, msg);
 * 
 * // the server checks for empty messages, but a client (one of) could save it some time
 * 
 * content types: field #3
 * 
 * 	case 0:
		strcpy(content_type, "text/x-citadel-variformat");
		break;
	case 1:
		strcpy(content_type, "text/plain");
		break;
	case 4:
		strcpy(content_type, "text/plain");
 *
 *
 * note: a message without recipients is considered to be a post and the room, actual room, is set to be SENT ITEMS
 * 
 */
class CitadelMessage {
    constructor(recipient,type,subject,author,references) {
        this.recipient = recipient
        this.anonymous = 0
        this.type = type
        this.subject = subject
        this.author = author            // GVSN this is the post name in the docs
        this.start_chat_mode = 0
        this.cc_recipients = ""
        this.bcc_recipients = ""
        this.exclusive_id = ""          // if supplied the message is auto deleted (only in wiki rooms)
        this.author_email = ""          // GVEA
        this.references = ""
        if ( references && Array.isArray(references) ) {
            this.references = references.join('!')
        }
        this.text = ""
    }

    set_text(txt) {
        this.text = txt
    }

    add_cc(recipients) {
        if ( Array.isArray(recipients) ) {
            this.cc_recipients = recipients.join(',')
        }
    }

    add_bcc(recipients) {
        if ( Array.isArray(recipients) ) {
            this.bcc_recipients = recipients.join(',')
        }
    }

    set_author_email(email_addr) {
        this.author_email = email_addr
    }


    /**
     * 
     * @returns {string}
     */
    as_parameters() {
        let str = `${this.recipient}|${this.anonymous}|${this.type}|${this.subject}|${this.author}|${this.start_chat_mode}|`
        str += `${this.cc_recipients}|${this.bcc_recipients}|${this.exclusive_id}|${this.author_email}|${this.references}|`
        return str
    }

}

class AnonymousCitadelMessage extends CitadelMessage {
    constructor(recipient,type,subject,author,references) {
        super(recipient,type,subject,author,references)
        this.anonymous = 1
    }
}


class ChatModeCitadelMessage extends CitadelMessage {
    constructor(recipient,type,subject,author,references) {
        super(recipient,type,subject,author,references)
        this.start_chat_mode = 1
    }
}

class CitadelMessageFromObject extends CitadelMessage {
    constructor(obj) {
        super(obj.recipient,obj.type,obj.subject,obj.author,obj.references)    
    }
}



/**
 * 
 */
class CitadelServerInfo {
    constructor(fields) {
        this.siession_id = fields[0]      // Your unique session ID on the server
        this.cit_server_name = fields[1]      // The node name of the Citadel server
        this.print_cit_server_name = fields[2]      // Human-readable node name of the Citadel server
        this.fq_domain_name = fields[3]      // The fully-qualified domain name (FQDN) of the server
        this.server_software_name = fields[4]      // The name of the server software, i.e. "Citadel 4.00"
        this.revisions_level = fields[5]      // The revision level of the server code
        this.geo_location = fields[6]      // The geographical location of the site (city and state if in the US)
        this.admin_name = fields[7]      // The name of the system administrator
        this.server_type = fields[8]      // A number identifying the server type (see below)
        this.paginator_prompt = fields[9]      // The text of the system's paginator prompt
        this.floor_flag = fields[10]      // Floor Flag.  1 if the system supports floors, 0 otherwise.
        this.im_support = fields[11]      // Always 1, indicating support for all forms of the SEXP command.
        this.default_language = fields[12]      // The default language for the site (such as en_US)
        this.qnop_support = fields[13]      // Always 1, indicating support for the QNOP command.
        this.ldap_support = fields[14]      // Set to nonzero if this server is capable of connecting to a directory service using LDAP.
        this.can_create_new_users = fields[15]      // Set to nonzero if this server does **not** allow self-service creation of new user accounts.
        this.default_tz = fields[16]      // The default timezone for calendar items which do not have any timezone specified and are not flagged as UTC.  This will be a zone name from the Olsen database.
        // this.fx = fields[17]      // (empty field - no longer in use)
        // this.fx = fields[18]      // (empty field - no longer in use)
        // this.fx = fields[19]      // (empty field - no longer in use)
        // this.fx = fields[20]      // (empty field - no longer in use)
        this.full_text_enabled = fields[21]      // Nonzero if the server's full text index is enabled.
        this.server_build_id = fields[22]      // Build ID of this version of Citadel Server.
        this.open_id_support = fields[23]      // OpenID version supported by the server (always 0 because support for OpenID has ended)
        this.anonymous_guests_ok = fields[24]      // Nonzero if the server supports anonymous guest logins
    }
}


let result_code_map = {
    "10"    : "INTERNAL_ERROR",  // An internal error occurred
    "11"	: "TOO_BIG",			    // The supplied data will not fit in the allocated space.
    "12"	: "ILLEGAL_VALUE",		    // One or more parameters supplied to a command are not within the permitted ranges.
    "20"	: "NOT_LOGGED_IN",		    // The client attempted to perform an operation which is only permitted when a user is logged in.
    "30"	: "CMD_NOT_SUPPORTED",	    // The client attempted to perform an operation which is defined in the protocol, but not supported by this server instance.
    "31"	: "SERVER_SHUTTING_DOWN",   // A command failed because the server is in the process of shutting down.
    "40"	: "PASSWORD_REQUIRED",      // A command failed because a password is required.
    "41"	: "ALREADY_LOGGED_IN",      // Authentication failed because a user is already logged in.
    "42"	: "USERNAME_REQUIRED",      // The client attempted to perform an operation which requires the of a user name.
    "50"	: "HIGHER_ACCESS_REQUIRED",	// The client attempted to perform an operation which requires administrator privileges.
    "51"	: "MAX_SESSIONS_EXCEEDED",  // A login attempt failed because the server is operating at its maximum number of connected sessions.
    "52"	: "RESOURCE_BUSY",	        // The client attempted to perform an operation on a locked resource.
    "53"	: "RESOURCE_NOT_OPEN",      // The client attempted to access an object which is not locked yet.
    "60"	: "NOT_HERE",		        // The specified command is valid, but is not permitted in the current room.
    "61"	: "INVALID_FLOOR_OPERATION",    // The client attempted to manipulate rooms and/or floors in a way that would break the data model.
    "70"	: "NO_SUCH_USER",	        // The user name specified in a command does not exist.
    "71"	: "FILE_NOT_FOUND",		    // The file name specified in a command does not exist.
    "72"	: "ROOM_NOT_FOUND",		    // The room name specified in a command does not exist.
    "73"	: "NO_SUCH_SYSTEM",		    // The network node specified in a command does not exist.
    "74"	: "ALREADY_EXISTS",		    // The client attempted to create an object with a name that already refers to an existing object on the system.
    "75"	: "MESSAGE_NOT_FOUND"       // The requested message does not exist in the current room.
}





/**
 * 
 * @param {*} text 
 * @returns 
 */
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

/**
 * 
 */
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
        this.roomMap["PUBLIC"] = {}
        this.roomMap["HIDDEN"] = {}
        this.roomMap["INVITATION"] = {}
        this.roomMap["PERSONAL"] = {}
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
        //
    }



    /**
     * 
     * @param {string} rt 
     * @returns {}
     */
    room_type_to_string(rt) {
        switch ( rt ) {
            case this.PUBLIC_ROOM: { return "PUBLIC" }
            case this.HIDDEN_ROOM: { return "HIDDEN" }
            case this.INVITATION_ROOM: { return "INVITATION" }
            case this.PERSONAL_ROOM: { return "PERSONAL" }
        }
        return "HIDDEN"
    }



    /**
     * returns an object with the room features as fields
     * and the server supplied values are associated with the fields.
     *  see : setup_returned_room_features
     * @param {string} room_str 
     * @returns {object}
     */
    unpack_room_info(room_str) {
        let room_parts = room_str.split('|')
        return new CitadelRoom(room_parts)
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
     * @param {string} str 
     * @param {boolean} useDelay 
     * @param {boolean} privileged 
     * @returns 
     */
    clientWrite(str,useDelay = false,privileged = false) {
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


    async safe_client_write(cmdstr,useDelay,privileged) {
        try {
            let resp =  await this.clientWrite(cmdstr,useDelay,privileged)
            return resp
        } catch ( e ) {
            console.log("safe_client_write: " + e.message)
            return(false)
        }
    }


    /**
     * 
     * @param {object} resp 
     * @returns 
     */
    handle_generic_response(resp) {
        if ( resp?.response ) {
            let output = resp.response
            output = output.join(' ')
            return(output)
        } else {
            return false
        }
    }



    /**
     * 
     * @param {number} rt - the room type
     * @param {number} floor - if -1 then all floors
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
        let resp =  await this.safe_client_write(cmdstr)
        let output = this.handle_generic_response(resp)
        //
        if ( output ) {
            let rlist = output.split('\n')
            let rrecords = rlist.map((rline) => {
                let rdata = rline.split('|')
                let name = rdata.shift()
                return({ 'name' : name, room_type: rt, 'rest' : rdata.join('|') })
            })
            //
            let rt_str = this.room_type_to_string(rt)
            this.roomMap[rt_str] = {}
            rrecords.forEach((rec) => {
                if ( rec.name === 'Known rooms:' ) return;
                if ( rec.name === '000' ) return;
                this.roomMap[rt_str][rec.name] = rec
            })
    
            return(this.roomMap[rt_str])    
        }
        return(false)
    }


    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----


    // "NOOP",
    // "QNOP",
    // "ECHO",
    // "TIME",

    /**
     * // NOOP
     * @returns 
     */
    async noop() {
        let resp =  await this.safe_client_write("NOOP")
        return this.handle_generic_response(resp)
    }



    /**
     * // "QNOP": "no operation with no response"
     * 
     * This is a keep alive operation... The connection can timeout
     * 
     * @returns 
     */
    async q_noop() {
        let cmdstr = 'QNOP'
        this.client.write(`${cmdstr}\n`)
        return "q_noop"
    }


    /**
     * 
     * // ECHO
     * 
     * @param {string} str 
     * @returns 
     */
    async echo(str) {
        let resp =  await this.safe_client_write("ECHO " + str)
        return this.handle_generic_response(resp)
    }


    /**
     * 
     * // TIME
     * 
     * @returns 
     */
    async server_time() {
        let resp = await this.safe_client_write("TIME")
        return this.handle_generic_response(resp)
    }


    // "MESG",
    // "USER",
    // "PASS",
    // "LOUT",

    /**
     * 
     * 
        hello        | Welcome message, to be displayed before the user logs in.
        changepw     | To be displayed whenever the user is prompted for a new
                            password.  Warns about picking guessable passwords and such.
        register     | Should be displayed prior to the user entering registration.
                            Warnings about not getting access if not registered, etc.
        help         | Main system help file.
        goodbye      | System logoff banner; display when user logs off.
        roomaccess   | Information about how public rooms and different types of
                            private rooms function with regards to access.
        unlisted     | Tells users not to choose to be unlisted unless they're really
                            paranoid, and warns that administrators can still see unlisted
                            user list entries.
     * 
     * 
     * @param {string} message 
     * @returns {string}
     */
    async system_message(message) {
        let cmdstr = "MESG " + message
        try {
            let resp = await this.safe_client_write(cmdstr)
            let output = this.handle_generic_response(resp)
            return(output)
        } catch (e) {
            return("system message not found")
        }
    }


    /**
     * // USER
     * 
     * Find the user. 
     * 
     * @param {string} uname 
     * @returns {boolean}
     */
    async user(uname) {
        let cmdstr = "USER " + uname
        let resp =  await this.safe_client_write(cmdstr)
        let output = this.handle_generic_response(resp)
        if ( output === `Password required for ${uname}` ) {
            return true
        }
        return(false)
    }

    /**
     * 
     * // PASS
     * Given the user has been found, return a record 
     * that identifies the user to the server.
     * 
        0 The user's name
        1 The user's current access level
        2 (empty field)
        3 (empty field)
        4 Various flags (see citadel.h)
        5 User number
        6 Time of last call (UNIX timestamp)
        7 The user principal ID
     * 
     * 
     * 
     * @param {string} pass 
     * @returns {CitadelUser}
     */
    async password(pass) {
        let cmdstr = "PASS " + pass
        let resp =  await this.safe_client_write(cmdstr)
        if ( resp ) {
            let output = this.handle_generic_response(resp)
            let user_info = output.split('|')
            let user = new CitadelUser(user_info)
            return user
        }
        return(false)
    }


    /**
     * // LOUT
     * 
     * @returns {boolean}
     */
    async logout() {
        let resp =  await this.safe_client_write("LOUT")
        let output = this.handle_generic_response(resp)
        if ( output === "OK" ) return true
        return(false)
    }



    // "GJWT",
    // "AJWT",
    // "IDEN",
    // "QUIT",


    /**
     * // GJWT
     * 
     * Returns the JWT for the user to be used later for logging in.
     * 
     * @returns {string|boolean}
     */
    async generate_JWT() {
        let cmdstr = 'GJWT'
        try {
            let resp = await this.safe_client_write(cmdstr)
            return this.handle_generic_response(resp)
        } catch (e) {
            console.warn(e)
            return false
        }
    }


    /**
     * // AJWT
     * 
     * Given the user has been found, return a record 
     * that identifies the user to the server.
     * 
     * @param {string} jwt 
     * @returns 
     */
    async authenticate_JWT(jwt) {
        let cmdstr = `AJWT ${jwt}`
        let resp = await this.safe_client_write(cmdstr)
        if ( resp ) {
            let output = this.handle_generic_response(resp)
            let user_info = output.split('|')
            let user = new CitadelUser(user_info)
            return user
        }
        return false
    }


    /**
     * // IDEN
     * 
     * @param {string} developerid 
     * @param {string} clientid 
     * @param {string} revision 
     * @param {string} software_name 
     * @param {string} hostname 
     * @returns {boolean}
     */
    async identify_software(developerid,clientid,revision,software_name,hostname) {
        //
        if ( (developerid < 0) || (clientid < 0) || (revision < 0) || !software_name ) {
            developerid = 8;
            clientid = 0;
            revision = this.CLIENT_VERSION - 600;
            software_name = "Citadel (libcitadel)";
        }
        if ( !hostname ) return -2;

        let cmdstr = `IDEN ${developerid}|${clientid}|${revision}|${software_name}|${hostname}`
        let resp = await this.safe_client_write(cmdstr)
        let output = this.handle_generic_response(resp)
        if ( output === "OK" ) return true
        return(false)
    }



    /**
     * // QUIT
     * 
     * This closes the calling connection from the server side.
     * 
     * @returns {boolean}
     */
    async quit() {
        let resp = await this.safe_client_write("QUIT")
        if ( resp && resp.response ) {
            return true
        } else {
            return false
        }
    }





    // "BIFF",
    // "RWHO",
    // "QDIR",
    // "RBDI",


    /**
     * "BIFF": "Count new messages that have arrived in the inbox"
     * 
     * This is the user's inbox count
     * ```
        CIT_OK (200) followed by two integer parameters separated by a pipe character (|):

        Field 0 | Number of new messages which have arrived in the current user's inbox
                    while they were logged in. This count begins at zero when the user
                    initially logs in (even if they have unread mail) and resets to zero
                    each time the BIFF command is executed.

        Field 1 | Number of instant messages currently waiting in the user's session queue
                    (undelivered/undrained express messages). This reflects the current
                    queue depth and is not reset by BIFF; it decreases as messages are
                    retrieved using GEXP.
      ```
     *
     * On success, returns the fields 0 and 1 in an object with corresponding fields "m_count" and "im_count"
     * @returns {object}
     * 
     */
    async count_new_messages() {
        let resp =  await this.safe_client_write("BIFF")
        let output = this.handle_generic_response(resp)
        let mcounts = {
            "m_count" : 0,
            "im_count" : 0
        }
        if ( output !== '0' ) {
            let counts = output.split('|')
            mcounts.m_count = counts[0]
            mcounts.im_count = counts[1]
        }
        return(mcounts)
    }


    /**
     * 
     * // RWHO
     * 
     * 
        0  | Session ID.  Citadel fills this with the pid of a server program.
        1  | User name.
        2  | The name of the room the user is currently in.
        3  | The name of the host the client is connecting from, or "localhost"
        4  | Description of the client software being used
        5  | The last time, locally to the server, that a command was received from this client (Note: NOOP's don't count)
        6  | The last command received from a client. (NOOP's don't count)
        7  | Session flags.  These are:
            - (STEALTH mode)
            * (posting) 
            . (idle)
        8  | (no longer used)
        9  | (no longer used)
        10 | (no longer used)
        11 | Nonzero if the session is a logged-in user, zero otherwise.
        12 | Session state (idle, bound, executing, etc.)
     * 
     * @returns {Array}
     */
    async on_line_users() {
        let cmdstr = 'RWHO'
        let resp = await this.safe_client_write(cmdstr)
        let output = this.handle_generic_response(resp)
        let user_list = []
        let user_lines = output.split("\n")
        for ( let line of user_lines ) {
            line = line.trim()
            if ( line === "000" ) continue
            if ( line.length > 0 ) {
                user_list.push(new CitadelOnlineUser(line.split('|')))
            }
        }
        return(user_list)
    }



    /**
     * // QDIR
     * 
     * Applies to logged in users
     * 
     * @param {string} address -- Internet e-mail address to look up
     * @returns {boolean}
     */
    async directory_lookup(address) {
        if ( !address ) return -2;
        let cmdstr = `QDIR ${address}`
        let resp = await this.safe_client_write(cmdstr)
        let output =  this.handle_generic_response(resp)
        if ( output === "OK" ) return true
        return(false)
    }



    /**
     * // "RBDI": "ReBuild Directory Index",
     * 
     * Internet email addresses of logged in users.
     * 
     * @returns {boolean}
     */
    async rebuild_dir_index() {
        let cmdstr = 'RBDI'
        let resp = await this.safe_client_write(cmdstr)
        let output = this.handle_generic_response(resp)
        if ( output === "OK" ) return true
        return(false)
    }



    /*
    "AUTO",
    "ISME",
    "INFO",
    "TERM",
    "REQT",
    "STLS",
    "GTLS",
    */



    /**
     * returns a list of email addresses
     * @param {string} probe - a string for partial matching
     * @returns {Array}
     */
    async autocomplete(probe) {
        let cmdstr = `AUTO ${probe}`
        let resp = await this.safe_client_write(cmdstr)
        let lines = this.handle_generic_response(resp)
        let email_list = lines.split('\n')
        email_list = email_list.filter((line) => {
            if ( line.trim() === "000" ) return false
            if ( line.trim() === "try these:" ) return false
            return true
        })
        return email_list
    }




    /**
     * 
     * // "ISME": "Determine whether an email address belongs to a user"
     * 
     * @returns {boolean}
     */
    async check_email_is_mine(address) {
        let cmdstr = `ISME ${address}`
        let resp =  await this.safe_client_write(cmdstr)
        let output = this.handle_generic_response(resp)
        if ( output === "OK" ) return true
        return(false)
    }



    
    /**
     * // INFO
     * 
        0     | Your unique session ID on the server
        1     | The node name of the Citadel server
        2     | Human-readable node name of the Citadel server
        3     | The fully-qualified domain name (FQDN) of the server
        4     | The name of the server software, i.e. "Citadel 4.00"
        5     | The revision level of the server code
        6     | The geographical location of the site (city and state if in the US)
        7     | The name of the system administrator
        8     | A number identifying the server type (see below)
        9     | The text of the system's paginator prompt
        10    | Floor Flag.  1 if the system supports floors, 0 otherwise.
        11    | Always 1, indicating support for all forms of the SEXP command.
        12    | The default language for the site (such as en_US)
        13    | Always 1, indicating support for the QNOP command.
        14    | Set to nonzero if this server is capable of connecting to a directory
                service using LDAP.
        15    | Set to nonzero if this server does **not** allow self-service creation
                of new user accounts.
        16    | The default timezone for calendar items which do not have any timezone
                specified and are not flagged as UTC.  This will be a zone name from
                the Olsen database.
        17    | (empty field - no longer in use)
        18    | (empty field - no longer in use)
        19    | (empty field - no longer in use)
        20    | (empty field - no longer in use)
        21    | Nonzero if the server's full text index is enabled.
        22    | Build ID of this version of Citadel Server.
        23    | OpenID version supported by the server (always 0 because support for OpenID has ended)
        24    | Nonzero if the server supports anonymous guest logins
     *
     * 
     * If the operation can be performed, a class type with the parsed information in fields is returned.
     * Otherwise, returns false with error logged.
     * 
     * @returns {CitadelServerInfo}
     */
    async server_info() {
        let resp =  await this.safe_client_write("INFO")
        let info_str = this.handle_generic_response(resp)
        if ( info_str ) {
            let info_list = info_str.split('\n')
            info_list.shift()
            info_list.pop()
            return new CitadelServerInfo(info_list)
        }
        return false
    }


    /**
     * // TERM
     * (not yet tested)
     * 
     */
    async terminate_session(sid) {
        let cmdstr = `TERM ${sid}`
        let resp = await this.safe_client_write(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }



    /**
     * // REQT
     * 
     * (not yet tested)
     * 
     * @param {number} session 
     * @returns 
     */
    async request_client_logout(session) { //
        if ( session < 0 ) return -2;
        let cmdstr = `REQT ${session}`
        let resp = await this.safe_client_write(cmdstr)
        let output =  this.handle_generic_response(resp)
        if ( output === "OK" ) return true
        return(false)
    }



    /**
     * // STLS": "Start TLS session
     * 
     * Following the call to this command, the server and client must negotiated
     * TLS. Otherwise, communication with the server hangs.
     * (Keep in mind that this service using this class is the client. This client has to call SSL_connect())
     * Ensuing connections might use the node.js net library or a plugin.
     * 
     * @returns {boolean}
     */
    async start_TLS_session() {
        let cmdstr = 'STLS'
        let resp = await this.safe_client_write(cmdstr)
        let output =  this.handle_generic_response(resp)
        if ( output === "OK" ) return true
        return(false)
    }


    // "GTLS": "Get TLS session status",
    /**
     * 
     * 
        0 | Protocol name, e.g. "SSLv3"
        1 | Cipher suite name, e.g. "ADH-RC4-MD5"
        2 | Cipher strength bits, e.g. 128
        3 | Cipher strength bits actually in use, e.g. 128
     * 
     * @returns 
     */

    unpack_tls_data(data_str) {
        let dat_list = data_str.split('|')
        let dat_descr = {
            "protocol" : dat_list[0],
            "cipher_suite" : dat_list[1],
            "cipher_strength" : dat_list[2],
            "actual_cipher_strength" : dat_list[3]
        }
        return dat_descr
    }


    /**
     * // GTLS
     * Fetches the session's TLS parameters that were established with `start_TLS_session`
     * @returns {object|boolean}
     */
    async get_TLS_session() {
        let cmdstr = 'GTLS'
        let resp = await this.safe_client_write(cmdstr)
        let tls_data = this.handle_generic_response(resp)
        if ( tls_data ) {
            tls_data = this.unpack_tls_data(tls_data)
        }
        return tls_data
    }


    // "ICAL",
    // "SEXP",
    // "GEXP",
    // "DEXP",


    /**
     * 
     * // ICAL ": "Citadel iCalendar command"
     * 
     * commands:
     * test
     * respond      -- respond|msgnum|partnum|action
     * conflicts    -- conflicts|msgnum|partnum
     * handle_rsvp  -- handle_rsvp|msgnum|partnum
     * freebusy     -- freebusy|username
     * sgi          -- sgi|(bool)   //  server_generated_invitations - 1 enables, 0 disables
     * getics       -- getics       // unloads a calendar stream
     * putics       -- putics       // after this command the client needs to write the calendar stream (see send_text)
     * 
     * 
     * @param {*} probe 
     * @returns 
     */
    async ical_cmd(cmd_str) {
        let cmdstr = `ICAL ${cmd_str}`
        let resp = await this.safe_client_write(cmdstr)
        return this.handle_generic_response(resp)
    }


    /**
     * 
     * // SEXP
     * 
     *  send text
     * 
     * @param {string} username 
     * @param {string} text 
     * @returns 
     */
    async send_instant_message(username,text) {
        if ( !username ) return -2;
        let cmdstr = ''
        if (text) {
            cmdstr = `SEXP ${username}|-`
            let resp = await this.safe_client_write(cmdstr)
            if ( resp.bucket === 4 ) {
                this.send_text(text)
            }
            return(resp.status)
        } else {
            cmdstr = `SEXP ${username}||`
            let resp = await this.safe_client_write(cmdstr)
            return(resp.status)
        }
    }


    /**
     * // GEXP
     * 
        0 - a boolean value telling the client whether there are any additional instant
            messages waiting following this one
        1 - a Unix-style timestamp
        2 - flags (see server.h for more info)
        3 - the name of the sender
        4 - the node this message originated on (deprecated, do not use)
        5 - the email address or XMPP JID of the sender
     * 
     * @returns {CitadelInstantMessage}
     */
    async get_instant_message() {
        let cmdstr = 'GEXP'
        let resp = await this.safe_client_write(cmdstr)
        if ( resp ) {
            let output = this.handle_generic_response(resp)
            let par_lines = output.split('\n')
            return(new CitadelInstantMessage(par_lines))
        }
        return false
    }


    /**
     * // DEXP
     * 
     * Enable/Disable instant messaging for a user
     * 
     * @param {boolean} mode 
     * @returns 
     */
    async enable_instant_message(mode) {
        mode = mode ? "1" : "0"
        let cmdstr = `DEXP ${mode}`
        let resp = await this.safe_client_write(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }


    // ROOM DATA OPS START HERE

    // "GOTO",
    // "STAT",


    /**
     * // GOTO
     * 
     * @param {string} room 
     * @returns 
     */
    async goto_room(room) {
        let cmdstr = "GOTO " + room
        let resp =  await this.safe_client_write(cmdstr)
        let output = this.handle_generic_response(resp)
        let room_descr = this.unpack_room_info(output)
        return(room_descr)
    }


    /**
     * // GOTO
     * 
     * This variant expects a room password. 
     * Rooms may be created so that they require a password for entry.
     * 
     * @param {string} room 
     * @param {string} password 
     * @returns 
     */
    async goto_password_room(room,password) {
        let cmdstr = `GOTO ${room}|${password}`
        let resp =  await this.safe_client_write(cmdstr)
        let output = this.handle_generic_response(resp)
        let room_descr = this.unpack_room_info(output)
        return(room_descr)
    }



    /**
     * // STAT : "Get mtime of the current root"
     * 
     * @returns 
     */
    async get_root_mtime() {
        let cmdstr = 'STAT'
        let resp = await this.safe_client_write(cmdstr)
        let room_stat = this.handle_generic_response(resp)
        room_stat = room_stat.split('|')
        room_stat = {
            "name" : room_stat[0],
            "mod_time" : room_stat[1]
        }
        return room_stat
    }


    // "MSGS",
    // "MARK",
    // "SLRP",


    /**
     * // MSGS
     * 
     * (not yet tested)
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
        let resp = await this.safe_client_write(cmdstr)
        if ( resp.bucket !== 1 ) {
            return(resp.status)
        } else {
            output = this.handle_generic_response(resp)
        }
        return(output)
    }


    
    /**
     * // MARK
     * > Mark messages in a sequence set as seen
     * 
     * @returns 
     */
    async set_user_parameters(sequence_set) {
        let cmdstr = `MARK ${sequence_set}`
        let resp =  await this.safe_client_write(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }


    
    /**
     * // SLRP
     * 
     * @param {number} msgnum 
     * @returns 
     */
    async set_last_read(msgnum) {
        let cmdstr = "SLRP HIGHEST"
        if (msgnum) {
            cmdstr = `SLRP ${msgnum}`
        }
        let resp = await this.safe_client_write(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }


    // "GTSN",
    // "VIEW",
    // "SRCH",
    // "EUID",
    // "DELE",
    // "MOVE",
    // "EMSG",

    /**
     * 
     * // GTSN
     * > Fetch seen/unread message flags
     * 
     * @returns 
     */
    async fetch_unread_messages() {
        let cmdstr = `GTSN`
        let resp =  await this.safe_client_write(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }
 

    /**
     * 
     * // VIEW
     * > Set preferred view for user/room combination
     * 
     * @returns 
     */
    async set_preferred_room_view(view_type) {
        switch ( view_type ) {
            case "PUBLIC" : {
                view_type = this.PUBLIC_ROOM
                break
            }
            case "HIDDEN" : {
                view_type = this.HIDDEN_ROOM
                break
            }
            case "INVITATION" : {
                view_type = this.INVITATION_ROOM
                break
            }
            case "PERSONAL" : {
                view_type = this.PERSONAL_ROOMs
                break
            }
        }
        let cmdstr = `VIEW ${view_type}`
        let resp =  await this.safe_client_write(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }
 

    /**
     * 
     * // SRCH
     * > Full text search
     * 
     * @returns 
     */
    async full_text_search(search_pattern) {
        let cmdstr = `SRCH ${search_pattern}`
        let resp =  await this.safe_client_write(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }


    /**
     * // EUID
     * 
     * @param {string} its_euid 
     * @returns {number}
     */
    async get_message_by_exclusive_id(its_euid) {
        let cmdstr = `EUID ${its_euid}`
        let resp =  await this.safe_client_write(cmdstr)
        let output = this.handle_generic_response(resp)  // will retun the message number
        output = parseInt(output)
        return(output)
    }

    
    /**
     * 
     * // DELE
     * 
     * @param {number} msgnum 
     * @returns {boolean}
     */
    async delete_message(msgnum) {
        let cmdstr = `DELE ${msgnum}`
        let resp = await this.safe_client_write(cmdstr)
        let output = this.handle_generic_response(resp)
        if ( output === "OK" ) return(true)
        return(false)
    }


    /**
     * // MOVE
     * 
     * @param {number} msgnum 
     * @param {number} destroom 
     * @param {boolean} copy 
     * @returns 
     */
    async  move_message(msgnum,destroom) {
        let cmdstr = `MOVE ${msgnum}|${destroom}|0`
        let resp = await this.safe_client_write(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }


    /**
     * // MOVE
     * 
     * @param {Array} msglist
     * @param {number} destroom 
     * @param {boolean} copy 
     * @returns 
     */
    async move_message_list(msglist,destroom) {
        let msglist_str = msglist.join(',')
        let cmdstr = `MOVE ${msglist_str}|${destroom}|0`
        let resp = await this.safe_client_write(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }

    /**
     * // MOVE
     * 
     * @param {number} msgnum 
     * @param {number} destroom 
     * @param {boolean} copy 
     * @returns 
     */
    async  copy_message(msgnum,destroom) {
        let cmdstr = `MOVE ${msgnum}|${destroom}|1`
        let resp = await this.safe_client_write(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }

    /**
     * // MOVE
     * 
     * @param {Array} msglist
     * @param {number} destroom 
     * @param {boolean} copy 
     * @returns 
     */
    async copy_message_list(msglist,destroom) {
        let msglist_str = msglist.join(',')
        let cmdstr = `MOVE ${msglist_str}|${destroom}|1`
        let resp = await this.safe_client_write(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }


    /**
     * 
     * // EMSG
     * 
     * Install system messages 
     * @param {string} filename 
     * @param {string} text 
     * @returns 
     */
    async enter_system_message(filename,text) {
        if ( !filename ) return -2;
        let cmdstr = `EMSG ${filename}`
        let resp = await this.safe_client_write(cmdstr)
        if ( resp.bucket === 4 ) {
            this.send_text(text)
        }
        return(resp.status)
    }


    //
    // ENTER A MESSAGE INTO THE SYSTEM
    //
    // ENT0 -- this its own beast and can put up posts or send emails

    /**
     * // ENT0
     * > check to see if it is ok to post a message
     * 
     * @param {CitadelMessage} msgObject 
     * @returns {boolean}
     */
    async check_ok_post_message(msgObject) {
        if ( (typeof msgObject === "object") && !(msgObject instanceof CitadelMessage)  ) {
            msgObject = new CitadelMessageFromObject(msgObject)
        }
        let msg = `ENT0 0|` + msgObject.as_parameters()
        //
        let resp =  await this.safe_client_write(msg)
        let output = this.handle_generic_response(resp)
        if ( output === "OK" ) {
            return true
        }
        return(false)
    }

    

    /**
     * // ENT0
     * > acually post a message. Perhaps, send an email to someone via SMTP
     * 
     * @param {object} msgObject 
     * @returns 
     */
    async post_message(msgObject) {
        if ( (typeof msgObject === "object") && !(msgObject instanceof CitadelMessage)  ) {
            msgObject = new CitadelMessageFromObject(msgObject)
        }
        let msg = `ENT0 1|` + msgObject.as_parameters()
        //
        let resp =  await this.safe_client_write(msg)
        let output = this.handle_generic_response(resp)

        if ( output === "send message") {
            let text = msgObject.text;
            text = text.trim()
            text = shortLines(text)
            //console.log(text)
            text += '\n000'
            output = await this.safe_client_write(text,true)  // clientWrite nowait
            return(output)
        }
        return output       // should be start chat or false
    }



    // GVSN
    // GVEA
    // DVCA


    // read single message
    // MSG0
    // MSG2
    // MSG4

    // mime related
    // MSGP             -- text/html|text/plain -- dont_decode

    // OPNA
    // DLAT


    // WIKI -- complex command structure

    // floors

    // LFLR
    // CFLR
    // KFLR
    // EFLR



    // room list commands 
        // 0	NAME		Actual name of this room; may include '\' to separate trese
        // 1	FLAG		Flags for this room (one per bit, from the QR_ flags listed below)
        // 2	FLOOR		The number of the floor on which this room resides.
        // 3	LISTORDER	Listing order (the client can voluntarily sort the list this way)
        // 4	ACL		Flags for this room (one per bit, from the QR2_ flags listed below)
        // 5	CURVIEW		the currently configured "view" for this room
        // 6	DEFVIEW		the default "view" for this room
        // 7	LASTCHANGE	date/time stamp of the last write to this room
    // LKRN
    // LKRO
    // LZRM
    // LKRA
    // LRMS
    // LPRM

    // room manipulation commands
    // RDIR     -- a filename, the length of the file, and a description
    // GETR
    // SETR
    // RINF
    // SETA
    // KILL
    // CRE8
    // FORG
    // EINF
    // INVT
    // WHOK
    // KICK

    // room's file directory
    // DELFs
    // MOVF
    // OPEN
    // CLOS
    // READ
    // UOPN
    // UCLS
    // WRIT
    // UIMG
    // OIMG
    // DLRI
    // ULRI
    


    // Commands that change the behavior of this Citadel System

    // CONF     -- a complex of subcommands


    // Commands related to the auto-purger

    // GPEX
    // SPEX
    // TDAP


    // Server Maintenance Commands

    // SMTP
    // DOWN
    // SCDN
    // HALT

    // Session authentication
    // NEWU
    // CREU
    // VALI
    // QUSR
    // LIST  -- user listing


    // Commands which manipulate user records
    // SETP
    // GETU
    // SETU
    // EBIO
    // RBIO
    // DLUI
    // ULUI
    // AGUP | ASUP
    // AGEA
    // ASEA
    // RENU
    // GNUR
    // GREG
    // REGI
    // CHEK


    // Runtime Attribute Manipulation
    // STEL


    /**
     * 
     * 
    //   "RCHT": "Participate in real time chat in a root",
        // Chat mode
        // RCHT
        // RCHT enter
        // RCHT exit
        // RCHT send
        // RCHT poll[|newer_than]
        // RCHT rwho    
     * @param {string} cmd_str 
     * @param {string} cmd_pars - optional
     * @returns 
     */
    async real_time_chat(cmd_str,cmd_pars = false) {
        let cmdstr = `RCHT ${cmd_str}`
        if ( cmd_pars ) {
            cmdstr += `|${cmd_pars}`
        }
        let resp = await this.safe_client_write(cmdstr)
        return this.handle_generic_response(resp)
    }




    // LAST COMMAND FIXUP



    /**
     * 
     * @param {string} pop_pass 
     * @returns 
     */
    async tryApopPassword(pop_pass) {  // cret ... 
        if (!pop_pass) return -2;
        let cmdstr = "PAS2 " + pop_pass
        let resp =  await this.safe_client_write(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }


    /**
     * 
     * 
        // US_LASTOLD	16		Print last old message with new
        // US_EXPERT	32		Experienced user (suppress some of the help blurbs)
        // US_UNLISTED	64		Unlisted userlog entry
        // US_NOPROMPT	128		Don't prompt after each message
        // US_DISAPPEAR	512		Use "disappearing msg prompts"
        // US_PAGINATOR	2048		Pause after each screen of text
     * 
     * @returns {object}
     */
    unpack_user_parameters(pbits) {
        let bits = parseInt(pbits)
        let values = {
            "LASTOLD" : ((bits & 16) === 0) ? false : true,
            "EXPERT" : ((bits & 32) === 0) ? false : true,
            "UNLISTED" : ((bits & 64) === 0) ? false : true,
            "NOPROMPT" : ((bits & 128) === 0) ? false : true,
            "DISAPPEAR" : ((bits & 512) === 0) ? false : true,
            "PAGINATOR" : ((bits & 2048) === 0) ? false : true
        }
        return values
    }


    /**
     * 
     * @returns {object}
     */
    async get_user_parameters() {
        try {
            let resp =  await this.safe_client_write("GETU ")
            let output = this.handle_generic_response(resp)
            let report = this.unpack_user_parameters(output)
            return(report)
        } catch (e) {
            return false
        }
    }
 

    /**
     * 
     * //   "SETU": "Set User parameters"
     * 
     * @returns 
     */
    async set_user_parameters(params) {
        let cmdstr = `SETU ${params}`
        let resp =  await this.safe_client_write(cmdstr)
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
        let resp =  await this.safe_client_write(cmdstr)
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
        let resp =  await this.safe_client_write(cmd)
        let output = this.handle_generic_response(resp)
        return(output)

    }




    /**
     * 
     * @returns 
     */
    async list_floors() {
        let resp =  await this.safe_client_write("LFLR")
        let output = this.handle_generic_response(resp)
        return(output)
    }


    /**
     * 
     * @param {*} pass 
     * @returns 
     */
    async set_password(pass) {
        let cmdstr = "SETP " + pass
        let resp =  await this.safe_client_write(cmdstr)
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
            let resp =  await this.safe_client_write(cmdstr)
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
            let resp = await this.safe_client_write(cmdstr)
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
        let resp = await this.safe_client_write(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }

    // 


    /**
     * // MSG0 :: ctdlproto/serv_messages.c: "Output a message in plain text format"
     * @returns 
     */
    async get_message_plain_text(msgnum,headers_only) {
        if ( headers_only === undefined ) headers_only = 0
        let cmdstr = "MSG0 ${msgnum} ${headers_only}"
        let resp =  await this.safe_client_write(cmdstr)
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
        let resp =  await this.safe_client_write(cmdstr)
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
        let resp =  await this.safe_client_write(cmdstr)
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
        let resp =  await this.safe_client_write(cmdstr)
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
        let resp =  await this.safe_client_write(cmdstr)
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
        let resp =  await this.safe_client_write(cmdstr)
        return this.handle_generic_response(resp)
    }


    /**
     * 
     * @returns 
     */
    async who_knows_room() {
        let resp =  await this.safe_client_write("WHOK")
        return this.handle_generic_response(resp)
    }


    /**
     * 
     */
    async read_directory() {
        let resp =  await this.safe_client_write("RDIR")
        return this.handle_generic_response(resp)
    }
    
    /**
     * 
     * @returns 
     */
    async read_directory() {
        let resp =  await this.safe_client_write("RDIR")
        return this.handle_generic_response(resp)
    }


    /**
     * 
     * @param {*} username 
     * @returns 
     */
    async invite_user_to_room(username) {
        let cmdstr = "INVT " + username
        let resp = await this.safe_client_write(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }

    /**
     * 
     */
    async kickout_user_from_room(username) {
        let cmdstr = "KICK " + username
        let resp = await this.safe_client_write(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }


    
    /**
     * 
     * @returns 
     */
    async get_room_attributes() {
        let resp =  await this.safe_client_write("GETR")
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
        let resp = await this.safe_client_write(cmdstr)
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
        let resp = await this.safe_client_write(cmdstr)
        return this.handle_generic_response(resp)
    }


    /**
     * 
     * @returns 
     */
    async get_room_aide() {
        let cmdstr = "GETA"
        let resp = await this.safe_client_write(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }


    /**
     * 
     * @returns 
     */
    async room_info() {
        let cmdstr = "RINF"
        let resp = await this.safe_client_write(cmdstr)
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
            let resp = await this.safe_client_write(cmdstr)
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
        let resp = await this.safe_client_write(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }






    /**
     * 
     * @returns 
     */
    async unvalidated_user() {
        let cmdstr = "GNUR"
        let resp = await this.safe_client_write(cmdstr)
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
        let resp = await this.safe_client_write(cmdstr)
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
        let resp = await this.safe_client_write(cmdstr)
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
        let resp = await this.safe_client_write(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }

    /**
     * 
     * @returns 
     */
    async set_registration() {
        let cmdstr = 'REGI'
        let resp = await this.safe_client_write(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }


    /**
     * //   "GVSN": "Get Valid Screen Names
     * @returns 
     */
    async get_valid_screen_names() {
        let cmdstr = 'GVSN'
        let resp = await this.safe_client_write(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }



    /**
     * //   "GVEA": "Get Valid Email Addresses"
     * @returns 
     */
    async get_valid_email_addresses() {
        let cmdstr = 'GVEA'
        let resp = await this.safe_client_write(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }





    /**
     * //   "DVCA": "Dump VCard Addresses"
     * @returns 
     */
    async get_valid_email_addresses() {
        let cmdstr = 'DVCA'
        let resp = await this.safe_client_write(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }




    /**
     * 
     * @returns 
     */
    async misc_check() {
        let cmdstr = 'CHEK'
        let resp = await this.safe_client_write(cmdstr)
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
        let resp = await this.safe_client_write(cmdstr)
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
        let resp = await this.safe_client_write(cmdstr)
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
        let resp = await this.safe_client_write(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }

    /**
     * 
     * @returns 
     */
    async floor_listing() {
         let cmdstr = 'LFLR'
         let resp = await this.safe_client_write(cmdstr)
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
        let resp = await this.safe_client_write(cmdstr)
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
        let resp = await this.safe_client_write(cmdstr)
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
        let resp = await this.safe_client_write(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }



    // ---- ---- ---- ---- 

    /**
     * 
     * @param {*} username 
     * @returns 
     */
    async get_bio(username) {
        if ( !bio ) return -2;
        let cmdstr = `RBIO ${username}`
        let resp = await this.safe_client_write(cmdstr)
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
        let resp = await this.safe_client_write(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }

    /**
     * 
     * @returns 
     */
    async terminate_server_now() {
        let cmdstr = 'DOWN'
        let resp = await this.safe_client_write(cmdstr)
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
        let resp = await this.safe_client_write(cmdstr)
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
        let resp = await this.safe_client_write(cmdstr)
        let output = this.handle_generic_response(resp)
        return(output)
    }

    // 
    /**
     * 
     * 
     * 
        0	User name
        1	Password
        2	Flags (see libcitadel.h; US_*)
        3	(empty field)
        4	(empty field)
        5	Access level
        6	User number
        7	Timestamp of last call
        8	Purge time (in days) for this user (or 0 to use system default)
     * 
     * 
     * @param {*} who 
     * @returns 
     */
    async aide_get_user_parameters(who) {
        let cmdstr = `AGUP ${who}`
        let resp = await this.safe_client_write(cmdstr)
        if ( resp.bucket === 2 ) {
            let output =  this.handle_generic_response(resp)
            let fields = output.split('|')
            return new CitadelAideUser(fields)
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
        if ( !(cit_user instanceof CitadelAideUser) ) return -2;
        let cmdstr = `ASUP ${cit_user.fullname}|${cit_user.password}|${cit_user.flags}|`
            cmdstr += `${cit_user.timescalled}|${cit_user.posted}|${cit_user.axlevel}|${cit_user.usernum}|`
            cmdstr += `${cit_user.lastcall}|${cit_user.lastcall}`        
        let resp = await this.safe_client_write(cmdstr)
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
        let resp = await this.safe_client_write(cmdstr)
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
        let resp = await this.safe_client_write(cmdstr)
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
        let resp = await this.safe_client_write(cmdstr)
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
        let resp = await this.safe_client_write(cmdstr)
        this.send_text(bio)
        return(resp.status)
    }
    


    /**
     * 
     * @returns 
     */
    async get_system_config() {
        let cmdstr = `CONF GET`
        let resp = await this.safe_client_write(cmdstr)
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
        let resp = await this.safe_client_write(cmdstr)
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
        let resp = await this.safe_client_write(cmdstr)
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
        let resp = await this.safe_client_write(cmdstr)
        this.send_text(listing)
        return(resp.status)
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
        let resp = await this.safe_client_write(cmdstr)
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
        let resp = await this.safe_client_write(cmdstr)
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
        let resp = await this.safe_client_write(cmdstr)
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
        let resp = await this.safe_client_write(cmdstr)
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
        let resp = await this.safe_client_write(cmdstr)
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
            let resp = await this.safe_client_write(cmdstr,false,true)
            //
            if ( resp.bucket == 2 ) {
                await this.binary_upload(filedata)
            }
            this.unlockWriter()
        }
    }



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
        let resp = await this.safe_client_write(cmdstr)
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
        let resp = await this.safe_client_write(cmdstr)
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
        let resp = await this.safe_client_write(cmdstr)
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
        let resp = await this.safe_client_write(cmdstr)
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
        let resp = await this.safe_client_write(cmdstr)
        //
        if ( resp.bucket == 2 ) {
            let success = await this.binary_upload(filedata)
            this.end_upload(success)
        }
        this.unlockWriter()
    }


    /**
     * 
     * @param {*} bio 
     * @returns 
     */
    async set_bio(bio) {
        if ( !bio ) return -2;
        let cmdstr = 'EBIO'
        let resp = await this.safe_client_write(cmdstr)
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
        let resp = await this.safe_client_write(cmdstr)
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
        let resp = await this.safe_client_write(cmdstr)
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
        let resp = await this.safe_client_write(cmdstr)
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
                let resp = await this.safe_client_write(cmdstr,false,true)
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
        let resp = await this.safe_client_write(cmdstr,false,true)
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
            let part_resp = await this.safe_client_write(cmdstr,false,true)
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
        let resp = await this.safe_client_write(cmdstr,false,true)
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
        let resp = await this.safe_client_write(cmdstr)
        return this.handle_generic_response(resp)
    }







    /**
     * //   "KILL": "Kill (delete) the current root"
     * 
     * @returns 
     */
    async delete_current_root() {
        let cmdstr = 'KILL'
        let resp = await this.safe_client_write(cmdstr)
        return this.handle_generic_response(resp)
    }

    /**
     * //   "ASYN": "enable asynchronous server responses"
     * 
     * @returns 
     */
    async enable_asynchronous_server_responses(state) {
        if ( !state ) state = 0
        else state = 1
        let cmdstr = `ASYN ${state}`
        let resp = await this.safe_client_write(cmdstr)
        return this.handle_generic_response(resp)
    }


    /**
     * //   "GIBR": "Get InBox Rules"
     * 
     * @returns 
     */
    async get_inbox_rules() {
        let cmdstr = 'GIBR'
        let resp = await this.safe_client_write(cmdstr)
        return this.handle_generic_response(resp)
    }


    /**
     * //   "PIBR": "Put InBox Rules"
     * 
     * @returns 
     */
    async put_inbox_rules(new_rules) {
        let cmdstr = 'GIBR'
        let resp = await this.safe_client_write(cmdstr)
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
        let resp = await this.safe_client_write(cmdstr)
        return this.handle_generic_response(resp)
    }


}


module.exports = CitadelClient
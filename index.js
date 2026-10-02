'use strict'

const net = require('net')
const fs = require('fs')
const mime = require('mime/lite')
const strict = require('assert/strict')
//


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
  //
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
  //
  "NEWU" : 94,
  "CREU" : 95,
  "VALI" : 96,
  "QUSR" : 97,
  "LIST" : 98,
  "SETP" : 99,
  "GETU" : 100,
  "SETU" : 101,
  "EBIO" : 102,
  "RBIO" : 103,
  "DLUI" : 104,
  "ULUI" : 105,
  "AGUP" : 106,
  "ASUP" : 107,
  "AGEA" : 108,
  "ASEA" : 109,
  "RENU" : 110,
  "GNUR" : 111,
  "GREG" : 112,
  "REGI" : 113,
  "CHEK" : 114,
  "STEL" : 115,
  "RCHT" : 116
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



class RoomListElement {
    constructor(fields) {
        this.Name = fields[0]
        this.flag = fields[1]
        this.floor = parseInt(fields[2])
        this.list_order = parseInt(fields[3])
        this.acl = parseInt(fields[4])
        this.currrent_view = parseInt(fields[5])
        this.default_view = parseInt(fields[6])
        this.lastchange = parseInt(fields[7])
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
            r_descr[this.room_returned_features[i]] = fields[i]
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


// 1	User number
// 2	Password
// 3	Real name
// 4	Street address or PO Box
// 5	City/town/village/etc.
// 6	State/province/etc.
// 7	ZIP or Postal Code
// 8	Telephone number
// 9	Access level
// 10	Internet e-mail address
// 11	Country


class RVcard {
    constructor(fields) {
        this.number = fields[0]
        this.password = fields[1]
        this.name = fields[2]
        this.address = fields[3]
        this.city = fields[4]
        this.state = fields[5]
        this.postal_code = fields[6]
        this.telephone = fields[7]
        this.axlevel = fields[8]
        this.e_mail_addr = fields[9]
        this.country = fields[10]
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
    constructor(fields,text) {
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
        this.set_text(obj.text)
    }
}



/**
 * 
 */
class CitadelServerInfo {
    constructor(fields) {
        this.session_id = fields[0]      // Your unique session ID on the server
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



const LISTING_FOLLOWS = 1
const OK = 2
const MORE_DATA = 3
const SEND_LISTING = 4
const ERROR = 5
const BINARY_FOLLOWS = 6
const SEND_BINARY = 7
const START_CHAT = 8


const result_code_buckets = {

    1 : {
            "symbol" : "LISTING_FOLLOWS",
            "description" : `
            (LISTING_FOLLOWS) means that after the server response, the server will
            output a listing of some sort.  The client **must** read the listing,
            whether it wants to or not.  The end of the listing is signified by the
            string "000" on a line by itself.`
        },

    2 : {
            "symbol" : "OK",
            "description" : `(OK) means the command executed successfully.`
        },

    3 : {
            "symbol" : "MORE_DATA",
            "description" : `
            (MORE_DATA) means the command executed partially.  Usually this means that
            another command needs to be executed to complete the operation.  For
            example, sending the USER command to log in a user usually results in a
            MORE_DATA result code, because the client needs to execute a PASS command
            to send the password and complete the login.`
        },

    4 : {
            "symbol" : "SEND_LISTING",
            "description" : `
            (SEND_LISTING) is the opposite of LISTING_FOLLOWS.  It means that the
            client should begin sending a listing of some sort.  The client *must*
            send something, even if it is an empty listing.  Again, the listing ends
            with "000" on a line by itself.`
        },

    5:  {
            "symbol" : "ERROR",
            "description" : `(ERROR) means the command did not complete.`
        },

    6 : {
            "symbol" : "BINARY_FOLLOWS",
            "description" : `
            (BINARY_FOLLOWS) means that the client must immediately receive a block of
            binary data.  The first parameter will be the number of bytes to expect.`
        },

    7 : {
            "symbol" : "SEND_BINARY",
            "description" :`
            (SEND_BINARY) means that the client must immediately send a block of
            binary data. The first parameter will always be the number of bytes.`
    },
    8 : {
            "symbol" : "START_CHAT",
            "description" :`
            (START_CHAT) Related to email searching and specified only in the MSGS doc section.`
    }
}


const error_result_code_map = {
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


class ClientOPs {

    constructor() {
        this.port = 504
        this.schedule = []
        this.client = null
        this.nowait = false
        this.restart_agent = null;

        this.uploading = false
        this.downloading = false
        this.binary_data = false
        this.free_download = false

        this.accrue = ''
        this.binary_buffer = false
        this.binary_chunks = []
        this.binary_chunks_total_length = 0
        this.binary_chunks_expected_length = 0
        //
        this.download_promise = null
        this.failed_data = null
        this.section_count = -1
        //
        this.error_stack = []
    }


    add_error_string(e_str) {
        if ( typeof e_str === "string" ) {
            this.add_error({ "error" : e_str.substring("error".length).trim() })
        } else {
            console.log(e_str)
            this.add_error({ "error" : `${e_str}` })
        }
    }

    add_error(e_obj) {
        this.error_stack.unshift(e_obj)
    }

    last_error() {
        return this.error_stack[0]
    }

    clear_errors() {
        this.error_stack = []
    }
    
    get_error_list() {
        return this.error_stack
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



    /**
     * 
     * @param {object} resp 
     * @returns 
     */
    handle_generic_response(resp) {
        if ( resp?.response ) {
            let output = resp.response
            output = output.join(' ')   // putting the line back together after taking the numbers off
            return(output)
        } else {
            return false
        }
    }



    /**
     * 
     * @param {object} resp 
     * @param {number} expected_bucket 
     * @returns 
     */
    response_is_good(resp,expected_bucket = 2) {
        if ( resp.bucket === expected_bucket ) {
            return true
        }
        return false
    }

    /**
     * A response has sent a longer list of data (this is text and so should show up in the next read)
     * 
     * @param {object} resp 
     * @returns 
     */
    listing_follows(resp) {
        return this.response_is_good(resp,LISTING_FOLLOWS)
    }

    /**
     * A response is requesting data to be sent (string data)
     * 
     * @param {object} resp 
     * @returns 
     */
    more_data(resp) {
        return this.response_is_good(resp,MORE_DATA)
    }

    /**
     *  A response is requesting list structured data to be sent (string data)
     * 
     * @param {*} resp 
     * @returns 
     */
    send_listing(resp) {
        return this.response_is_good(resp,SEND_LISTING)
    }

    /**
     * This is an error code -- the connection data handler parses this out calling on promise rejections
     * 
     * @param {object} resp 
     * @returns 
     */
    response_is_error(resp) {
        return this.response_is_good(resp,ERROR)
    }

    /**
     * 
     * A response is about to send binary data that should be stored in a bufffer.
     * This code is used directly in the connection data handler.
     * But, this may be used to discern between data and error in the calling methods.
     * 
     * @param {object} resp 
     * @returns 
     */
    binary_follows(resp) {
        return this.response_is_good(resp,BINARY_FOLLOWS)
    }


    /**
     * 
     * A response is request data to be sent (binary data)
     * 
     * @param {object} resp 
     * @returns 
     */
    send_binary(resp) {
        return this.response_is_good(resp,SEND_BINARY)
    }


    /**
     * 
     * A response is request data to be sent (binary data)
     * 
     * @param {object} resp 
     * @returns 
     */
    start_chat_mode(resp) {
        return this.response_is_good(resp,START_CHAT)
    }



    // more_data(resp)          MORE_DATA
    // send_listing(resp)       SEND_LISTING
    // response_is_error(resp)  ERROR
    // binary_follows(resp)     BINARY_FOLLOWS
    // send_binary(resp)        SEND_BINARY
    // start_chat_mode(resp)         START_CHAT




    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

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
                if( this.binary_data ) {
                    this.binary_chunks.push(data)
                    this.binary_chunks_total_length += data.length
                    if ( this.binary_chunks_expected_length <= this.binary_chunks_total_length ) {
                        this.accrue = Buffer.concat(this.binary_chunks);
                        this.download_promise(this.accrue)
                    }
                } else {
                    let sdata = data.toString()         // this is going to be converted unless it says otherwise...
                    this.accrue += sdata
                    if ( (this.free_download && this.free_download_test(this.accrue)) || this.test_ready(this.accrue) ) {
                        this.download_promise(this.accrue)
                    }
                }
                return;
            }
            let line = data.toString().trim();
            let resp = line.split(' ')
            let status = parseInt(resp.shift())  // this is thet status delivered by citadel (hundreds e.g. 200 or 500)
            let bucket = Math.floor(status/100)  // a status bucket ... essentially the first digit
            if ( (bucket !== 5) ) {
                if ( this.last_writer !== null ) {
                    let data_resolution = this.last_writer
                    if ( bucket === BINARY_FOLLOWS ) {
                        this.binary = true      // going to read it in any case, even if the app cannot handle it
                        this.downloading = true
                        if ( data_resolution.use_binary_switch && (typeof data_resolution.use_binary_switch === 'function') ) {
                            let return_cmd = resp.join(' ').trim()
                            // process the directive before this handler release to the event queue
                            if ( data_resolution.use_binary_switch(return_cmd) ) {
                                return  // the usual state of affairs is below, string data will be returned 
                            }
                        }
                    }
                    if ( data_resolution.resolver ) {
                        data_resolution.resolver({ 'status' : status, 'bucket' : bucket, 'response' : resp })
                    }
                }
            } else { // the 5 bucket is an error
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

//
// going to set binary data
// DLAT
// DLUI
// OPEN
// READ
// OIMG
// DLRI


    /**
     * 
     * @param {string} str 
     * @param {boolean} useDelay 
     * @param {boolean} privileged 
     * @returns 
     */
    clientWrite(str,useDelay = false,privileged = false,use_binary_switch = false) {
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
                    'writer' : () => { this.client.write(`${str}\n`) },
                    'use_binary_switch' : use_binary_switch

                })
                return p
            }

            if ( !useDelay ) {
                if ( this.last_writer !== null || this.waitingDelay ) {
                    // writers are busy; so, queue the request to be handled after the last writer is finished
                    this.schedule.push({ 
                        'resolver' : resolver,
                        'rejector' : rejector, 
                        'writer' : () => { this.client.write(`${str}\n`) },
                        'use_binary_switch' : use_binary_switch
                    })
                } else { // no one is blocking progress so write right now
                    this.last_writer = { 'resolver' : resolver, 'rejector' : rejector, 'writer' : null, 'use_binary_switch' : use_binary_switch }
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


    async safe_client_write(cmdstr,useDelay,privileged,use_binary_switch) {
        try {
            let resp =  await this.clientWrite(cmdstr,useDelay,privileged,use_binary_switch)
            return resp
        } catch ( e ) {
            console.log("safe_client_write: " + e.message)
            return(false)
        }
    }


    /**
     * 
     * @param {*} buffer 
     * @returns 
     */
    binary_write(buffer,to_write) {
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
     * @param {*} buffer 
     * @returns 
     */
    test_ready(buffer) {
        return(this.section_count >= buffer.length)
    }

    free_download_test(buffer) {
        return ( buffer.substring(buffer.length-3) === '000' )
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


    /**
     * 
     * @param {*} count 
     * @returns 
     */
    data_lines_ready() {
        this.free_download = true
        let p = new Promise((resolve,reject) => {
            this.download_promise = (data) => { 
                this.free_download = false
                resolve(data)
            }
            this.failed_data = (data) => {
                this.free_download = false
                reject(false)
            }
        })
        return(p)
    }

    
    // sprintf(cret, "%d|%ld|%s|%s", (int) bytes, last_mod, filename, mimetype);
    /**
     * 
     * 
     * use_binary_switch
     * 
     * @param {*} resp 
     * @param {*} is_binary 
     */
    async process_download_buffer(len) {
        this.binary_data = true
        this.downloading = true
        //
        this.binary_chunks_expected_length = len
        this.binary_chunks = []
        this.binary_chunks_total_length = 0
        //
        let ok = await this.data_ready(amount)
        if ( ok ) {
            let buf = Buffer.concat(this.binary_chunks);
            this.binary_chunks_expected_length = 0
            this.binary_chunks = []
            this.binary_chunks_total_length = 0
            return buf
        }
        return false
       //
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

    // 
    /**
     * 
     * @param {*} text 
     */
    async send_text_and_respond(text) {
        this.lockWriter()
        this.downloading = true
        let p = new Promise((resolve,reject) => {
            this.client.write(`${text}\n000\n`,async (err) => {
                this.uploading = false
                this.unlockWriter()
                if ( !err ) {
                    let data = await this.data_lines_ready()
                    resolve(data)
                } else {
                    reject(err)
                }
            })
        })
    }

}
/**
 * 
 */
class CitadelClient extends ClientOPs {
    // ---- ---- ---- ---- ----
    constructor() {
        super()
        //
        this.roomMap = {}
        this.room_types = [ "LKRA", "LKRN", "LKRO", "LZRM", "LRMS", "LPRM" ]
        this.message_proto = [ "ALL", "OLD", "NEW", "LAST", "FIRST", "GT", "LT", "SEARCH" ]
        this.policy_scope = [ "room", "floor", "site", "mailboxes" ];
        //
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





    // ----------------------------------------------------------------------------------------------

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


//   "NOOP" : 1,
//   "QNOP" : 2,
//   "ECHO" : 3,
//   "TIME" : 4,

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

//   "MESG" : 5,
//   "USER" : 6,
//   "PASS" : 7,
//   "LOUT" : 8,

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
     * MORE_DATA
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



//   "GJWT" : 9,
//   "AJWT" : 10,
//   "IDEN" : 11,
//   "QUIT" : 12,

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
            let output = this.handle_generic_response(resp)
            if ( this.response_is_good(resp) ) {
                let jwt_string = output
                return jwt_string
            }
            this.add_error_string(output)
            return(false)
        } catch (e) {
            console.warn(e)
            return false
        }
    }


    /**
     * 
     * @param {string} jwt_string 
     * @returns 
     */
    unpack_jwt(jwt_string) {
        let [header,payload,signature] = jwt_string.split('.')
        let jwt_obj = {
            header,payload,signature
        }
        let buf = Buffer.from(payload,"base64")
        let decode_payload = buf.toString()
        payload = JSON.parse(decode_payload)
        jwt_obj.payload = payload
        return jwt_obj
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
            if ( this.response_is_good(resp) ) {
                let user_info = output.split('|')
                let user = new CitadelUser(user_info)
                return user
            }
            this.add_error_string(output)
            return(false)
        }
        return false
    }


    /**
     * // IDEN
     * 
     * @param {string} developerid 
     * @param {string} clientid this.handle_generic_response(resp)
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
        if ( this.response_is_good(resp) ) {
            return true
        }
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
        if ( resp && this.response_is_good(resp) ) {
            return true
        } else {
            return false
        }
    }


//   "BIFF" : 13,
//   "RWHO" : 14,
//   "QDIR" : 15,
//   "RBDI" : 16,

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
        let mcounts = {
            "m_count" : 0,
            "im_count" : 0
        }
        let resp =  await this.safe_client_write("BIFF")
        if ( resp && this.response_is_good(resp) ) {
            let output = this.handle_generic_response(resp)
            if ( output !== '0' ) {
                let counts = output.split('|')
                let c0 = counts[0]
                let c1 = counts[1]
                if ( c0 !== undefined )  mcounts.m_count = counts[0]
                if ( c1 !== undefined )  mcounts.im_count = counts[1]
            }
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
        if ( this.listing_follows(resp) ) {
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
        return false // this is not supposed to happen
    }



    /**
     * // QDIR
     * 
     * Applies to logged in users
     * 
     * @param {string} address -- Internet e-mail address to look up
     * @returns {string|boolean}
     */
    async lookup_email_address(address) {
        if ( !address ) return -2;
        let cmdstr = `QDIR ${address}`
        let resp = await this.safe_client_write(cmdstr)
        let output = this.handle_generic_response(resp)
        if ( this.response_is_good(resp) ) {
            return output
        }
        this.add_error_string(output)
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
        if ( this.response_is_good(resp) ) {
            return true
        }
        return(false)
    }


//   "AUTO" : 17,
//   "ISME" : 18,
//   "INFO" : 19,
//   "TERM" : 20,
//   "REQT" : 21,
//   "STLS" : 22,
//   "GTLS" : 23,

    /**
     * // AUTO
     *  returns a list of email addresses
     * @param {string} probe - a string for partial matching
     * @returns {Array}
     */
    async autocomplete(probe) {
        let cmdstr = `AUTO ${probe}`
        let resp = await this.safe_client_write(cmdstr)
        if ( this.listing_follows(resp) ) {
            let lines = this.handle_generic_response(resp)
            if ( lines ) {
                let email_list = lines.split('\n')
                email_list = email_list.filter((line) => {
                    if ( line.trim() === "000" ) return false
                    if ( line.trim() === "try these:" ) return false
                    return true
                })
                return email_list
            }
        } else {
            this.add_error_string(this.handle_generic_response(resp))
        }
        return []
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
        if ( this.response_is_good(resp) ) {
            return true
        }
        this.add_error_string(this.handle_generic_response(resp))
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
        if ( this.listing_follows(resp) ) {
            let info_str = this.handle_generic_response(resp)
            if ( info_str ) {
                let info_list = info_str.split('\n')
                // info_list.shift()        // use this only if the server returns a header line
                info_list.pop()
                return new CitadelServerInfo(info_list)
            }
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
        if ( this.response_is_good(resp) ) {
            return true
        }
        this.add_error_string(this.handle_generic_response(resp))
        return(false)
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
        if ( this.response_is_good(resp) ) {
            return true
        }
        this.add_error_string(this.handle_generic_response(resp))
        return(false)
    }



    /**
     * // STLS": "Start TLS session
     * 
     * action required by client when this method returns true
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
        if ( this.response_is_good(resp) ) {
            return true
        }
        this.add_error_string(this.handle_generic_response(resp))
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
     * 
     * 
            0 | Protocol name, e.g. "SSLv3"
            1 | Cipher suite name, e.g. "ADH-RC4-MD5"
            2 | Cipher strength bits, e.g. 128
            3 | Cipher strength bits actually in use, e.g. 128

     * Fetches the session's TLS parameters that were established with `start_TLS_session`
     * @returns {object|boolean}
     */
    async get_TLS_session() {
        let cmdstr = 'GTLS'
        let resp = await this.safe_client_write(cmdstr)
        if ( this.response_is_good(resp) ) {
            let tls_data = this.handle_generic_response(resp)
            if ( tls_data ) {
                tls_data = this.unpack_tls_data(tls_data)
            }
            return tls_data
        }
        this.add_error_string(this.handle_generic_response(resp))
        return false
    }


//   "ICAL" : 24,
//   "SEXP" : 25,
//   "GEXP" : 26,
//   "DEXP" : 27,


    /**
     * ICAL : 24
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
     * SEND_LISTING
     * LISTING_FOLLOWS
     * 
     * 
     * @param {string} probe 
     * @returns 
     */
    async ical_cmd(cmd_str,listing = false) {
        cmd_str = cmd_str.split('|')
        cmd_str = cmd_str.map(part => part.trim())
        cmd_str = cmd_str.join('|')
        //
        let cmdstr = `ICAL ${cmd_str}`
        let resp = await this.safe_client_write(cmdstr)
        //
        let cmd_parts = cmd_str.split('|')
        let cmd = cmd_parts[0]
        if ( this.response_is_good(resp) ) {
            switch ( cmd ) {
                case "test" : { return true }
                case "respond" : { return true }
                case "handle_rsvp" : { return true }
                case "sgi" : { return true }
            }
        } else if ( this.listing_follows(resp) ) {
            switch ( cmd ) {
                case "conflicts" : {
                    let data = this.handle_generic_response(resp)
                    let events = data.split('\n')
                    return events
                }
                case "freebusy" : {
                    let data = this.handle_generic_response(resp)
                    let events = data.split('\n')
                    return events
                }
                case "getics" : {
                    let data = this.handle_generic_response(resp)
                    let events = data.split('\n')
                    return events
                 }
            }

        } else if ( this.send_listing(resp) ) {
            switch ( cmd ) {
                case "putics" : {
                    if ( listing && (typeof listing === 'string') ) {
                        this.send_text(listing)
                    }
                    return true
                }
            }
        } else {
            this.add_error_string(this.handle_generic_response(resp))
            return false
        }
        return true
    }


    /**
     * 
     * // SEXP
     * 
     *  send text
     * 
     * SEND_LISTING -- under certain conditions
     * 
     * @param {string} username 
     * @param {string} text 
     * @returns 
     */
    async send_instant_message(username,text,hyphen = false) {
        if ( !username ) return -2;
        let cmdstr = ''
        if ( text ) {
            if ( hyphen ) {
                cmdstr = `SEXP ${username}|-`
            } else {
                cmdstr = `SEXP ${username}|${text}`
            }
        } else {
            cmdstr = `SEXP ${username}|`
        }
        let resp = await this.safe_client_write(cmdstr)
        if ( this.response_is_good(resp) ) {
            return true
        } else if ( this.send_listing(resp) ) {
            this.send_text(text)
            return true
        }
        this.add_error_string(this.handle_generic_response(resp))
        return false
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
        if ( this.listing_follows(resp) ) {
            let output = this.handle_generic_response(resp)
            let par_lines = output.split('\n')
            let parameters = par_lines.shift()?.split('|')
            if ( parameters ) {
                return(new CitadelInstantMessage(parameters,par_lines.join("\n")))
            }
            return true
        }
        this.add_error_string(this.handle_generic_response(resp))
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
        if ( this.response_is_good(resp) ) {
            return true
        }
        this.add_error_string(this.handle_generic_response(resp))
        return false
    }


    // ROOM DATA OPS START HERE

//   "GOTO" : 28,
//   "STAT" : 29,


    /**
     *  // GOTO" : 28
     *  // GOTO
     * 
     * @param {string} room 
     * @returns 
     */
    async goto_room(room) {
        let cmdstr = "GOTO " + room
        let resp =  await this.safe_client_write(cmdstr)
        if ( this.response_is_good(resp) ) {
            let output = this.handle_generic_response(resp)
            let room_descr = this.unpack_room_info(output)
            return(room_descr)
        }
        this.add_error_string(this.handle_generic_response(resp))
        return false
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
        if ( this.response_is_good(resp) ) {
            let output = this.handle_generic_response(resp)
            let room_descr = this.unpack_room_info(output)
            return(room_descr)
        }
        this.add_error_string(this.handle_generic_response(resp))
        return false
    }



    /**
     * // STAT : 29
     * // STAT : "Get mtime of the current root"
     * 
     * @returns 
     */
    async get_root_mtime() {
        let cmdstr = 'STAT'
        let resp = await this.safe_client_write(cmdstr)
        if ( this.response_is_good(resp) ) {
            let room_stat = this.handle_generic_response(resp)
            room_stat = room_stat.split('|')
            room_stat = {
                "name" : room_stat[0],
                "mod_time" : room_stat[1]
            }
            return room_stat
        }
        this.add_error_string(this.handle_generic_response(resp))
        return false
    }


//   "MSGS" : 30,
//   "MARK" : 31,
//   "SLRP" : 32,


    /**
     *  MSGS : 30
     *  // MSGS
     * 
     * (not yet tested)
     * @param {string} which 
     * @param {any} whicharg - depedning on the first parameter, this may be a number or a string
     * @param {boolean} mtemplate -- optional -- if true, requires interaction
     * @returns {Array|-2} 
     */
    async get_messages(which,whicharg,mtemplate = false) {
        //
        if ( (!which) || this.message_proto.indexOf(which) < 0 ) which = "ALL"
        //
        //  "ALL", "OLD", "NEW", "LAST", "FIRST", "GT", "LT", "SEARCH"
        let messages = []
        let output = null
        let cmdstr = ''
        switch ( which ) {
            case "ALL":
            case "OLD": 
            case "NEW": {
                let special_headers = (mtemplate) ? 1 : 0
                cmdstr = `MSGS ${which}||${special_headers}`
                break;
            }
            case "GT":
            case "LT": {
                if ( whicharg === undefined ) whicharg = 0
                if ( typeof whicharg === "string" ) {
                    whicharg = parseInt(whicharg)
                    if ( whicharg === NaN ) return -2
                }
                let special_headers = (mtemplate) ? 1 : 0
                cmdstr = `MSGS ${which}|${whicharg}|${special_headers}`
                break;
            }
            case "SEARCH" : {
                let search_str = (whicharg) ? whicharg : ''
                if ( Array.isArray(search_str) ) search_str = search_str.join('|')
                cmdstr = `MSGS SEARCH|0|${search_str}`
                break;
            }
        }
        //
        let resp = await this.safe_client_write(cmdstr)
        if ( this.listing_follows(resp) ) {
            output = this.handle_generic_response(resp)
            messages = output.split('\n')
            messages.shift()
            messages.pop()
        } else if ( this.start_chat_mode(resp) ) {
            if ( typeof mtemplate === 'string' ) {
                try {
                    let data_lines = await this.send_text_and_respond(mtemplate)
                    if ( typeof data_lines === 'string' ) {
                        messages = output.split('\n')
                        messages.pop()
                    }
                } catch (e) {
                    return false
                }
            }
        }
        return(messages)
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
        if ( this.response_is_good(resp) ) {
            return(true)
        }
        this.add_error_string(this.handle_generic_response(resp))
        return false
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
        if ( this.response_is_good(resp) ) {
            return(true)
        }
        this.add_error_string(this.handle_generic_response(resp))
        return false
    }


//   "GTSN" : 33,
//   "VIEW" : 34,
//   "SRCH" : 35,
//   "EUID" : 36,
//   "DELE" : 37,
//   "MOVE" : 38,
//   "EMSG" : 39,

    /**
     * 
     * // GTSN 33        let output = this.handle_generic_response(resp)
        return(output)

     * > Fetch seen/unread message flags
     * 
     * @returns 
     */
    async fetch_unread_messages() {
        let cmdstr = `GTSN`
        let resp =  await this.safe_client_write(cmdstr)
        if ( this.response_is_good(resp) ) {
            let data = this.handle_generic_response(resp)
            return(data)
        }
        this.add_error_string(this.handle_generic_response(resp))
        return false
    }
 

    /**
     * 
     * // VIEW 34
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
                view_type = this.PERSONAL_ROOM
                break
            }
        }
        let cmdstr = `VIEW ${view_type}`
        let resp =  await this.safe_client_write(cmdstr)
        if ( this.response_is_good(resp) ) {
            return(true)
        }
        this.add_error_string(this.handle_generic_response(resp))
        return false
    }
 

    /**
     * 
     * // SRCH 35
     * > Full text search
     * 
     * SRCH s(deprecated...)
     * usings MSGS search
     * 
     * @returns 
     */
    async full_text_search(search_pattern) {
        return await this.get_messages("search",search_pattern,false)
        //
        // let cmdstr = `SRCH ${search_pattern}`
        // let resp =  await this.safe_client_write(cmdstr)
        // if ( this.response_is_good(resp) ) {
        //     return(true)
        // }
        // this.add_error_string(this.handle_generic_response(resp))
        // return false
    }


    /**
     *  // EUID : 36
     *  // EUID exclusive message ID
     * 
     * @param {string} its_euid 
     * @returns {number}
     */
    async get_message_by_exclusive_id(its_euid) {
        let cmdstr = `EUID ${its_euid}`
        let resp =  await this.safe_client_write(cmdstr)
        if ( this.response_is_good(resp) ) {
            let output = this.handle_generic_response(resp)  // will retun the message number
            output = parseInt(output)
            return(output)
        }
        this.add_error_string(this.handle_generic_response(resp))
        return false
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
        if ( this.response_is_good(resp) ) {
            return(true)
        }
        this.add_error_string(this.handle_generic_response(resp))
        return false
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
        if ( this.response_is_good(resp) ) {
            return(true)
        }
        this.add_error_string(this.handle_generic_response(resp))
        return false
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
        if ( this.response_is_good(resp) ) {
            return(true)
        }
        this.add_error_string(this.handle_generic_response(resp))
        return false
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
        if ( this.response_is_good(resp) ) {
            return(true)
        }
        this.add_error_string(this.handle_generic_response(resp))
        return false
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
        if ( this.response_is_good(resp) ) {
            return(true)
        }
        this.add_error_string(this.handle_generic_response(resp))
        return false
    }


    /**
     * 
     * // EMSG
     * 
     * 
     * Install system messages 
     * @param {string} filename 
     * @param {string} text 
     * @returns {boolean}
     */
    async enter_system_message(filename,text) {
        if ( !filename ) return -2;
        let cmdstr = `EMSG ${filename}`
        let resp = await this.safe_client_write(cmdstr)
        if ( this.send_listing(resp) ) {
            this.send_text(text)
            return true
        }
        return(false)
    }


// "ENT0" : 40,

    //
    // ENTER A MESSAGE INTO THE SYSTEM
    //
    // ENT0 -- this its own beast and can put up posts or send emails

    /**
     * // ENT0
     * > check to see if it is ok to post a message
     * 
     * SEND_LISTING
     * START_CHAT_MODE
     * 
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
        if ( this.response_is_good(resp) ) {
            return(true)
        }
        this.add_error_string(this.handle_generic_response(resp))
        return false
    }

    

    /**
     * // ENT0
     * > acually post a message. Perhaps, send an email to someone via SMTP
     * 
     * 
     * 
     * confirmation message:
``` 
        Line 1:	The new message number on the server for the message.  It will be
            positive for a real message number, or negative to denote that an
            error occurred.  If an error occurred, the message was not saved.
        Line 2:	A human-readable confirmation or error message.
        Line 3:	The resulting Exclusive UID of the message, if present. (More may
            be added to this in the future, so do not assume that there will
            only be these lines output.  Keep reading until 000 is received.)
```
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
        if ( this.response_is_good(resp) ) {
            let email_update = this.handle_generic_response(resp)
            return email_update
        } else if ( this.send_listing(resp) ) {
            let text = msgObject.text;
            text = text.trim()
            text = shortLines(text)
            let output = await this.send_text(text)  // clientWrite nowait
            return(output)
        } else if ( this.start_chat_mode(resp) ) {
            try {
                let text = msgObject.text;
                text = text.trim()
                text = shortLines(text)
                let confirmation_msg = await this.send_text_and_respond(text)
                if ( typeof confirmation_msg === 'string' ) {
                    confirmation_msg = confirmation_msg.split('\n')
                    confirmation_msg.pop()
                    return confirmation_msg   // as an array of lines
                }
            } catch (e) {
                return false
            }
        }
        this.add_error_string(this.handle_generic_response(resp))
        return false
    }


// "GVSN" : 41,
// "GVEA" : 42,
// "DVCA" : 43,

    /**
     * //   "GVSN": "Get Valid Screen Names
     * 
     * 
     * @returns {Array}
     */
    async get_valid_screen_names() {
        let cmdstr = 'GVSN'
        let resp = await this.safe_client_write(cmdstr)
        if ( this.listing_follows(resp) ) {
            let output = this.handle_generic_response(resp)
            let names = output.split('\n')
            // names.shift()
            return(names)
        }
        this.add_error_string(this.handle_generic_response(resp))
        return false
    }


    /**
     * //   "GVEA": "Get Valid Email Addresses"
     * 
     * @returns {Array}
     */
    async get_valid_email_addresses() {
        let cmdstr = 'GVEA'
        let resp = await this.safe_client_write(cmdstr)
        let output = this.handle_generic_response(resp)
        if ( this.listing_follows(resp) ) {
            let addresses = output.split('\n')
            // addresses.shift()
            return(addresses)
        }
        this.add_error_string(this.handle_generic_response(resp))
        return false
    }


    /**
     * //   "DVCA": "Dump VCard Addresses"
     * 
     * @returns {Array}
     */
    async get_valid_email_addresses() {
        let cmdstr = 'DVCA'
        let resp = await this.safe_client_write(cmdstr)
        let output = this.handle_generic_response(resp)
        if ( this.listing_follows(resp) ) {
            let vcard_addrs = output.split('\n')
            // vcard_addrs.shift()
            return(vcard_addrs)
        }
        this.add_error_string(this.handle_generic_response(resp))
        return false
    }




// read single message
// "MSG0" : 44,         // need a method that returns an object determined by message format
// "MSG2" : 45,
// "MSG4" : 46,


    message_to_object(mlines) {
        return {
            "orig_lines" : mlines
        }
    }


    /**
     * // MSG0 :: ctdlproto/serv_messages.c: "Output a message in plain text format"
     * @returns 
     */
    async get_message_plain_text(msgnum,headers_only) {
        if ( headers_only === undefined ) headers_only = 0
        let cmdstr = `MSG0 ${msgnum}|${headers_only}` // 
        let resp =  await this.safe_client_write(cmdstr)
        if ( this.listing_follows(resp) ) {
            let msg_txt = this.handle_generic_response(resp)
            if ( msg_txt ) {
                let msg_lines = msg_txt.split('\n')
                return this.message_to_object(msg_lines)
            }
        }
        this.add_error_string(this.handle_generic_response(resp))
        return false
    }


    /**
     * 
     * // MSG2 :: ctdlproto/serv_messages.c: "Output a message in RFC822 format"
     * 
     * @returns 
     */
    async get_message_RFC822(msgnum,headers_only) {
        if ( headers_only === undefined ) headers_only = 0
        let cmdstr = `MSG2 ${msgnum}|${headers_only}` // 
        let resp =  await this.safe_client_write(cmdstr)
        if ( this.listing_follows(resp) ) {
            let msg_txt = this.handle_generic_response(resp)
            if ( msg_txt ) {
                let msg_lines = msg_txt.split('\n')
                // MESSAGE PARSING
                // msg_lines should be parsed in order to get the header lines
                return msg_lines
            }
        }
        this.add_error_string(this.handle_generic_response(resp))
        return false
    }


    /**
     * 
     * // MSG4 :: ctdlproto/serv_messages.c: "Output a message in the client's preferred format"
     * 
     *
     * @returns 
     */
    async get_message_MIME_content_types(msgnum,section_token) {
        if ( section_token === undefined ) section_token = 0
        let cmdstr = `MSG4 ${msgnum}|${section_token}` // 
        let resp =  await this.safe_client_write(cmdstr)
        if ( this.listing_follows(resp) ) {
            let msg_txt = this.handle_generic_response(resp)
            if ( msg_txt ) {
                let msg_lines = msg_txt.split('\n')
                // MESSAGE PARSING
                // msg_lines should be parsed in order to get the header lines
                return msg_lines
            }
        }
        this.add_error_string(this.handle_generic_response(resp))
        return false
    }


// mime related
// "MSGP" : 47, -- text/html|text/plain -- dont_decode

    /**
     * 
     * // MSGP 
     *      :: ctdlproto/serv_messages.c: "Select preferred format for MSG4 output"
     * 
     * This command sets a parameter for use by another command.
     * The format_prefs is usually a string
     * The format_prefs can be an array of formats.
     * 
     * @param {string|Array} format_prefs -- a list of preferred formats or "dont_decode"
     * @returns {string} --  OK
     */
    async get_message_preferred_format(format_prefs ="dont_decode") {
        if ( Array.isArray(format_prefs) ) {
            format_prefs = format_prefs.join('|')
        }
        let cmdstr = `MSGP ${format_prefs}`
        let resp =  await this.safe_client_write(cmdstr)
        if ( this.response_is_good(resp) ) {
            return true
        }
        return false // should never happen
    }

// "OPNA" : 48,

    /**
     * 
     * // OPNA :: ctdlproto/serv_messages.c: "Open an attachment for download"
     * 
     * Deprecated -- throws warning
     *
     * @returns 
     */
    async get_message_attachment(msgnum,section_token) {
        console.warn("get_message_attachment is not in use:: citadel OPNA is deprecated. Use: download_message_attachment")
    }


// "DLAT" : 49

    /**
     * DLAT
     * 
     * works like READ (almost the same except parameters)
     * 
     * BINARY_FOLLOWS
     * 
     * -- 6XX length|-1|filename|content-type|charset
     * 
     * @param {number} msgnum 
     * @param {string} part 
     * @returns {object}
     */
    async attachment_download(msgnum,part) {
        if ( !msgnum ) return(-2)
        if ( !part ) return(-2)
        let cmdstr = `DLAT ${msgnum}|${part}`
        let resp = await this.safe_client_write(cmdstr)
        if ( this.binary_follows(resp) ) {
            let data = this.handle_generic_response(resp)
            if ( data ) {
                // use_binary_switch
                let [len, stat, filename, content_type, charset ] = data.split('|')
                let buffer = await this.process_download_buffer(len)
                return {buffer, len, stat, filename, content_type, charset}
            }
        }

        this.add_error_string(this.handle_generic_response(resp))
        return false
    }




//   "WIKI" : 50,
    /**
     * //   "WIKI": "Commands related to Wiki management"
     * 
     * WIKI history|(pagename)
     * 
```
position 0:	The version number of the edit
position 1:	Timestamp of the edit
position 2:	Name of the user who performed the edit
```
     * 
     * WIKI rev|(pagename)|(version_number)|(operation)
     * 
```
"showrev" - fetches the specified version of the specified message.  Its
output wll be identical to that of a MSG2 command.

"revert" - actually makes that revision the current one.  It returns OK
OK followed by a message number.
```
         if cmd_str is "revert" this method returns an object with one field, `msg_number`, the number of the revision
         if cmd_str is "showrev" this returns the message text 
         if cmd_str is "history" this returns an array of info objects each array element describing a revion

     * 
     * @param {string} cmd_str --
     * @param {string} pagename 
     * @param {string} rev 
     * @param {string} operation 
     * @returns {Array|object|false} -- 
     */
    async manage_wiki(cmd_str,pagename,rev,operation) {
        let cmdstr = ""
        if ( cmd_str === "history" ) {
             cmdstr = `WIKI ${cmd_str}|${pagename}`
        } else {
            if ( ["showrev", "revert"].includes(operation) ) {
                cmdstr = `WIKI ${cmd_str}|${pagename}|${rev}|${operation}`
            } else return false
        }
        let resp = await this.safe_client_write(cmdstr)
        let data = this.handle_generic_response(resp)
        if ( this.response_is_good(resp) ) {
            if ( data ) {
                if ( operation === "revert" ) {
                    data = data.split(" ")[1]
                    return {
                        "msg_number" : data
                    }
                } else if ( operation === "showrev" ) {
                    if ( data ) {
                        // could add header info by parsing the lines
                        return {
                            "msg_txt" : data
                        }
                    }
                }
            }
        } else if ( this.listing_follows(resp) ) {
            let listings = data.split('\n')
            let revs_info_list = listings.map((line) => {
                let parts = line.split('|')
                let [version, timestamp, editor] = parts
                return {version, timestamp, editor}
            })
            return revs_info_list
        }
        //
        this.add_error_string(data)
        return false
    }


    // floors

//   "LFLR" : 51,
//   "CFLR" : 52,
//   "KFLR" : 53,
//   "EFLR" : 54,


    /**
     * // LFLR
     * 
     * @returns 
     */
    async list_floors() {
        let resp =  await this.safe_client_write("LFLR")
        if ( this.listing_follows(resp) ) {
            let output = this.handle_generic_response(resp)
            let floors = output.split('\n')
            //floors.shift()
            return(floors)
        }
        this.add_error_string(this.handle_generic_response(resp))
        return false
    }

    /**
     * // CFLR
     * 
     * @param {string} name 
     * @param {boolean} for_real if true then really create the floor (or try); otherwise, check permission
     * @returns {object}
     */
    async create_floor(name,for_real = true) {
        if ( !name ) return -2;
        let cmdstr = `CFLR ${name}|${for_real ? 1 : 0}`
        let resp = await this.safe_client_write(cmdstr)
        let output = this.handle_generic_response(resp)
        if ( this.response_is_good(resp) ) {
            let floor_num = output.substring(2).trim()
            return { "floor" : name, "number" : floor_num }
        }
        this.add_error_string(output)
        return(false)
    }


    /**
     * // KFLR
     * @param {number} floornum 
     * @param {boolean} for_real if true then really create the floor (or try); otherwise, check permission
     * @returns {object}
     */
    async delete_floor(floornum,for_real) {
        if (floornum < 0) return -1;
        let cmdstr = `KFLR ${floornum}|${for_real ? 1 : 0}`
        let resp = await this.safe_client_write(cmdstr)
        let output = this.handle_generic_response(resp)
        if ( this.response_is_good(resp) ) {
            return true
        }
        this.add_error_string(output)
        return(false)
    }


    /**
     * // EFLR
     * 
     * @param {number} floornum 
     * @param {string} floorname 
     * @returns {object}
     */
    async edit_floor(floornum,floorname) {
        if ( !floorname ) return -2;
        if ( floornum < 0 ) return -1;
        let cmdstr = `EFLR ${floornum}|${floorname}`
        let resp = await this.safe_client_write(cmdstr)
        let output = this.handle_generic_response(resp)
        if ( output === "OK" ) {
            return true
        }
        this.add_error_string(output)
        return(false)
    }


    // room list commands 
        // 0	NAME		Actual name of this room; may include '\' to separate trese
        // 1	FLAG		Flags for this room (one per bit, from the QR_ flags listed below)
        // 2	FLOOR		The number of the floor on which this room resides.
        // 3	LISTORDER	Listing order (the client can voluntarily sort the list this way)
        // 4	ACL		    Flags for this room (one per bit, from the QR2_ flags listed below)
        // 5	CURVIEW		the currently configured "view" for this room
        // 6	DEFVIEW		the default "view" for this room
        // 7	LASTCHANGE	date/time stamp of the last write to this room

/**
 * 
*/
// class RoomListElement{
//     constructor(fields) {
//         this.Name = fields[0]
//         this.flag = fields[1]
//         this.floor = parseInt(fields[2])
//         this.list_order = parseInt(fields[3])
//         this.acl = parseInt(fields[4])
//         this.currrent_view = parseInt(fields[5])
//         this.default_view = parseInt(fields[6])
//         this.lastchange = parseInt(fields[7])
//     }
// }



//   "LKRN" : 55,
//   "LKRO" : 56,
//   "LZRM" : 57,
//   "LKRA" : 58,
//   "LRMS" : 59,
//   "LPRM" : 60,


    /**
     * // LKRN
     * 
     * @param {number} floornum 
     * @param {string} floorname 
     * @returns {object}
     */
    async list_rooms(by_type) {
        let cmdstr = by_type
        let resp = await this.safe_client_write(cmdstr)
        let output = this.handle_generic_response(resp)
        if ( this.listing_follows(resp) ) {
            let lines = output.split('\n')
            let room_list = lines.map((line) => {
                let line_parts = line.split('|')
                let room = new RoomListElement(line_parts)
                return room
            })
            return room_list
        }
        this.add_error_string(output)
        return(false)
    }



    async list_all_known_rooms_with_new_messages() {
        return await this.list_rooms(`LKRN`)
    }

    async list_all_rooms_with_old_messages() {
        return await this.list_rooms(`LKRO`)
    }

    async list_all_zapped_rooms() {
        return await this.list_rooms(`LZRM`)
    }

    async list_all_known_rooms() {
        return await this.list_rooms(`LKRA`)
    }

    async list_all_accessible_rooms() {
        return await this.list_rooms(`LRMS`)
    }

//   "LPRM" : 60,
    async list_all_public_rooms() {
        return await this.list_rooms(`LPRM`)
    }
    

//   "RDIR" : 61,
//   "GETR" : 62,
//   "SETR" : 63,
//   "RINF" : 64,
//   "GETA" : 65,
//   "SETA" : 66,
//   "KILL" : 67,

    // room manipulation commands
    // RDIR     -- a filename, the length of the file, and a description
    // a filename, the length of the file, and a description.

    /**
     * 
     */
    async read_directory(by_type) {
        let cmdstr = 'RDIR'
        let resp = await this.safe_client_write(cmdstr)
        let output = this.handle_generic_response(resp)
        if ( this.listing_follows(resp ) ) {
            let lines = output.split('\n')
            let dir_list = lines.map((line) => {
                let line_parts = line.split('|')
                let dir =  {
                    "file" : {
                        "name" : line_parts[0].trim(),
                        "length" : line_parts[1].trim(),
                    },
                    "description" : line_parts[2].trim()
                }
                return dir
            })
            return dir_list
        }
        this.add_error_string(output)
        return(false)
    }


    
    /**
     * // GETR
     * @returns {RoomDescriptor}
     */
    async get_room_attributes() {
        let resp =  await this.safe_client_write("GETR")
        if ( this.response_is_good(resp) ) {
            let output =  this.handle_generic_response(resp)
            let fields = output.split('|')
            return new RoomDescriptor(fields)
        }
        this.add_error_string(this.handle_generic_response(resp))
        return false
    }


    /**
     * // SETR
     * @param {object} roomDescr  -- RoomDescriptor
     * @param {boolean} forget 
     * @returns 
     */
    async set_room_attributes(roomDescr,forget) {
        let cmdstr = `SETR ${roomDescr.QRname}|${roomDescr.QRpasswd}|${roomDescr.QRdirname}|`
            cmdstr += `${roomDescr.QRflags}|${forget ? 1 : 0 }|${roomDescr.QRfloor}|${roomDescr.QRorder}|`
            cmdstr += `${roomDescr.QRdefaultview}|${roomDescr.QRflags2}`
        let resp = await this.safe_client_write(cmdstr)
        if ( this.response_is_good(resp) ) {
            return true
        }
        this.add_error_string(this.handle_generic_response(resp))
        return false
    }


    /**
     * // RINF : 64,
     *  (see MSG0)
     * @returns 
     */
    async room_info() {
        let cmdstr = "RINF"
        let resp = await this.safe_client_write(cmdstr)
        let output = this.handle_generic_response(resp)
        if ( this.listing_follows(resp) ) {
            let msg_lines = output.split('\n')
            return message_to_object(msg_lines)     // fix for MSG0
        }
        this.add_error_string(output)
        return false
    }


//   "GETA" : 65,
//   "SETA" : 66,


    /**
     * // GETA : 65,
     * 
     * @returns {string|boolean}
     */
    async get_room_admin() {
        let cmdstr = "GETA"
        let resp = await this.safe_client_write(cmdstr)
        let output = this.handle_generic_response(resp)
        if ( this.response_is_good(resp) ) {
            return output  // room admin
        }
        this.add_error_string(output)
        return false
    }


    /**
     * //   "SETA" :: ctdlproto/serv_rooms.c: "Set the room admin for this room"
     * 
     * @returns {true|error}
     */
    async set_room_admin(administator) {
        let cmdstr = `SETA ${administator}`
        let resp = await this.safe_client_write(cmdstr)
        let output = this.handle_generic_response(resp)
        if ( this.response_is_good(resp) ) {
            return true
        }
        this.add_error_string(output)
        return(false)
    }



    /**
     * // KILL : 67,
     * //           "Kill (delete) the current root"
     * 
     * @returns 
     */
    async delete_current_room() {
        let cmdstr = 'KILL'
        let resp = await this.safe_client_write(cmdstr)
        let output = this.handle_generic_response(resp)
        if ( this.response_is_good(resp) ) {
            return true
        }
        this.add_error_string(output)
        return(false)
    }

    
//   "CRE8" : 68,
//   "FORG" : 69,

    /**
     * 
     * // CRE8 : 68
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
            if ( this.response_is_good(resp) ) {
                return true
            }
            this.add_error_string(output)
            return(false)
        } catch (e) {
            console.warn(e.message)
        }
        return(false)
    }


    /**
     * // CRE8 : 68
     * 
     * @param {string} roomname 
     * @param {string} floor 
     * @param {string} password 
     * @returns 
     */
    async createPasswordRoom(roomname,floor,password) {
        let cmd = `CRE8 1|${roomname}|3|${password}|${floor}`
        let resp =  await this.safe_client_write(cmd)
        if ( this.response_is_good(resp) ) {
            return true
        }
        this.add_error_string(this.handle_generic_response(resp))
        return(false)
    }



    /**
     * // FORG
     * @returns 
     */
    async forget_room() {
        let cmdstr = "FORG"
        let resp = await this.safe_client_write(cmdstr)
        let output = this.handle_generic_response(resp)
        if ( this.response_is_good(resp) ) {
            return true
        }
        this.add_error_string(output)
        return(false)
    }


/**
 * 
        let output = this.handle_generic_response(resp)
        if ( this.response_is_good(resp) ) {
            return true
        }
        this.add_error_string(output)
        return(false)

 */

//   "EINF" : 70,
//   "INVT" : 71,
//   "WHOK" : 72,
//   "KICK" : 73,



    /**
     * // EINF
     * 
     * SEND_LISTING
     * 
     * 
     * @param {boolean} for_real 
     * @returns 
     */
    async set_room_info(for_real,listing_info) {
        let cmdstr = `EINF ${for_real ? '1' : '2'}`
        let resp = await this.safe_client_write(cmdstr)
        if ( this.send_listing(resp) ) {
            await this.send_text(listing_info)
            return true
        }
        this.add_error_string(this.handle_generic_response(resp))
        return(false)
    }



    /**
     * 
     * @param {string} username 
     * @returns 
     */
    async invite_user_to_room(username) {
        let cmdstr = "INVT " + username
        let resp = await this.safe_client_write(cmdstr)
        let output = this.handle_generic_response(resp)
        if ( this.response_is_good(resp) ) {
            return true
        }
        this.add_error_string(output)
        return(false)
    }


    /**
     * 
     * @returns {Array|false}
     */
    async who_knows_room(all_q) {
        let resp =  all_q ? await this.safe_client_write("WHOK ALL") : await this.safe_client_write("WHOK")
        let output = this.handle_generic_response(resp)
        if ( this.listing_follows(resp) ) {
            let lines = output.split('\n')
            if ( all_q ) {
                return lines
            } else {
                let user_knows_room = lines.map((line) => {
                    let [user,knows] = line.split('|')
                    return { user, knows }
                })
                return user_knows_room
            }
        }
        this.add_error_string(output)
        return(false)
    }



    /**
     * // KICK : 73
     * 
     */
    async kickout_user_from_room(username) {
        let cmdstr = "KICK " + username
        let resp = await this.safe_client_write(cmdstr)
        if ( this.response_is_good(resp) ) {
            return true
        }
        this.add_error_string(this.handle_generic_response(resp))
        return(false)
    }



    // room's file directory

//   "DELF" : 74,
//   "MOVF" : 75,

    // download/upload ...

//   "OPEN" : 76,
//   "CLOS" : 77,
//   "READ" : 78,
//   "UOPN" : 79,
//   "UCLS" : 80,
//   "WRIT" : 81,
//   "UIMG" : 82,
//   "OIMG" : 83,
//   "DLRI" : 84,
//   "ULRI" : 85,


    /**
     * // DELF : 74
     * 
     * @param {*} filename 
     * @returns 
     */
    async delete_file(filename) {
        if (!filename) return -2;
        let cmdstr = `DELF ${filename}`
        let resp = await this.safe_client_write(cmdstr)
        if ( this.response_is_good(resp) ) {
            return true
        }
        this.add_error_string(this.handle_generic_response(resp))
        return(false)
    }

    /**
     * 
     * // MOVF : 75
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
        if ( this.response_is_good(resp) ) {
            return true
        }
        this.add_error_string(this.handle_generic_response(resp))
        return(false)
    }


    // OPEN, CLOS, READ (download data)
    /**
     * 
     * OPEN : 76,
     * 
     *
```
If the file is successfully opened, OK will be returned, along with the size (in
bytes) of the file, the time of last modification (if applicable), the filename
(if known), and the MIME type of the file (if known).
```
     * 
     * @param {string} filename 
     * @returns {boolean|object} -- The object will contain information necessary for obtaining the right sized data
     */
    async file_download_open(filename) {
        if ( !filename ) return(-2)
        let cmdstr = `OPEN ${filename}`
        let resp = await this.safe_client_write(cmdstr)
        if ( this.response_is_good(resp) ) {
            let data = this.handle_generic_response(resp)
            let [size,mod_time,filename,mime_type] = data.split('|')
            return {size,mod_time,filename,mime_type}
        }
        this.add_error_string(this.handle_generic_response(resp))
        return(false)
    }

    /**
     * 
     * // CLOS : 77,
     * 
     */
    async end_download() {
        let cmdstr = `CLOS`
        let resp = await this.safe_client_write(cmdstr,false,true)
        this.downloading = false
        if ( this.response_is_good(resp) ) {
            return true
        }
        this.add_error_string(this.handle_generic_response(resp))
        return(false)
    }

    

    // sprintf(cret, "%d|%ld|%s|%s", (int) bytes, last_mod, filename, mimetype);
    /**
     * READ : 78
     * 
     *  -- do the binary write that others request -- OPEN, OIMG
     * 
     * process_download_buffer -- should be setup in the connect data handler
     * 
     * use_binary_switch  -- need to set this up
     * 
     * {size,mod_time,filename,mime_type}
     * 
     * @returns {object|false} -- if an object is returned, it will have a buffer field
     */

    /**
     * 
     * @param {number} offset 
     * @param {number} size 
     * @returns 
     */
    async process_download(offset,size) {
        let cmdstr = `READ ${offset}|${size}`
        let resp = await this.safe_client_write(cmdstr,false,true)
        if ( this.binary_follows(resp) ) {
            let numstr = this.handle_generic_response(resp)
            let len = parseInt(numstr)
            // use_binary_switch
            let buffer = await this.process_download_buffer(len)
            return {buffer,size}
        }
        this.add_error_string(this.handle_generic_response(resp))
        return(false)
    }
    // UOPN UCLS WRIT  (upload data)

    // UOPN UCLS WRIT  (upload data)

    /**
     * 
     * UOPN : 79
     * 
     * @param {string} save_as -- a file name
     * @param {comment} comment -- about the file
     * @param {string} path  -- the local file path
     * @returns {Buffer|boolean}
     */
    async open_file_upload(save_as,comment,path) {
        if (!save_as) return -1;
        if (!comment) return -1;
        if (!path) return -1;
        let mimetype = this.approximate_mime_type(path)
        let filedata = this.read_file(path)
        if ( filedata ) {
            let cmdstr = `UOPN ${save_as}|${mimetype}|${comment}`
            let resp = await this.safe_client_write(cmdstr,false,true)
            if ( this.response_is_good(resp) ) {
                return file_data    // file read from disk here
            }
            this.add_error_string(this.handle_generic_response(resp))
            return false
        }
    }


    /**
     * // UCLS : 80
     * @param {boolean} discard 
     * @returns 
     */
    async end_upload(discard) {
        let cmdstr = `UCLS ${discard ? 1 : 0}`
        let resp = await this.safe_client_write(cmdstr,false,true)
        if ( this.response_is_good(resp) ) {
            return true
        }
        this.add_error_string(this.handle_generic_response(resp))
        return(false)
    }
    //  //  //




    /**
     * // WRIT : 81
     * 
     * SEND_BINARY  -- do the binary write that others request -- UOPN, UIMG
     * 
     * @param {buffer} filedata 
     * @returns 
     */
    async binary_upload(filedata) {
        let dlen = filedata.length
        let offset = 0
        const writeBuf = Buffer.allocUnsafe(4096);
        let status = false
        try {
            while ( offset < dlen ) {
                let to_write = Math.min(4096,(dlen - offset))
                let cmdstr = `WRIT ${to_write}`     // each time it sends more to the file open for upload
                let resp = await this.safe_client_write(cmdstr,false,true)
                if ( this.send_binary(resp) ) {
                    let numstr = this.handle_generic_response(resp)
                    to_write = parseInt(numstr)
                    filedata.copy(writeBuf,0,offset,offset + to_write)  // copies to_write bytes starting at offset to the start of writeBuf
                    offset += to_write
                    await this.binary_write(writeBuf,to_write)
                }
            }
            status = true
        } catch (err) {
            //
        }
        //
        return status
    }


    // UIMG OIMG WRIT  (upload data)

    /**
     * // UIMG : 82
     * 
     * after use WRIT
     * 
     * if for real and this returns file data, 
     * then client should imediately call binary_upload(filedata) followed by end_upload(discard)
     * binary_upload == WRIT
     * 
     * @param {boolean} for_real 
     * @param {string} save_as -- storage name under server aegis
     * @param {string} path -- local path to file
     * @returns {Buffer|boolean}
     */
    async open_image_upload(for_real,save_as,path) {
        if (!save_as) return -1;
        if (!path) return -1;
        let mimetype = this.approximate_mime_type(path)
        let filedata = for_real ? this.read_file(path) : false
        if ( filedata ) {
            let cmdstr = `UIMG 1|${mimetype}|${save_as}`
            let resp = await this.safe_client_write(cmdstr,false,true)
            if ( this.response_is_good(resp) ) {
                return file_data    // file read from disk here
            }
            this.add_error_string(this.handle_generic_response(resp))
            return false
        } else if ( !for_real ) {
            let cmdstr = `UIMG 0|${mimetype}|${save_as}`
            let resp = await this.safe_client_write(cmdstr,false,true)
            if ( this.response_is_good(resp) ) {
                return true    // permission granted
            }
            this.add_error_string(this.handle_generic_response(resp))
            return false
        }
        this.add_error_string("image_upload: source file not found")
        return false
    }

    /**
     * // OIMG : 83
     * 
     * Immediately after this returns true,
     * the client code should call process_download(len) followed by end_download()
     * 
     * after user READ
     * 
     * @param {string} filename 
     * @returns 
     */
    async open_image_download(filename) {
        if ( !filename ) return(-2)
        let cmdstr = `OIMG ${msgnum}`
        let resp = await this.safe_client_write(cmdstr)
        if ( this.response_is_good(resp) ) {
            let data = this.handle_generic_response(resp)
            let [size,mod_time,filename,mime_type] = data.split('|')
            return {size,mod_time,filename,mime_type}
        }
        this.add_error_string(this.handle_generic_response(resp))
        return(false)
    }


    /**
     * DLRI : 84
     * 
     * (works like READ except for some parameters)
     * 
     * 
     * BINARY_FOLLOWS
     * use_binary_switch    
```
a BINARY_FOLLOWS code followed by three parameters - the
number of bytes in the data, a filename (always empty), the MIME type of the
image (such as image/gif), and the character set (always empty).
```
     * @returns 
     */
    async download_room_image() {
        let cmdstr = 'DLRI'
        let resp = await this.safe_client_write(cmdstr)
        if ( this.binary_follows(resp) ) {
            let data = this.handle_generic_response(resp)
            if ( data ) {
                // use_binary_switch
                let [len, filename, content_type, charset ] = data.split('|')
                let buffer = await this.process_download_buffer(len)
                return {buffer, len, filename, content_type, charset}
            }
        }
        //
        this.add_error_string(this.handle_generic_response(resp))
        return false
    }


    /**
     * // ULRI : 85
     * 
     * SEND_BINARY
     * 
     * @param {string} save_as 
     * @param {string} path 
     * @returns 
     */
    async room_image_upload(save_as,path) {
        if (!save_as) return -1;
        if (!path) return -1;
        let mimetype = this.approximate_mime_type(path)
        let filedata = this.read_file(path)  // a buffer
        let image_size = filedata.length
        let cmdstr = `ULRI ${image_size}|${mimetype}|${save_as}`
        let resp = await this.safe_client_write(cmdstr)
        if ( this.send_binary(resp) ) {
            let numstr = this.handle_generic_response(resp)
            let to_write = parseInt(numstr)
            await this.binary_write(filedata,to_write)
            return true
        }
        this.add_error_string(this.handle_generic_response(resp))
        return false
    }




    
    // Commands that change the behavior of this Citadel System

    //   "CONF" : 86,
    // CONF     -- a complex of subcommands


    /**
     * 
     * // CONF : 86
     * // CONF GET LISTVAL
     * 
```
  CONF GETVAL|name
  CONF PUTVAL|name|value
  CONF LISTVAL
  CONF GET
  CONF SET
  CONF GETSYS|name
  CONF PUTSYS|name
     * 
     * 
     * @returns 
     */
    async get_system_config() {
        let cmdstr = `CONF LISTVAL`
        let resp = await this.safe_client_write(cmdstr)
        if ( this.listing_follows(resp) ) {
            let output =  this.handle_generic_response(resp)
            let name_val_pairs = output.split('\n')
            let nv_map = {}
            for ( let nv_pair of name_val_pairs ) {
                let [name,value] = nv_pair.split('|')
                nv_map[name] = value
            }
            return(nv_map)
        }
        this.add_error_string(this.handle_generic_response(resp))
        return(false)
    }

    /**
     * 
     * CONF GETVAL|name
     * 
     * @param {string} var_name 
     * @returns 
     */
    async get_system_conf_var(var_name) {
        let cmdstr = `CONF GETVAL|${var_name}`
        let resp = await this.safe_client_write(cmdstr)
        if ( this.response_is_good(resp) ) {
            let output =  this.handle_generic_response(resp)
            return(output)
        }
        this.add_error_string(this.handle_generic_response(resp))
        return(false)
    }



    /**
     * 
     * // CONF PUTVAL|name|value
     * @param {string} listing 
     * @returns 
     */
    async set_system_conf_var(name,value) {
        let cmdstr = `CONF PUTVAL|${name}|${value}`
        let resp = await this.safe_client_write(cmdstr)
        if ( this.response_is_good(resp) ) {
            return true
        }
        this.add_error_string(this.handle_generic_response(resp))
        return(false)
    }


    
    /**
     * // CONF : 86
     * // CONF GETSYS
     * 
     * @param {string} mimetype 
     * @param {string} listing 
     * @returns 
     */
    async get_system_config_by_type(mimetype) {
        if ( !mimetype ) return -2;
        let cmdstr = `CONF GETSYS|${mimetype}`
        let resp = await this.safe_client_write(cmdstr)
        if ( this.listing_follows(resp) ) {
            let output =  this.handle_generic_response(resp)
            return(output)
        }
        this.add_error_string(this.handle_generic_response(resp))
        return(false)
    }

    // 
    /**
     * 
     * // CONF : 86
     * // CONF PUTSYS
     * 
     * 
     * 
     * @param {string} mimetype 
     * @returns 
     */
    async set_system_config_by_type(mimetype,listing) {
        let cmdstr = `CONF PUTSYS|${mimetype}`
        let resp = await this.safe_client_write(cmdstr)
        if ( this.send_listing(resp) ) {
            this.send_text(listing)
            return true
        }
        this.add_error_string(this.handle_generic_response(resp))
        return(false)
    }



    // Commands related to the auto-purger

//   "GPEX" : 87,
//   "SPEX" : 88,
//   "TDAP" : 89,


    /**
     * // GPEX : 87
     * 
     * which policy is one of: "roompolicy" "floorpolicy" "sitepolicy" "mailboxespolicy"
     * 
     * @param {string} which 
     * @returns 
     */
    async get_message_expiration_policy(which) {
        if ( (which < 0) || (which > 3) ) return -2;
        let policy = this.expiration_policies[which]
        let cmdstr = `GPEX ${policy}`
        let resp = await this.safe_client_write(cmdstr)
        if ( this.response_is_good(resp) ) {
            let p_resp = this.handle_generic_response(resp).split('|')
            return new ExpirationPolicy(p_resp[0],p_resp[1])
        }
        this.add_error_string(this.handle_generic_response(resp))
        return(false)

    }

    /**
     * // SPEX : 88
     * 
     * `SPEX ${scope}|${policy.expire_mode}|${policy.expire_mode}`
     * 
     * @param {string} which - one of  "room" "floor" "site" "mailboxes"
     * @param {string} policy -- one of "roompolicy" "floorpolicy" "sitepolicy" "mailboxespolicy"
     * @returns 
     */
    async set_message_expiration_policy(which,policy) {
        let scope_settings = this.policy_scope[which]   // policy_scope table initialized
        let value = scope_settings[which][policy]
        let cmdstr = `SPEX ${which}|${policy}|${value}`  
        let resp = await this.safe_client_write(cmdstr)
        if ( this.response_is_good(resp) ) {
            return true
        }
        this.add_error_string(this.handle_generic_response(resp))
        return(false)
    }



    /**
     * // TDAP" : 89
     * // "TDAP": "Manually initiate auto-purger"
     * 
     * @returns 
     */
    async initiate_auto_purger() {
        let cmdstr = 'TDAP'
        let resp = await this.safe_client_write(cmdstr)
        if ( this.response_is_good(resp) ) {
            return true
        }
        this.add_error_string(this.handle_generic_response(resp))
        return(false)
    }
    

    // Server Maintenance Commands

//   "SMTP" : 90,


    /**
     * // SMTP" : 90
     * 
```
This command, accessible only by administrators, supports several utility operations
which examine or manipulate Citadel's SMTP support. The first command argument
is a subcommand telling the server what to do. The following subcommands are supported:

SMTP mx|hostname	(display all MX hosts for 'hostname')
SMTP runqueue		(attempt immediate delivery of all messages in the outbound 
                     SMTP queue, ignoring any retry times stored there)
```
     * @returns 
     */
    async manage_smtp(cmd,hostname) {
        let cmdstr = cmd === 'mx' ? `SMTP mx|${hostname}` : "SMTP runqueue"
        let resp = await this.safe_client_write(cmdstr)
        let output = this.handle_generic_response(resp)
        if ( this.response_is_good(resp) ) {
            return true
        }
        this.add_error_string(output)
        return(false)
    }
    


//   "DOWN" : 91,
//   "SCDN" : 92,
//   "HALT" : 93,

    /**
     * // DOWN : 91,
     * @returns 
     */
    async terminate_server_now() {
        let cmdstr = 'DOWN'
        let resp = await this.safe_client_write(cmdstr)
        let output = this.handle_generic_response(resp)
        if ( this.response_is_good(resp) ) {
            return true
        }
        this.add_error_string(output)
        return(false)
    }



    /**
     * 
     * SCDN : 92
     * 
     * @param {boolean} mode 
     * @returns 
     */
    async terminate_server_scheduled(mode) {
        let cmdstr = `SCDN ${mode ? 1 : 0}`
        let resp = await this.safe_client_write(cmdstr)
        let output = this.handle_generic_response(resp)
        if ( this.response_is_good(resp) ) {
            return true
        }
        this.add_error_string(output)
        return(false)
    }



    /**
     * 
     *  // HALT : 93
     *              "halt the server without exiting the server process"
     * 
     * @returns 
     */
    async halt_server_now() {
        let cmdstr = 'HALT'
        let resp = await this.safe_client_write(cmdstr)
        let output = this.handle_generic_response(resp)
        if ( this.response_is_good(resp) ) {
            return true
        }
        this.add_error_string(output)
        return(false)
    }
    


    // Session authentication

//   "NEWU" : 94,
//   "CREU" : 95,
//   "VALI" : 96,
//   "QUSR" : 97,
//   "LIST" : 98,  -- user listing


    /**
     * // NEWU : 94
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
            if ( this.response_is_good(resp) ) {
                return true
            }
            this.add_error_string(output)
            return(false)
        } catch ( e ) {
            console.log("create user: " + e.message)
            return(false)
        }
    }


    /**
     * // CREU : 95
     * @param {string} username 
     * @returns 
     */
    async admin_create_user(username) {
        try {
            let cmdstr = "CREU " + username
            let resp = await this.safe_client_write(cmdstr)
            if ( this.response_is_good(resp) ) {
                return true
            }
            this.add_error_string(this.handle_generic_response(resp))
            return(false)
        } catch ( e ) {
            console.log("admin create user: " + e.message)
            return(false)
        }
    }


    /**
     * // VALI : 96
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
        if ( this.response_is_good(resp) ) {
            return true
        }
        this.add_error_string(this.handle_generic_response(resp))
        return(false)
    }


    /**
     * // QUSR" : 97
     * 
     * @param {*} username 
     * @returns 
     */
    async query_username(username) {
        let cmdstr = 'QUSR ' + username
        let resp = await this.safe_client_write(cmdstr)
        if ( this.response_is_good(resp) ) {
            return this.handle_generic_response(resp)
        }
        this.add_error_string(this.handle_generic_response(resp))
        return(false)
    }



    /**
     * LIST" : 98
     * //   "LIST": "List users"
     * 
     * 
- User display name
- Access level
- User number
- Date/time of last login (Unix timestamp format)
- (empty field)
- (empty field)
- Password (listed only if the user requesting the list is an administrator)
     * 
     * @returns 
     */
    async list_users(search_pattern) {
        let cmdstr = `LIST ${search_pattern}`
        let resp =  await this.safe_client_write(cmdstr)
        if ( this.listing_follows(resp) ) {
            let output = this.handle_generic_response(resp)
            let listing = output.split('\n')
            let user_lists = listing.map(line => {
                let [display_name, access, user_num, datetime, not1, not2, password] = line.split('|')
                return {display_name, access, user_num, datetime, password}
            })
            return user_lists
        }
        this.add_error_string(this.handle_generic_response(resp))
        return(false)
    }
 



    // Commands which manipulate user records

//   "SETP" : 99,
//   "GETU" : 100,
//   "SETU" : 101,
//   "EBIO" : 102,
//   "RBIO" : 103,
//   "DLUI" : 104,
//   "ULUI" : 105,


    /**
     * // SETP" : 99
     * 
     * @param {*} pass 
     * @returns 
     */
    async set_password(pass) {
        let cmdstr = "SETP " + pass
        let resp =  await this.safe_client_write(cmdstr)
        if ( this.response_is_good(resp) ) {
            return true
        }
        this.add_error_string(this.handle_generic_response(resp))
        return(false)
    }

    /**
     * // GETU : 100
     * 
     * @returns {object}
     */
    async get_user_parameters() {
        try {
            let resp =  await this.safe_client_write("GETU ")
            if ( this.response_is_good(resp) ) {
                let output = this.handle_generic_response(resp)
                let report = this.unpack_user_parameters(output)
                return(report)
            }
            this.add_error_string(this.handle_generic_response(resp))
            return(false)
        } catch (e) {
            return false
        }
    }
 

    /**
     * // SETU : 101
     *          Set User parameters"
     * 
     * @returns 
     */
    async set_user_parameters(params) {
        let cmdstr = `SETU ${params}`
        let resp =  await this.safe_client_write(cmdstr)
        if ( this.response_is_good(resp) ) {
            return true
        }
        this.add_error_string(this.handle_generic_response(resp))
        return(false)
    }
 



    /**
     * // EBIO : 102
     * 
     * 
     * SEND_LISTING
     * 
     * @param {string} bio 
     * @returns 
     */
    async set_bio(bio) {
        if ( !bio ) return -2;
        let cmdstr = 'EBIO'
        let resp = await this.safe_client_write(cmdstr)
        if ( this.send_listing(resp) ) {
            this.send_text(bio)
            return true
        }
        this.add_error_string(this.handle_generic_response(resp))
        return(false)
    }



    /**
     * // RBIO : 103
     * 
     * @param {string} username 
     * @returns 
     */
    async get_bio(username) {
        if ( !bio ) return -2;
        let cmdstr = `RBIO ${username}`
        let resp = await this.safe_client_write(cmdstr)
        let output = this.handle_generic_response(resp)
        if ( this.listing_follows(resp) ) {
            let lines = output.split('\n')
            // something goes in this line
            return lines.join('\n')
        }
        this.add_error_string(output)
        return(false)
    }



    /**
     * // DLUI : 104
     * 
     * (works like READ)
     * 
     * BINARY_FOLLOWS
     * 
```
a BINARY_FOLLOWS code followed by three
parameters - the number of bytes in the data, a filename (always empty), the
Content-Type (such as image/gif), and the character set (always empty).
```
     * 
     * @returns 
     */
    async download_user_image(user_name) {
        let cmdstr = `DLUI ${user_name}`
        let resp = await this.safe_client_write(cmdstr)
        if ( this.binary_follows(resp) ) {
            let data = this.handle_generic_response(resp)
            if ( data ) {
                // use_binary_switch
                let [len, stat, filename, content_type, charset ] = data.split('|')
                let buffer = await this.process_download_buffer(len)
                return {buffer, len, stat, filename, content_type, charset}
            }
        }
        this.add_error_string(this.handle_generic_response(resp))
        return false
    }



    /**
     * // ULUI : 105
     * 
     * SEND_BINARY
     * 
     * (send binary allows more control outside the data handler for connect)
     * 
     * 
     * @param {*} image_size 
     * @param {*} user_name 
     * @param {*} path 
     * @returns 
     */
    async upload_user_image(save_as,path) {
        if (!save_as) return -1;
        if (!path) return -1;
        let mimetype = this.approximate_mime_type(path)
        let filedata = this.read_file(path)  // a buffer
        let image_size = filedata.length
        let cmdstr = `ULUI ${image_size}|${mimetype}|${user_name}`
        let resp = await this.safe_client_write(cmdstr)
        if ( this.send_binary(resp) ) {
            let numstr = this.handle_generic_response(resp)
            let to_write = parseInt(numstr)
            await this.binary_write(filedata,to_write)
        }
        this.add_error_string(this.handle_generic_response(resp))
        return false
    }


//   "AGUP" : 106,
//   "ASUP" : 107,
//   "AGEA" : 108,
//   "ASEA" : 109,

    /**
     * 
     * // AGUP : 106
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
     * @param {string} who 
     * @returns 
     */
    async aide_get_user_parameters(who) {
        let cmdstr = `AGUP ${who}`
        let resp = await this.safe_client_write(cmdstr)
        if ( this.response_is_good(resp) ) {
            let output =  this.handle_generic_response(resp)
            let fields = output.split('|')
            return new CitadelAideUser(fields)
        }
        this.add_error_string(this.handle_generic_response(resp))
        return(false)
    }

    /**
     * // ASUP : 107
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
        if ( this.response_is_good(resp) ) {
            let output =  this.handle_generic_response(resp)
            let fields = output.split('|')
            return new CitadelAideUser(fields)
        }
        this.add_error_string(this.handle_generic_response(resp))
        return(false)
    }

    /**
     * 
     * // AGEA : 108
     * 
     * @param {*} who 
     * @returns 
     */
    async aide_get_email_addresses(who) {
        let cmdstr = `AGEA ${who}`
        let resp = await this.safe_client_write(cmdstr)
        if ( this.listing_follows(resp) ) {
            let output =  this.handle_generic_response(resp)
            let emails = output.split('|')
            return(emails)
        }
        this.add_error_string(this.handle_generic_response(resp))
        return false
    }
    


    /**
     * // ASEA : 109
     * 
     * SEND_LISTING
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
        if ( this.send_listing(resp) ) {
            this.send_text(emailaddrs)
            return true
        }
        this.add_error_string(this.handle_generic_response(resp))
        return false
    }


//   "RENU" : 110,
//   "GNUR" : 111,
//   "GREG" : 112,
//   "REGI" : 113,
//   "CHEK" : 114,

    /**
     * // RENU : 110,
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
        if ( this.response_is_good(resp) ) {
            return true
        }
        this.add_error_string(this.handle_generic_response(resp))
        return false
    }



    /**
     * 
     * // GNUR : 111
     * 
     * MORE_DATA
     * 
     * @returns {boolean|string} -- if a string returned is the name of user requiring validation
     */
    async unvalidated_user() {
        let cmdstr = "GNUR"
        let resp = await this.safe_client_write(cmdstr)
        if ( this.response_is_good(resp) ) {
            return true
        } else if ( this.more_data(resp) ) {
            let output = this.handle_generic_response(resp)
            return(output)
        }
        this.add_error_string(this.handle_generic_response(resp))
        return false
    }



    /**
     * // GREG" : 112
     * 
```
RVcard
1	User number
2	Password
3	Real name
4	Street address or PO Box
5	City/town/village/etc.
6	State/province/etc.
7	ZIP or Postal Code
8	Telephone number
9	Access level
10	Internet e-mail address
11	Country
```
     * 
     * @param {string} username 
     * @returns 
     */
    async user_registration(username) {
        let cmdstr = "GREG"
        if (username) {
            cmdstr = "GREG " + username
        }
        let resp = await this.safe_client_write(cmdstr)
        if ( this.listing_follows(resp) ) {
            let output = this.handle_generic_response(resp)
            let reg_values = output.split('\n')
            return(new RVcard(reg_values))
        }
        this.add_error_string(this.handle_generic_response(resp))
        return false
    }


    /**
     * // REGI : 113
     * 
     * SEND_LISTING
     * (deprepcated)
     * 
     * submit the following as a vCard (with MIME type "text/x-vcard") to the user's "My Citadel Config" room
     * 
1	Real name
2	Street address or PO Box
3	City/town/village/etc.
4	State/province/etc.
5	ZIP or postal code
6	Telephone number
7	email address
8	Country

     * @returns 
     */
    async set_registration() {
        let cmdstr = 'REGI'
        return "deprecated"
    }


    
    /**
     * // CHEK : 114
     * 
     * 
     * @returns 
     */
    async misc_check() {
        let cmdstr = 'CHEK'
        let resp = await this.safe_client_write(cmdstr)
        if ( this.response_is_good(resp) ) {
            let output = this.handle_generic_response(resp)
            let [ new_msg_count, register, user_validation, prefered_email ] = output.split('|')
            return {new_msg_count, register, user_validation, prefered_email}
        }
        this.add_error_string(this.handle_generic_response(resp))
    }



    // Runtime Attribute Manipulation
//   "STEL" : 115,

    /**
     * 
     * @param {*} mode 
     * @returns 
     */
    async stealth_mode(mode) {
        let cmdstr = `STEL ${mode}`
        let resp = await this.safe_client_write(cmdstr)
        if ( this.response_is_good(resp) ) {
            return true
        }
        this.add_error_string(this.handle_generic_response(resp))
    }



// real time chat

//   "RCHT" : 116

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
     *
     * 
     *  SEND_LISTING
     * 
     * @param {string} cmd_str 
     * @param {string} cmd_pars - optional
     * @returns 
     */
    async real_time_chat(cmd_str,cmd_pars = false,listing = "") {
        let cmdstr = `RCHT ${cmd_str}`
        if ( cmd_pars ) {
            cmdstr += `|${cmd_pars}`
        }
        let resp = await this.safe_client_write(cmdstr)
        if ( this.response_is_good(resp) ) {
            return true
        } else if ( this.send_listing(resp) ) {
            this.send_text(listing)
            return true
        } else if ( this.listing_follows(resp) ) {
            let output = this.handle_generic_response(resp)
            let lines = output.split('\n')
            return lines.join('\n')
        }

        this.add_error_string(this.handle_generic_response(resp))
        return false
    }


    // THE FOLLOWING COMMANDS ARE NOT FOUND IN THE DOC PAGE
    /*
    PAS2 : 1
    SEEN : 2
    SNET : 3
    IPGM : 4
    LBIO : 5
    LSUB : 6
    ASYN : 2
    GIBR : 7
    PIBR : 8
    */

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
     * @param {string} session 
     * @param {string} listing 
     * @returns 
     */
    async set_room_network_config(session,listing) {
        if ( session < 0 ) return -2;
        let cmdstr = `SNET`
        let resp = await this.safe_client_write(cmdstr)
        if ( this.send_listing(resp) ) {
            this.send_text(listing)
            return true
        }
        this.add_error_string(this.handle_generic_response(resp))
        return false
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


    /**
     * 
     * @returns 
     */
    async list_users_with_bios() {
        let cmdstr = 'LBIO'
        let resp = await this.safe_client_write(cmdstr)
        if ( this.send_listing(resp) ) {
            this.send_text(listing)
            return true
        }
        this.add_error_string(this.handle_generic_response(resp))
        return false
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
        let cmdstr = 'PIBR'
        let resp = await this.safe_client_write(cmdstr)
        if ( this.send_listing(resp) ) {
            await this.send_text(new_rules)
            return true
        }
        this.add_error_string(this.handle_generic_response(resp))
        return false
    }


    // 124 commands in total
}


module.exports = CitadelClient
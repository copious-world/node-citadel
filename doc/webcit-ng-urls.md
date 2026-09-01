The citadel server stores rooms organized into groups by floors.
(This arrangement is purely organizational)

Each room is assigned features.
Among the features are view types. 
Each room holds a number of messages, as well as users, since chat is possible.
(
    Citadel makes a mistake in making the room of a list view of messages.
    Instead, each room can have a list of partitioned messages with each room offering a 
    view of any list. 

    Take note:
    When the command succeeds, these parameters are returned:
    0    | The name of the room
    1    | Number of unread messages in this room
    2    | Total number of messages in this room
    3    | Info flag: set to nonzero if the user needs to read this room's info
            file (see RINF command below)
    4    | Various flags associated with this room.  (See LKRN cmd above)
    5    | The highest message number present in this room
    6    | The highest message number the user has read in this room
    7    | Boolean flag: 1 if this is a Mail> room, 0 otherwise
    8    | Administrator flag: 1 if the user has admin rights to either the current
            room or the entire site.
    9    | (this position is no longer used)
    10   | The floor number this room resides on
    11   | The **current** "view" for this room (see views.md for more info)
    12   | The **default** "view" for this room (see views.md for more info)
    13   | Boolean flag: 1 if this is the user's Trash folder, 0 otherwise.
    14   | More flags associated with this room
    15   | Timestamp of the last write activity in this room (addition or deletion
            of messages, reconfiguration of room, etc)
    16   | Boolean flag: 1 if this is the first time the current user has ever
            encountered the current room; 0 otherwise

    The default view gives the client a hint as to what views the user should be
    allowed to select.  For example, it would be confusing to allow messages in a
    room intended for calendar items.  The server does not enforce these
    restrictions, though.


    STAT   (retrieve name and modification time of current room)

    This is a lightweight command which may be used by a client to quickly determine
    whether there has been any activity in the current room (added or deleted
    messages, modification of the room's configuration, etc).  It is called with no
    parameters, and returns OK followed by two parameters: the name of the room, and
    the modification timestamp.

Here, we see the room getting the assignment, and not the message. 
Most messages start as email. Emails can be sent to rooms. 
So, a default is to set all messages to email at first. But, the site can offer conversion options
at that the message can be seen in different views in a room.
11   | The **current** "view" for this room (see views.md for more info)
12   | The **default** "view" for this room (see views.md for more info)
)


The idea of a DRAFT is not fundamental to message creation. Wiki editing is possible. 
Drafts could be Wiki's or blogs in some sense. But, a message could be marked as a draft.

This is all about the set of delimited parameters the server returns.
The data is stored in a DB as text. The text is pulled out and later parsed by a client.

```
VIEW_BBS            = 0,    // Bulletin board view
VIEW_MAILBOX        = 1,    // Mailbox summary
VIEW_ADDRESSBOOK    = 2,    // Address book view
VIEW_CALENDAR       = 3,    // Calendar view
VIEW_TASKS          = 4,    // Tasks view
VIEW_NOTES          = 5,    // Notes view
VIEW_WIKI           = 6,    // Wiki view
VIEW_CALBRIEF       = 7,    // Brief Calendar view
VIEW_JOURNAL        = 8,    // Journal view
VIEW_DRAFTS         = 9,    // Drafts view
VIEW_BLOG           = 10,   // Blog view
VIEW_QUEUE          = 11,   // SMTP queue
```


A message might be shared between rooms or available for being parts of rooms. 

Wiki - Citadel lacks a wiki outline and outline hierarchy. It does have version control after a fashion.


**List Floors**
http://localhost:8181/ctdl/f/
Returns a list of floors as an array of JSON objects one for each floor.

http://localhost:8181/ctdl/f/{0..n}
Returns a JSON objects for the floor, where n is an index into an array of floors


**Room Functions**
http://localhost:8181/ctdl/r/
Returns a list of rooms as an array of JSON objects one for each room.

**Example:**

```
[
    {
        "rorder":64,
        "default_view":10,
        "name":"Front Page Blog",
        "current_view":10,
        "known":true,
        "hasnewmsgs":true,
        "floor":0,
        "mtime":1788125939
    }
...
]
```

http://localhost:8181/ctdl/r/{NAME}
Returns a JSON objects for the room, where NAME is its key

**Example:**
http://localhost:8181/ctdl/r/Front+Page+Blog

```
{
    "is_room_aide":0,
    "first_visit":false,
    "can_delete_messages":0,
    "default_view":10,
    "current_view":10,  // in current webcit-ng -- this can force navigation to views (but stay in the room), 
                        // while listed in the default view.    "default_view":10, in this case they are the same
    "new_messages":1,
    "room_mtime":1788125939,
    "is_trash_folder":0,
    "name":"Front Page Blog",
    "total_messages":1,
    "last_seen":0
}

```

**Example:**
http://localhost:8181/ctdl/r/Front+Page+Blog/103
Gets the text body of the message


http://localhost:8181/ctdl/r/Front+Page+Blog/103/json
Get the message as a json object

Sub commands like json
json
history
revert
conflicts
respond
handle_rsvp


***ops that can be done to a room***

* mailbox
* stat
* access
* modify_access
* listrecp
* modify_listrecp
* feeds
* modify_feeds
* pop3client
* modify_pop3client
* config
* msgs.
* info.txt
* icon
* newicon
* slrp
* mark




**USERS*

account
password
userpic
newuserpic
bio
freebusy  -- returns ical for download 
prefs
addresses
inboxrules -- array of rules
vcard



http://localhost:8181/ctdl/u/richard/account
```
{
    "USuserpurge":0,
    "username":"richard",
    "password":"**********",
    "lastcall":1788133580,
    "US_LASTOLD":1,
    "US_INTERNET":0,
    "US_FLOORS":1,
    "US_REGIS":0,
    "US_PERM":0,
    "axlevel":6,
    "US_NEEDVALID":0,
    "emails":["richard@richard-HP-Laptop-17-cn1xxx"],
    "flags":10768,
    "US_UNLISTED":0,
    "usernum":2,
    "US_EXPERT":0
}
```

http://localhost:8181/ctdl/u/richard/vcard
{"city":"_","country":"__","state":"_","email":"","zip":"00000","name":"richard;;;;","phone":"","street":"_"}


prefs
{
    "startpage":"dotskip?room=_BASEROOM_",
    "ROOM:Aide:sort":"byfloorroom",
    "XPREF:USER:sort":"user:name",
    "ROOM:Contacts:sort":"byfloorroom",
    "iconbar": "ib_displayas=0,unused=0,ib_displayas=0,ib_logo=0,ib_summary=1,ib_inbox=1,ib_calendar=1,ib_contacts=1,ib_notes=1,ib_tasks=1,ib_rooms=1,ib_users=1,ib_chat=1,ib_advanced=1,ib_logoff=0,ib_citadel=1,=0"
}

addresses
{"emails":["richard@richard-HP-Laptop-17-cn1xxx"],"names":["richard"]}


/ctdl/a/login
/ctdl/a/logout
/ctdl/a/newuser
/ctdl/a/biff

/ctdl/a/sysconf/
/ctdl/a/inetconf
/ctdl/a/aliases


sysconf
```
{"c_auth_mode":"0","c_ep_value":"0","c_smtps_port":"-1","MM_hosted_upgrade_level":"17857915","MM_fulltext_wordbreaker":"33","c_ldap_bind_dn":"(null)","c_disable_newu":"0","c_ldap_host":"(null)","c_ctdluid":"1001","c_ip_addr":"*","c_moreprompt":"<more>","MMfulltext":"110","c_max_workers":"256","c_twitroom":"Trashcan","c_guest_logins":"1","c_sleeping":"900","c_createax":"3","c_purge_hour":"3","c_journal_pubmsgs":"0","c_sysadm":"richard","c_site_location":"(null)","c_mbxep_mode":"0","host_key":"pvzuQRJQ4QG1Zfer4I0CmT7g3j7s5BtDiGVVcoeMys07qoRUa0coXJmLRaPW4yllVwJBTsGp5T0yHUiGQ8HqardQ2EY2GKe1Kxd3","c_userpurge":"0","c_restrict":"0","c_msa_port":"587","c_pop3s_port":"-1","c_maxsessions":"0","c_xmpp_s2s_port":"5269","c_ldap_port":"389","c_port_number":"504","c_journal_dest":"(null)","c_imap_port":"143","smtp_advertise_starttls":"0","c_baseroom":"The Copious Blog","c_maxmsglen":"10485760","c_regiscall":"0","c_humannode":"Citadel Server","c_rfc822_strict_from":"0","c_creataide":"0","c_config_created_or_migrated":"1787462309","c_enable_fulltext":"1","c_mbxep_value":"0","c_min_workers":"5","MMhighest":"110","c_allow_spoofing":"0","c_aide_zap":"0","c_pop3_fetch":"3600","c_ldap_sync_freq":"300","c_pop3_port":"110","c_twitdetect":"0","c_roompurge":"0","c_nntps_port":"-1","c_nodename":"richard-HP-Laptop-17-cn1xxx","c_ldap_base_dn":"(null)","c_pager_program":"","c_initax":"4","c_ldap_admin_group":"(null)","c_pftcpdict_port":"-1","c_ldap_bind_pw":"(null)","c_pop3_fastest":"3600","MMnextroom":"25","c_default_cal_zone":"America/Los_Angeles","c_journal_email":"0","c_ep_mode":"1","c_fqdn":"richard-HP-Laptop-17-cn1xxx","c_rbl_at_greeting":"0","c_imap_keep_from":"0","c_smtp_port":"25","c_nntp_port":"119","c_net_freq":"3600","dkim_selector":"fmcgs","c_xmpp_c2s_port":"5222","c_imaps_port":"-1","c_logpages":"(null)","MMnextuser":"2","c_spam_flag_only":"0","c_aideroom":"Aide"}
```



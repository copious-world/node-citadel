let CitadelClient = require("../index")


// "http://localhost/blog-search/224edbeb-c19d-4ce2-9844-96c2fed6426e/any|create_date/1/0"
//  http://localhost/load_demos/62c8ea27-617a-45ac-b080-9aee85f0554b/any%7Ccreate_date/1/0
//  http://localhost/load_demos/62c8ea27-617a-45ac-b080-9aee85f0554b/any%7Ccreate_date/3/0   (how many start index)



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
    console.log("NOOP",await cit.noop())
    console.log("QNOOP",await cit.q_noop())
    //
    // ----
    let str = await cit.get_user_parameters()
    console.log("USER PARS NOT LOGGED",str)
    //
    console.log(await cit.user('bugsy'))
    console.log(await cit.password('gobldygook'))
    //
    console.log(await cit.user('richard'))
    console.dir(await cit.password('test9test'))



    // hello,changepw,register,help,goodbye,roomaccess,unlisted
    let msg = await cit.system_message("hello")
    console.log(msg)
    msg = await cit.system_message("changepw")
    console.log(msg)
    msg = await cit.system_message("register")
    console.log(msg)
    msg = await cit.system_message("help")
    console.log(msg)
    msg = await cit.system_message("goodbye")
    console.log(msg)
    msg = await cit.system_message("roomaccess")
    console.log(msg)
    msg = await cit.system_message("unlisted")
    console.log(msg)



    let new_mail_check = await cit.count_new_messages()
    console.log(new_mail_check)



    let jwt = await cit.generate_JWT()
    console.log(jwt)


    str = await cit.get_user_parameters()
    console.log("USER PARS LOGGED",str)


    console.log("----")
    let roomData = await cit.rooms(cit.PERSONAL_ROOM,-1)
    console.log("Room Data - PERSONAL_ROOM")
    console.dir(roomData,{ depth: 2, color : true })
    //
    if ( 'Notes' in roomData ) {
        console.log("NOTES PRESENT")
    }
    if ( 'PageContact' in roomData ) {
        console.log("PageContact PRESENT")
    } else {
        let report = await cit.create_room(true,'PageContact',cit.PERSONAL_ROOM,0)
        console.log("called create room",report)
    }

    console.log(await cit.list_floors())
    //


    roomData = await cit.rooms(cit.PUBLIC_ROOM,-1)
    console.log("Room Data PUBLIC_ROOM")
    console.dir(roomData,{ depth: 2, color : true })


    roomData = await cit.rooms(cit.HIDDEN_ROOM,-1)
    console.log("Room Data HIDDEN_ROOM")
    console.dir(roomData,{ depth: 2, color : true })


    roomData = await cit.rooms(cit.INVITATION_ROOM,-1)
    console.log("Room Data INVITATION_ROOM")
    console.dir(roomData,{ depth: 2, color : true })
    
    //
    let room_goto = await cit.goto_room('PageContact')
    console.log("RESULT going to room PageContact:")
    console.dir(room_goto,{ depth: 4 })
    //

    



    //
    let m_count = await cit.count_new_messages()
    console.log("message count:",m_count)
    //
    //
    let msgObject = {
        'recipient' : "richard",
        'anonymous' : false,
        'type' : false,
        'subject' : 'new web page contact',
        'author' : 'jay@bay.org',
        'references' : 'www.whoall.com',
        'text' : 'four score and seven years ago four score and seven years ago four score and seven years ago four score and seven years ago four score and seven years ago four score and seven years agofour score and seven years ago four score and seven years ago four score and seven years ago four score and seven years ago four score and seven years ago four score and seven years ago four score and seven years ago four score and seven years ago four score and seven years ago four score and seven years ago four score and seven years ago four score and seven years ago four score and seven years ago four score and seven years ago four score and seven years ago '
    }

    msgObject.text = msgObject.text + " " + msgObject.text
    // let postm_result = await cit.post_message(msgObject)
    // console.log("post message result:",postm_result)


    // GOTO ROOM MAIL

    room_goto = await cit.goto_room('_MAIL_')
    console.log("RESULT going to room _MAIL_:")
    console.dir(room_goto,{ depth: 4 })
    //
    m_count = await cit.count_new_messages()
    console.log("message count:",m_count)
    // list messages

    let msg_list = await cit.get_messages()
    console.log("MESSAGE LIST")
    console.log(msg_list)

    let msg_num = msg_list[msg_list.length - 1]

    console.log("looking for message",msg_num)
    let message_data = await cit.get_message_RFC822(msg_num)
    console.log(message_data)

    console.log("----------------------------------------------------------------")

    let lflr = await cit.floor_listing()
    console.log("floor listing",lflr)
    //
    //
    await cit.logout()
    let user_again = await cit.authenticate_JWT(jwt)
    console.dir(user_again)

    console.log("Once again")

    let developerid = 24,
        clientid = 3,
        revision = 2,
        software_name = "node citadle",
        hostname = "copious.world"

    await cit.identify_software(developerid,clientid,revision,software_name,hostname)

    let users = await cit.on_line_users()
    console.log(users)


    let global_dir = await cit.directory_lookup("richard@richardLa-HP-ptop-17-cn1xxx")
    console.log(global_dir)
    //
    console.log(await cit.rebuild_dir_index())
    //
    let auto_results = await cit.autocomplete("HP-ptop-17-")
    console.log(auto_results)

    console.log(await cit.check_email_is_mine("richard@richardLa-HP-ptop-17-cn1xxx"))


    let server_info = await cit.server_info()
    console.log(server_info)


    // START TLS ??? have to do TLS negotiation -- need to work this out with the server code
    console.log(await cit.get_TLS_session())


    console.log(await cit.ical_cmd("test"))

    console.dir(await cit.get_root_mtime())

    // ----

    await cit.logout()

    cit.quit()
    
}


run()

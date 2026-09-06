let CitadelClient = require("../index")




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
    await cit.user('richard')
    await cit.password('test9test')



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
    let postm_result = await cit.post_message(msgObject)
    console.log("post message result:",postm_result)
   


    let lflr = await cit.floor_listing()
    console.log("floor listing",lflr)
    //
    //
    await cit.logout()
    cit.quit()
    
}


run()

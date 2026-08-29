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

    await cit.user('richard')
    await cit.password('test9test')
    console.log("----")
    let roomData = await cit.rooms(cit.PERSONAL_ROOM,-1)
    console.log("Room Data")
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
    console.log(await cit.goto_room('PageContact'))
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

    console.log(await cit.post_message(msgObject))
   
    //
    await cit.logout()
    cit.quit()
    
}


run()

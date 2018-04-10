const axios = require("axios");

$(document).ready(function() {

    var userName;

    $('#modal_login').modal({
        backdrop: 'static'
    });

    $('#modal_login').modal('show');

    $('#send_message').prop('disabled', true);

    $('#login_chat').popover({
        title: 'Username Required',
        content: 'Username is empty, please enter a name and try again!',
        placement: 'right',
        trigger: 'focus',
        template: '<div class="popover username_empty" role="tooltip"><div class="arrow"></div><h3 class="popover-header"></h3><div class="popover-body"></div></div>'
    });

    $('input#login_username, #login_chat.btn').on('click keyup', function(event) {
        // login screen/modal
        event.preventDefault();

        // this should allow pressing enter or clicking login button to enter a user name
        if ((event.keyCode === 13 && event.type === 'keyup') || (event.type === 'click' && event.target.id == 'login_chat')) {

            userName = $('#login_username').val().trim();

            if (fieldNotEmpty(userName)) {
                // login, dismiss login modal
                $('#modal_login').slideUp(600);
                $('.modal-backdrop').delay(300).fadeOut(300);
                $('#login_chat').popover('hide');

                //update global variable for username
                $(document).data('userName', userName);
                initializeChat(userName);
            } else {
                console.log('username empty');
                $('#login_chat').popover('show');
            }
        }
    });

    $('input#chat_message, #send_message').on('click keyup', function(event) {
        // key binding for sending messages to the chat window
        event.preventDefault();

        $('#send_message').prop('disabled', this.value == '' ? true : false);

        // this should allow pressing enter or clicking "send" button to post a message
        if ((event.keyCode === 13&& event.type === 'keyup') || (event.type === 'click' && event.target.id == 'send_message')) {

            var message = $('#chat_message').val().trim();

            if (fieldNotEmpty(message)) {
                postMessage(message);
            } else {
                console.log('empty message');
            }
        }
    });
});

function initializeChat(un) {
    //initialize the chat session by setting the username in the DOM, starting the clock and populating the rooms
    $('#userName').html(un);
    startTheClock();
    getRooms();

    // initialize global variable for roomID
    $(document).data('roomID', '');
}

function fieldNotEmpty(field) {
    //validate the field if empty/catch errors
    // this actually did more but i mucked it out

    if (field == '') {
        // field is empty, show error
        return false;
    } else {
        return true;
    }
}

function startTheClock() {
    var start = 0;

    //calculate one minute intervals and update the clock
    $('.timeonline .minutes').text(start);

    setInterval(function() {
        $('.timeonline .minutes').text(++start);
    }, 60000);
}

function getRooms() {
    //get rooms from the server and populate the DOM
    const url = 'http://localhost:8080/api/rooms';

    axios
        .get(url)
        .then(function(response){

            var rooms = sortByKey(response.data, 'name');
            var noOfRooms = rooms.length;

            for (var i = 0; i < noOfRooms; i++) {
                $('.roomsmenu').append('<div class="room">'+rooms[i].name+'</div>');
                $('.roomsmenu div:last').attr('id', 'id_'+rooms[i].id);

                // add click handler to room button
                $('.roomsmenu div#id_'+rooms[i].id).on('click', function(){
                    changeRoom(this.id);
                });
            }
        })
        .catch(function(error) {
            console.log('Error getting rooms: ' + error);
        });
}

function changeRoom(rid) {
    //change rooms, retrieve users in new room
    var roomID = rid.substr(3);
    const url = 'http://localhost:8080/api/rooms/'+roomID;

    axios
        .get(url)
        .then(function(response){

            var users = sortByKey(response.data.users);
            var noOfUsers = users.length;
            var thisIsMe = $(document).data('userName');

            $('#chat_app .mainbody .header .roomName').html(response.data.name);
            $('#chat_app .mainbody .header .chatters').html('<span class="thisisme">'+thisIsMe+'</span>');

            // more than just you in the chat room
            if (noOfUsers > 0) {
                $('.thisisme').append(', ');
            }

            for (var i = 0; i < noOfUsers; i++) {
                $('#chat_app .mainbody .header .chatters').append(users[i]);
                if (i != noOfUsers-1) {
                    // add commas unless last user in the list
                    $('#chat_app .mainbody .header .chatters').append(', ');
                }
            }

            //toggle selected
            $('.roomsmenu .room.selected').removeClass('selected');
            $('.roomsmenu .room#id_'+roomID).addClass('selected');

            //update global variable for roomID
            $(document).data('roomID', roomID);

            //call function to update chat pane
            updateChat(roomID);
        })
        .catch(function(error) {
            console.log('Error getting users: ' + error);
        });
}

function updateChat(rid) {
    //update chat pane after changing rooms
    const url = 'http://localhost:8080/api/rooms/'+rid+'/messages';

    axios
        .get(url)
        .then(function(response){

            //calculate and cut off excess messages
            // set cutoffVal to NEGATIVE value of the amount of messages you want to retrieve
            // this is to retrieve the last n messages in the array
            var noOfMessages = response.data.length;
            const cutoffVal = -5;
            var newMessageQueue = response.data.slice(0).slice(cutoffVal);

            $.get('message.template', function(source) {
                //use handlebar template to format message
                var template = Handlebars.compile(source);
                var newMessage = template(newMessageQueue);

                $('#chat_app .mainbody .chatbox p').html(newMessage);
                if (noOfMessages > Math.abs(cutoffVal)) {
                    var excessMsgs = noOfMessages - Math.abs(cutoffVal);
                    $('#chat_app .mainbody .chatbox p').prepend('<p class="excessMessages">-= Excess messages ('+excessMsgs+') discarded=- </p>');
                }

                //add class to user's messages
                var name = $(document).data('userName');
                var uidClass = '.user_'+name;
                $('.message.body .user'+uidClass).parent().addClass('thisisme');

                //autoscroll to the bottom if content is too long for screen size
                var chatWindow = $('div.row.chatbox');
                var scroller = setInterval(function(){
                    var pos = chatWindow.scrollTop();
                    chatWindow.scrollTop(++pos);
                    if(chatWindow[0].scrollHeight - chatWindow.scrollTop() == chatWindow.outerHeight()) {
                        clearInterval(scroller);
                    }
                }, 1);
            });
        })
        .catch(function(error) {
            console.log('Error getting messages: ' + error);
        });
}

function postMessage(message) {
    //post a new message to the chat pane
    var rid = $(document).data('roomID');
    var name = $(document).data('userName');
    var reaction = null;
    var messages = [];

    const url = 'http://localhost:8080/api/rooms/'+rid+'/messages';

    if (rid == '') {
        // attempting to post when not in a room, show error message
        $('#modal_roomError').modal('show');
        $('.modal-backdrop').hide();
    } else {
        //post a message, save to server first, then post to chat pane
        axios
            .post(url, {
                    name: name,
                    message: message,
                    reaction: reaction
                }
            )
            .then(function(response){
                //use handlebar template to format message
                $.get('message.template', function(source) {
                    var template = Handlebars.compile(source);

                    // response is actually stored as a string, need to manipulate it to turn it back into json for the template
                    var json = JSON.parse(response.config.data);
                    messages[0] = json;
                    var newMessage = template(messages);
                    $('#chat_app .mainbody .chatbox p').append(newMessage);
                    $('.message.body:last').addClass('thisisme');

                    //autoscroll chat pane for new message
                    var chatWindow = $('div.row.chatbox');
                    var scroller = setInterval(function(){
                        var pos = chatWindow.scrollTop();
                        chatWindow.scrollTop(++pos);
                        if(chatWindow[0].scrollHeight - chatWindow.scrollTop() == chatWindow.outerHeight()) {
                            clearInterval(scroller);
                        }
                    }, 1);

                    //clear input box for new message
                    $('#chat_message').val('');
                });
            })
            .catch(function(error) {
                console.log('Error posting messages: ' + error);
            });
    }
}

function sortByKey(array, key) {
    //helper function
    //sorts either an array (1 arg) or object (2 args)

    if (arguments.length == 1) {
        return array.sort();
    } else {
        return array.sort(function (a, b) {
            var x = a[key];
            var y = b[key];
            return ((x < y) ? -1 : ((x > y) ? 1 : 0));
        });
    }
}
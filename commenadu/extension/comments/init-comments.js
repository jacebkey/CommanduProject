function setUp() {
    highlight = JSON.parse(localStorage.getItem('highlight'));
    if (highlight) {
        setUpFromHighlight(highlight);
    } else {
        userInfo = JSON.parse(localStorage.getItem('user_info'));
        establishCommentSystem(
            userInfo ? userInfo.id : 0,
            {},
        );
    }
}

$(function() {
    // setUp();
    localStorage.removeItem('highlight');
});

function establishCommentSystem(currentUserId, functions) {
    $('#comments-container').comments({
        profilePictureURL: 'comments/user-icon.png',
        currentUserId: currentUserId,
        roundProfilePictures: false,
        textareaRows: 1,
        enableAttachments: false,
        enableEditing: false,
        enableHashtags: false,
        enablePinging: false,
        noCommentsText: 'No comments! Try selecting/creating a highlight with comments, or post a new one.',
        getUsers: functions.getUsersFn,
        getComments: functions.getCommentsFn,
        postComment: saveComment,
        upvoteComment: upvoteComment,
    });
}

function myComment(id)
{
    console.log("focus");
    $("#textarea").focus();
}

function upvoteComment(data, success, error) {
    userInfo = JSON.parse(localStorage.getItem('user_info'));
    if (!userInfo || !userInfo.token) {
        error();
        return;
    }
    $.ajax({
        type: "POST",
        url: `https://api.swimfanatic.net:6443/comments/like/${data.id}`,
        success: function(result) {
            console.log(data);
            success(data);
        },
        error: function(err){
            error();
        },
        headers: { Authorization: `Bearer ${userInfo.token}` },
    });
}

function fillInComments(topLevelComments) {
    userdict = {};
    var addAuthorOf = (comment) => {
        if (!userdict.hasOwnProperty(comment.author.id)) {
            userdict[comment.author.id] = {
                id: comment.author.id,
                fullname: comment.author.username,
                profile_picture_url: "comments/user-icon.png",
            };
        }
    };
    for (topLevel of topLevelComments) {
        if (!topLevel) {
            continue;
        }

        addAuthorOf(topLevel);
        for (response of topLevel.responseComments) {
            addAuthorOf(response);
        }
    }

    comments = [];
    var baseLevelInfo = (comment) => {
        return {
            id: comment.id,
            creator: comment.author.id,
            fullname: comment.author.username,
            content: comment.text,
            upvote_count: comment.likes,
            created: comment.createdAt,
            modified: comment.createdAt, // This is on purpose, likes count as modification, and no editing through ui
        };
    };
    for (topLevel of topLevelComments) {
        if (!topLevel) {
            continue;
        }

        comments.push({
            parent: null,
            ...baseLevelInfo(topLevel),
        });

        for (response of topLevel.responseComments) {
            if (!response) {
                continue;
            }

            comments.push({
                parent: topLevel.id,
                ...baseLevelInfo(response),
            });
        }
    }
    users = Object.values(userdict);

    userInfo = JSON.parse(localStorage.getItem('user_info'))
    establishCommentSystem(userInfo ? userInfo.id : 0, {
        getUsersFn: (success, error) => {
            try {
                success(users);
            } catch {
                error('Could not load Users.');
            }
        },
        getCommentsFn: (success, error) => {
            try {
                success(comments);
            } catch {
                error('Could not load Comments.');
            }
        },
    });
}

function setUpFromHighlight(highlight) {
    localStorage.setItem('highlight', JSON.stringify(highlight));
    if (Array.isArray(highlight.topLevelComments)) {
        fillInComments(highlight.topLevelComments);
    }

    // New comment
    var field = $(document).find('.commenting-field.main .textarea');

    var text = highlight.text;
    var id = highlight.id;

    var selectedText = document.createElement("h3", {class:'selectedText', id:'selectedText'});
    selectedText.innerHTML = `Adding comment for: <br>\"${text}\" ID:${id}<br><br>`;
    selectedText.className = "selectedText";
    selectedText.id = "selectedText";
    var container = $(document).find('.commenting-field.main');
    container.prepend(selectedText);

    localStorage.setItem('highlightIDFromServer', id);

    field.siblings('.control-row').show();
    field.parent().find('.close').show();
    field.parent().find('.upload.inline-button').hide();
    field.focus();
}

function saveComment(data, success, error) {
    // Convert pings to human readable format
    // $(data.pings).each(function(index, id) {     // TODO: If there is a profile page
    //     var user = usersArray.filter(function(user){return user.id == id})[0];
    //     data.content = data.content.replace('@' + id, '@' + user.fullname);
    // });

    console.log("Comment To Save (init-comments.js) = " + data.content);

    var highlight = JSON.parse(localStorage.getItem('highlight'));
    if (!highlight) {
        error();
        return;
    }
    var id = highlight.id;
    console.log("init-comments sees that the highlightIDFromServer = " + id);

    var commentArguments;
    if (data.parent) { // Is response/reply
        commentArguments = {
            topLevelCommentID : parseInt(data.parent),
            comment     : data.content,
        };
    } else {
        commentArguments = {
            highlightID : id,
            comment     : data.content,
        };
    }

    chrome.tabs.query({active:true, currentWindow:true}, function(tabs){
        chrome.tabs.sendMessage(tabs[0].id, {type:"createComment", message: commentArguments}, (response) => {
            response ? success(data) : error();
        });
    });
}

chrome.runtime.onMessage.addListener((arg, sender, response) => {
    switch (arg.type)
    {
        case 'setUpComments':
            setUp();
            response('Done');
            break;
        case 'fillInComments':
            if (arg.message) {
                setUpFromHighlight(arg.message);
                console.log(arg.message);
                response('Comments filled');
            }
            response();
            break;
        default:
            break;
    }
});

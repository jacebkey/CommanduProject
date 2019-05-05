// Rangy Globals
var serializedHighlights = decodeURIComponent(window.location.search.slice(window.location.search.indexOf("=") + 1));
var highlighter;
var highlighter2;
var initialDoc;

function sendHighlightToServer(tempClass, arg)
{
	// console.log("TOKEN FOUND ->\n" + getToken());

	var newHighlight;

	$.ajax({
		async: false,
		type: "POST",
		url: "https://api.swimfanatic.net:6443/highlights",
		data: JSON.stringify(arg),
		success: function(result){
			// console.log("Server sent back from highlight creation ->\n" + JSON.stringify(result, undefined, 2));
            newHighlight = result.newHighlight;

            if (tempClass === '.highlightTemp') {
                var object = $(tempClass).removeClass('highlightTemp');
                object.removeClass('highlightTemp');
                object.addClass(`highlight id:${newHighlight.id}`);
            } else if (tempClass === '.commentTemp') {
                var object = $(tempClass)
                object.removeClass('commentTemp');
                object.addClass(`comment id:${newHighlight.id}`);
            }

            establishClickListeners();
		},
		error: function(error){
			alert(JSON.stringify(error, undefined, 2)); },
		dataType: "json",
		contentType : "application/json",
		headers: {
			'Authorization': 'Bearer ' + getToken()
		}
	});

	//server returned valid highlight creation
	if (newHighlight) {
		return newHighlight;
	}

}

function isValidURL(url) {
    return !["?", "&"].some((sub) => url.includes(sub));
}

// Create safe to send url if url is valid
function encodeIfValidURL(url) {
    return isValidURL(url) ? encodeURIComponent(url) : undefined;
}

// Function to call to highlight selection
function highlightSelectedText()
{
    highlighter.highlightSelection("highlightTemp");

    var text = rangy.getSelection().toString();
    var commentsWithNoID = $('.highlightTemp:not([id])');
    var posted = false;
    for (let tag of commentsWithNoID)
    {
        //console.log("looped");
        if(~(text).indexOf(tag.innerHTML))
        {
            var comment = highlighter.getHighlightForElement(tag);
            var id = comment.id;


            //Find the rangy_selection
            var range = rangy.getSelection().getRangeAt(0);
            var wordCount = range.toString().trim().split(" ").length;
			// NOTE change variable to have different number of words surrounding
            var wordsPerContext = 4;

            //Rangy_selection_before = 3 words off of the normal selection
            range.moveStart("word", - wordsPerContext);

            //Rangy_selection_before = end at the front of the selection
            range.moveEnd("word", - wordCount);
            var wordsBefore = range.toString();

            range.moveStart("word", wordCount + wordsPerContext);
            range.moveEnd("word", wordsPerContext);
            var wordsAfter = range.toString();

			var commentArguments = {
				url			: comment.doc.location.href,
				text		: text,
				beforeText	: wordsBefore,   // Conext elems are optional but useful
				afterText	: wordsAfter,
				index		: id,
				//comment		: "Test initial comment",
			};

            if (!isValidURL(comment.doc.location.href)) {
                console.log('URL is not valid by server standards');
            } else {
                console.log("Will highlight ->\n" + JSON.stringify(commentArguments, undefined, 2));
                sendHighlightToServer('.highlightTemp', commentArguments);
            }
		}
	}
}

function sendCommentToServer(arg)
{
	console.log("TOKEN FOUND ->\n" + getToken());
    success = false;
	$.ajax({
		type: "POST",
		url: "https://api.swimfanatic.net:6443/comments/",
        data: JSON.stringify(arg),
        async: false,
		success: function(result){
            console.log("Server sent back from highlight creation ->\n" + JSON.stringify(result, undefined, 2));
            success = true;
        },
		error: function(error){
			alert(JSON.stringify(error, undefined, 2)); },
		dataType: "json",
		contentType : "application/json",
		headers: {
			'Authorization': 'Bearer ' + getToken()
		}
	});
    return success;
}

/***************************************************************************************************************************************************\
 * Function to call to comment on selection ********************************************************************************************************\
 * *************************************************************************************************************************************************\
 * Open and create sidebar so we can grab it from the DOM.
 * 'Highlight' the selection like normal -- this adds the class "comment" to the selection.
 * Grab sidebar from DOM as well as all tags with the comment class that do not have IDs.
 * Because they don't have IDs, we know that we haven't looked at these comments yet.
 * We shouldn't have any more than the one new comment that we just added but if the selection
 * spans across serveral HTML tags (e.g. across two or more paragraphs), there will be multiple
 * DOM elements returned. Thus, we need to loop over it. As we loop over it, we see if the
 * element's inner html text is a substring of the full text selection.
 *
 * We do this because we need the actual element in order to check the highlight properties such as ID.
 *
 * We only need to send one message (even in cases with multiple elements) to the sidebar iframe
 * so that's why I use a global bool to track that (frameLoaded). Cases with multiple elements are
 * assumed to be apart of the same selection.
 *
 * There were issues with the sidebar iframe not loading in time before the message containing the highlight ID was sent.
 * To get around this I add a function that is run when the frame is done loading to handle this beginning edge case that happens
 * upon every time the sidebar is opened. Potential performance improvements could come from simply hiding the sidebar instead of deleting it. (I think?)
 *
 * If the frame is already loaded then we can simply just send a message like normal.
 * We send over the highlight ID to be used in the creation of the comment to link these by this common identifier.
 *
 */
var frameLoaded = true;
function commentSelectedText()
{
    openSidebar();
    highlighter.highlightSelection("commentTemp", { exclusive:"false" });
    var frame = document.getElementById('mySidebar');
    var text = rangy.getSelection().toString();
    var commentsWithNoID = $('.commentTemp:not([id])');
    var posted = false;
    for (let tag of commentsWithNoID)
    {
        //console.log("looped");
        if(~(text).indexOf(tag.innerHTML))
        {
            var comment = highlighter.getHighlightForElement(tag);
            var id = comment.id;

            //Find the rangy_selection
            var range = rangy.getSelection().getRangeAt(0);
            var wordCount = range.toString().trim().split(" ").length;
			// NOTE change variable to have different number of words surrounding
            var wordsPerContext = 4;

            //Rangy_selection_before = 3 words off of the normal selection
            range.moveStart("word", - wordsPerContext);

            //Rangy_selection_before = end at the front of the selection
            range.moveEnd("word", - wordCount);
            var wordsBefore = range.toString();

            range.moveStart("word", wordCount + wordsPerContext);
            range.moveEnd("word", wordsPerContext);
            var wordsAfter = range.toString();

			var commentArguments = {
				url			: comment.doc.location.href,
				text		: text,
				beforeText	: wordsBefore,   // Conext elems are optional but useful
				afterText	: wordsAfter,
				index		: id,
			//	comment		: "Test initial comment",
			};

			var highlightReturned;
			if (!isValidURL(comment.doc.location.href)) {
                console.log('URL is not valid by server standards');
            } else {
                // console.log("Will highlight ->\n" + JSON.stringify(commentArguments, undefined, 2));
                highlightReturned = sendHighlightToServer('.commentTemp', commentArguments);
            }


			//now the function passes the highlight ID that the server makes to the sidebar

            // TODO: Fix this
            // Changing these tags in any way breaks rangy so don't do it
            // e.g. "tag.id = id;" will break things. I don't know why exactly.. it just does.
            // I think its due to how rangy handles their nonsense.
            // I almost guarantee it can be fixed within "rangy-highlighter.js".
            // This bug makes looking up the comments by ID difficult and makes the
            // whole getting comments with no id pointless.
            if(!posted)
            {
                frame.onload = function()
                {
                    chrome.runtime.sendMessage({ type: 'fillInComments', message: highlightReturned }, (response) => {});
                    frameLoaded = true;
                    posted = true;
                }
                if(frameLoaded)
                {
                    chrome.runtime.sendMessage({ type: 'fillInComments', message: highlightReturned }, (response) => {});

                    posted = true;
                }
            }
        }
    }
}

// https://stackoverflow.com/questions/7380190/select-whole-word-with-getselection
function snapSelectionToWord()
{
    var sel;

    // Check for existence of window.getSelection() and that it has a
    // modify() method. IE 9 has both selection APIs but no modify() method.
    if (window.getSelection && (sel = window.getSelection()).modify) {
        sel = window.getSelection();
        if (!sel.isCollapsed) {

            // Detect if selection is backwards
            var range = document.createRange();
            range.setStart(sel.anchorNode, sel.anchorOffset);
            range.setEnd(sel.focusNode, sel.focusOffset);
            var backwards = range.collapsed;
            range.detach();

            // modify() works on the focus of the selection
            var endNode = sel.focusNode, endOffset = sel.focusOffset;
            sel.collapse(sel.anchorNode, sel.anchorOffset);

            var direction = [];
            if (backwards) {
                direction = ['backward', 'forward'];
            } else {
                direction = ['forward', 'backward'];
            }

            sel.modify("move", direction[0], "character");
            sel.modify("move", direction[1], "word");
            sel.extend(endNode, endOffset);
            sel.modify("extend", direction[1], "character");
            sel.modify("extend", direction[0], "word");
        }
    } else if ( (sel = document.selection) && sel.type != "Control") {
        var textRange = sel.createRange();
        if (textRange.text) {
            textRange.expand("word");
            // Move the end back to not include the word's trailing space(s),
            // if necessary
            while (/\s$/.test(textRange.text)) {
                textRange.moveEnd("character", -1);
            }
            textRange.select();
        }
    }
}

var highlighter;
$(document).ready(function()
{

    //$('body').wrapInner('<div class="col-sm-auto" />');

    // Rangy initialization
    rangy.init();
    highlighter = rangy.createHighlighter();

    highlighter.addClassApplier(rangy.createClassApplier("commentTemp", {
        ignoreWhiteSpace: true,
        tagNames: ["span"]
    }));

    highlighter.addClassApplier(rangy.createClassApplier("highlightTemp", {
        ignoreWhiteSpace: true,
        tagNames: ["span"]
    }));

    // TODO [low priority]: Fix serialization -- doesn't work at all
    // if (serializedHighlights)
    // {
    //     highlighter.deserialize(serializedHighlights);
    // }

    //// End Rangy Init

    // For keeping track of when to hide the overlay
    var deleteMenu = false;

	// Create overlay images
	var highlightImg = document.createElement("IMG");
	highlightImg.src = chrome.extension.getURL("images/highlight.png");

	var commentImg = document.createElement("IMG");
	commentImg.src = chrome.extension.getURL("images/comment.png");

    // Create overlay buttons
    var highlightButton = document.createElement('button');
    highlightButton.setAttribute('id', 'highlight');
	highlightButton.setAttribute('class', 'buttonMenu');
	highlightButton.appendChild(highlightImg);

    var commentButton = document.createElement('button');
    commentButton.setAttribute('id', 'comment');
	commentButton.setAttribute('class', 'buttonMenu');
	commentButton.appendChild(commentImg);

    // Inject menu into page
    var popupMenu = document.createElement('span');
    popupMenu.setAttribute('class', 'popupMenu');
    popupMenu.appendChild(highlightButton);
    popupMenu.appendChild(commentButton);

    // Attach menu overlay to document
    document.body.appendChild(popupMenu);

    // Inject hidden elements for menu position tracking
    var c1 = document.createElement('div');
    c1.setAttribute('id', 'cal1');
    c1.innerHTML = "&nbsp;";
    var c2 = document.createElement('div');
    c2.setAttribute('id', 'cal2');
    c2.innerHTML = "&nbsp;";
    document.body.appendChild(c1);
    document.body.appendChild(c2);


    highlightButton.onclick = function()
    {
        //console.log("highlight");
        highlightSelectedText();
        popupMenu.style.display = 'none';
        deleteMenu = true;
    }
    commentButton.onclick = function()
    {
        //console.log("comment");
        commentSelectedText();
        popupMenu.style.display = 'none';
        deleteMenu = true;
    }

    // Highlight + Comment Logic
    var handler = function()
    {
        $(document.body).unbind("mouseup");
        popupMenu.style.display = 'none';
        //snapSelectionToWord();
        var selectedText = window.getSelection();

        var rel1= document.createRange();
        rel1.selectNode(document.getElementById('cal1'));
        var rel2= document.createRange();
        rel2.selectNode(document.getElementById('cal2'));

        // If we have selected text
        if(!selectedText.isCollapsed)
        {

            // Place popup menu relative to selection
            var r = selectedText.getRangeAt(0).getBoundingClientRect();
            var rb1 = rel1.getBoundingClientRect();
            var rb2 = rel2.getBoundingClientRect();
            popupMenu.style.top = (r.top - rb2.bottom)*100/(rb1.top-rb2.top) - 0 + 'px';
            popupMenu.style.left = (r.right - rb2.right)*100/(rb1.right-rb2.right) + 20 +  'px';

            // Display popup menu
            popupMenu.style.display = 'block';
        }

        // We don't have any selected text, therefore rebind mouseup event listener
        else
        {
            $(document.body).bind("mouseup", handler);
        }
    }

    $(document.body).bind("mouseup", handler);

    $(document.body).bind("mousedown", function()
    {
        //console.log("mousedown");
        if (deleteMenu)
        {
            //console.log("Delete Menu");
            $(document.body).bind("mouseup", handler);
        }
        deleteMenu = true;
    });

	// NOTE that token will be stored with sessionStorage
	//		https://stackoverflow.com/questions/44133536/is-it-safe-to-store-a-jwt-in-localstorage-with-reactjs
	//		Is more viewable but this does prevent CSRF which is good
	//			https://logrocket.com/blog/jwt-authentication-best-practices/
	//		->	https://stackoverflow.com/questions/26340275/where-to-save-a-jwt-in-a-browser-based-application-and-how-to-use-it

	saveToken = function(token)
	{
		localStorage.setItem('jwtToken', token);
	}

	getToken = function()
	{
		return localStorage.getItem('jwtToken');
    }

    destroyToken = function()
    {
        localStorage.removeItem('jwtToken');
    }

});

$(window).on("load", function() {
    toggleSidebar();

    // NOTE On every page load finish load all the comments
    if (!isValidURL(window.location.href)) {
        console.log(`Not loading for ${window.location.href}, not valid url.`)
        return;
    }

	$.ajax({
		type: "GET",
        url: "https://api.swimfanatic.net:6443/highlights?url=" + encodeIfValidURL(window.location.href),
        async: false,
		success: function(result){
            setTimeout(() => {
                setUp(result);
            }, 500); // runtime needs more time to load before sending a message
        },
		error: function(error){
            //alert(JSON.stringify(error, undefined, 2))
        },
		contentType : "application/json",
	});

	//NOTE trying to change this so it does not load on the tracking pages and others hidden in a page
	//if(window.location.href.indexOf(window.location.origin) == 0) {
	//	console.log(window.location.href.indexOf(window.location.origin) + " | Page Loaded -> " + window.location.href);
	//}
});

var highlights;
function setUp(result) {
    highlights = result.highlights;

    placeComments(result);
    establishClickListeners();
}

function establishClickListeners() {
    $(document).on('click', '.highlight', focusHighlight);
    $(document).on('click', '.comment', focusHighlight);
}

function focusHighlight(event) {
    var elem = $(event.target);
    var classes = elem[0].classList.value.split(' ');

    var id;
    for (const class_ of classes) {
        if (class_.indexOf("id:") !== -1) {
            id = class_.substring(3, class_.length);
            break;
        }
    }

    if (!id) {
        console.log('Could not find id class for selected highlight!');
        return;
    }

    if (highlights) {
        for (const highlight of highlights) {
            if (highlight.id == id) {
                $('#highlightFocused').attr('id', '');
                elem.attr('id','highlightFocused');

                openSidebar();
                chrome.runtime.sendMessage({ type: 'fillInComments', message: highlight }, (response) => {});

                break;
            }
        }
    }
}

function findTextInDocument(text, el) {
    el = el || document.body;

    let elementsFound = [];

    for (let i = 0; i < el.childNodes.length; i++) {
        let child = el.childNodes[i];

        if (child.nodeType == document.TEXT_NODE) {
            let found = child.textContent.search(text);
            if (found != -1) {
                elementsFound.push(child);

            }
        }else{
            elementsFound = elementsFound.concat(findTextInDocument(text, child));
        }
    }

    return elementsFound;
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

// TODO use the lighlightsList to find before and after tags
function placeComments(commentList)
{
    for (let highlight of commentList.highlights) {
        let searchText = highlight.text; //.replace(/\s:\s\d*$/g, "");
        let beforeText = highlight.beforeText;
        let afterText = highlight.afterText;
        //let found = findTextInDocument(highlight.beforeText + searchText + highlight.afterText);

        if (searchText.search(escapeRegExp(beforeText)) != -1)
            beforeText = "";

        if (searchText.search(escapeRegExp(afterText)) != -1)
            afterText = "";

		// console.log(JSON.stringify(highlight, undefined, 2));

        //console.log("Before = " + beforeText + " || String = " + searchText + " || After = " + afterText);

        // Solving duplication thing and indexing problem
        if (highlight.topLevelComments.length > 0 && highlight.topLevelComments !== [null]) {
            findAndReplaceDOMText(
                document.body, // (Element) The element or text-node to search within
                {
                    find: `${beforeText}${searchText}${afterText}`,
                    wrap: "span",
                    wrapClass: "wrap-exclude"
                }
            );

            findAndReplaceDOMText(
                document.body, // (Element) The element or text-node to search within
                {
                    find: searchText,
                    wrap: "span",
                    wrapClass: "wrap-content"
                }
            );

            if ($(".wrap-exclude").length == 0) {
                findAndReplaceDOMText(
                    document.body, // (Element) The element or text-node to search within
                    {
                        find: searchText,
                        wrap: "span",
                        wrapClass: `comment id:${highlight.id}`
                    }
                );
            }

            $(".wrap-exclude .wrap-content, .wrap-content .wrap-exclude").addClass(`comment id:${highlight.id}`);
            $(".wrap-exclude").removeClass("wrap-exclude");
            $(".wrap-content").removeClass("wrap-content");
        } else {
            findAndReplaceDOMText(
                document.body, // (Element) The element or text-node to search within
                {
                    find: `${beforeText}${searchText}${afterText}`,
                    wrap: "span",
                    wrapClass: "wrap-exclude"
                }
            );

            findAndReplaceDOMText(
                document.body, // (Element) The element or text-node to search within
                {
                    find: searchText,
                    wrap: "span",
                    wrapClass: "wrap-content"
                }
            );

            if ($(".wrap-exclude").length == 0) {
                findAndReplaceDOMText(
                    document.body, // (Element) The element or text-node to search within
                    {
                        find: searchText,
                        wrap: "span",
                        wrapClass: `highlight id:${highlight.id}`
                    }
                );
            }

            $(".wrap-exclude .wrap-content, .wrap-content .wrap-exclude").addClass(`highlight id:${highlight.id}`);
            $(".wrap-exclude").removeClass("wrap-exclude");
            $(".wrap-content").removeClass("wrap-content");
        }

        /*if (found.length > 0) {
            let txt = found[0];
            let split1 = txt.splitText(txt.textContent.search(searchText));
            let split2 = split1.splitText(searchText.length);

            let span = document.createElement("span");
            span.innerText = searchText;
            span.classList.add("highlight");
            split1.replaceWith(span);
        }*/
    }

	// console.log("HIGHLIGHTS LIST ->\n" + JSON.stringify(commentList, undefined, 2));
}

// Sidebar toggle using on and off functionality
var sidebarOpen = false;
function toggleSidebar()
{
    //console.log("toggle");
    if(sidebarOpen)
    {
        closeSidebar();
	}
    else
    {
        openSidebar();
    }
}

function openSidebar()
{
    //console.log("open");
    if(!sidebarOpen)
    {
        // This padding must match the width of sidebar (set in css below)
        $('head').css({
            'padding-right': '400px'
        });
        $('body').css({
            'padding-right': '400px'
        });
        var sidebar = document.createElement('iframe');
		sidebar.id = "mySidebar";
        sidebar.style.cssText = "\
            frameborder:0;\
            allowtransparency:false;\
			position:fixed;\
			top:0px;\
			right:0px;\
			width:400px;\
			height:100%;\
			background:white;\
			box-shadow:inset 0 0 1em black;\
            z-index:2147483647;\
        ";
        sidebar.src = chrome.runtime.getURL("commenadu-sidebar.html");

        // Animation (slide right)
        /*
            -webkit-animation: slideLeft .5s;\
            animation: slideLeft .5s;\
        */

        document.body.appendChild(sidebar);
		sidebarOpen = true;
    }
}

function closeSidebar()
{
    //console.log("close");
    if(sidebarOpen)
    {
        $('head').css({
            'padding-right': '0px'
        });
        $('body').css({
            'padding-right': '0px'
        });
        var el = document.getElementById('mySidebar');
		el.parentNode.removeChild(el);
        sidebarOpen = false;
        frameLoaded = false;
	}
}

// Listener for messages from sidebar iframe
chrome.runtime.onMessage.addListener((arg, sender, response) => {
    switch (arg.type)
    {
        case 'delete':
            var id = arg.message;
            var comments = $('.comment');
            for (const comment of comments)
            {
                var highlight = highlighter.getHighlightForElement(comment);
                if(highlight)
                {
                    if(highlight.id == id)
                    {
                        highlighter.removeHighlights( [highlight] );
                        window.getSelection().removeAllRanges();
                    }
                }
            }
            response("Comment deleted.");
            break;
        case 'getEncodedURL':
            response(encodeIfValidURL(arg.message));
            break;
        case 'getToken':
            response(getToken());
            break;
        case 'destroyToken':
            destroyToken();
            response('Token destroyed');
            break;
		case 'setToken':
            saveToken(arg.message);
            response("you have saved a token");
            break;
        case 'success':
            response("Message recieved: [SUCCESS]");
            break;
        case 'toggleSidebar':
            toggleSidebar();
            response();
            break;
		case 'createComment':
			response(sendCommentToServer(arg.message));
			break;
        default:
            break;
    }
});

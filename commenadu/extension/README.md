# Commenadu Chrome Extension

## Design

So the hierarchy is messy at the moment. The only requirement is that the "manifest.json" file is in the main directory. Everything else can be place wherever and however we want.

HOWEVER, you MUST make sure that the paths to the files is updated in "manifest.json" if you move anything around.

### manifest.json

One of the most important files in a chrome extension is the **<u>manifest.json</u>** file.

This file outlines everything about your extension such as permissions, icon locations, and javascript files that you will be using. The more important parameters are as follows:

<u>"background"</u> : Here you can define what scripts to run in the background of your extension as well as options such as persistence for the background scripts.

​	- Currently all background.js does is send a message to the main content script that is injected into each webpage telling it to toggle the comment sidebar on or off by clicking on the page action icon.

<u>"page_action"</u> : Here you can change what the extension icon looks like in the top right of the page as well as define what happens when you click the icon. You can treat it as a button (as we currently do) or you can even add in an option to open a small menu that contains whatever HTML file you want. This menu is treated completely separately from everything else so it will have it's own HTML, javascript files, CSS files, etc.

​	- Currently all we do is change the icon, label the tooltip, and use it in conjunction with the background script to toggle the comment sidebar. We have popup.html/js files but again these aren't in use at the time and just there as placeholders. We can delete these if we want.

<u>"options_page"</u> : Here you can define a completely separate options page. It also contains it's own separate HTML, javascript, CSS, etc. You can get to the options page by going to chrome://extensions, clicking on the 'details' button on the Commenadu extension and then scrolling down until you see 'Extension options'.

​	- Currently we define an options.html but it is a placeholder and completely blank.

<u>"content_scripts"</u> : Here we define all injected content. We change what pages these items get injected into with the "matches" option. We add the CSS files we want injected in the "css" option and similarly all the javascript files in the "javascript" option. The "all_frames" option is for iframe support.

​	- Currently we inject our js libraries, our CSS files, and our main content script (content.js) into every webpage.

<u>"web_accessible_resources</u>" : Here we define any other resources that the extension should have access to.

​	- We currently give access to all of our icons and the HTML page that is loaded into the comment sidebar iframe.

### content.js

This file is basically the majority of javascript code we have for the front end. We can rename it to whatever we want, split it up into multiple javascript files, etc. We just have to update the manifest file accordingly.

We use the rangy js library to handle text selection, highlighting (via rangy class applier), serialization of highlights, etc.

This file contains the code for displaying the popup menu, the popup menu's functionality, and displaying/hiding the comment sidebar iframe.

We use chrome's messaging system to send and receive messages between the page action (toggle sidebar) and the comment sidebar iframe as it is basically it's own independent HTML page.

We can communicate anything we need to in these messages and to my knowledge XSS vulnerability is reduced with this messaging system.

### jquery-comments.js

This is the javascript library for the comment system. Handles all that jazz.

I have had to make modifications though and will definitely need to continue to.

My large changes can be found by searching for "Ryan" in the file as I have attached comments to these.

Basically all I have changed is that now upon comment creation, the comment's HTML id is set to the rangy highlight id that was received from the content script in order to link them. I also send a message to remove the highlight/CSS on the selected text of a comment when the comment gets deleted and there are no other comments that refer to that same highlight. In order to do this I had to add functionality for chrome's messaging system so we can send and receive messages between these files.

### comments-data.js

So currently, the sidebar just populates the comment page with the comments found in this file.

The comments are stored in a JSON format.

We currently do not save any comments but I would imagine that this library probably has some support for it. If not, it shouldn't be too bad as the comments are already a JSON format.

If we can save the comments by adding the JSON of the comment to a file that is specific to that URL we can persist these comments.

## Testing

**Make sure you have the latest changes pulled from the repo before starting.**

### Setting up the testing environment:

1. ##### Open up Google Chrome

2. ##### Open two main tabs:

   - The Google Chrome extensions page:
     <chrome://extensions/>
   - The test.html page in the extension's directory:
     <file:///C:/Users/Ryan/Desktop/Class/cs445/commenadu/extension/test.html>
   - [OPTIONAL] The comment_test.html page in the extension's directory
     This page is the actual HTML that is loaded into the extension's  comment sidebar
     <file:///C:/Users/Ryan/Desktop/Class/cs445/commenadu/extension/comment_test.html>

3. If you **have not** already loaded the extension into your chrome extensions continue to **step 4**

   If you **have** already loaded the extension into your chrome extensions you may skip to **step 5**

4. ##### To load the extension:

   1. Navigate to your Chrome extensions page (<chrome://extensions/>)

   2. Toggle "Developer mode" ON with the toggle in the top right of the page.

   3. Click on "Load unpacked" which is located towards the top left of the page.

      1. A file interface window should open. Select the Commenadu extension folder directory.

         e.g. "\<path\>\commenadu\extension"

   4. Confirm that the Commenadu extension has been added to your extensions and that it is toggled ON

5. **Test Extension**

   1. Navigate to the test.html page you opened earlier
   2. If the extension is working:
      - The text of this basic HTML page is formatted
      - The Commenadu icon is present in the top right of the browser
      - When you click the Commenadu extension icon, the comment sidebar will be toggled on or off
      - When you highlight text, the highlight color is green and a menu should pop up that has two icons: one for highlighting and one for commenting

### "Test Cases" Checklist

   - ##### Text selection

     - Can I select the text that I want? Or is other text sometimes also selected?
     - Can I select text on local HTML files?
     - Can I select text on any website?
     - Can I select text across paragraphs/sections/etc. ?

   - Popup menu

     - Does the popup menu appear after I select the text?
     - Does the popup display close to my text selection? Or at least in a position that makes sense?
     - Does the style and look of the popup menu display the same on any website?
     - Do both buttons on the popup menu work? (Highlight + Comment)
     - Does the popup menu only appear when you expect it to? (after you select some text on a page)
     - Is there ever more than one popup menu displayed at one time?

   - Highlight functionality

     - Can I highlight my text selection?
     - Can I highlight across paragraphs/sections/etc. ?
     - Can I delete my highlights?
     - Can I extend a highlight by highlighting extra text as well as my original highlight?
     - Can I have "overlapping" highlights?
     - Do my highlights persist when I reload the page/restart the browser/etc. ?

   - Comment functionality

     - Can I add comments to my text selection?
     - Can I add comments without making a text selection?
     - Can I edit or delete my comments?
     - I should not be able to delete other's comments.
     - Can I respond to my own comments?
     - Can I respond to other's comments?
     - Can I like my own messages?
     - Can I like other's messages?
     - Can I tag other users in my comment?
     - Can I have multimedia such as a video in my comment?
     - Can I order the comments by date and popularity?
     - Can I toggle the comment sidebar on and off?
     - Does the sidebar work on any website?
     - Are my comments saved on a page-by-page basis?
     - Can I add as many comments as I want relating to a single text selection?
     - Can I add comments to my text selection even if the selection spans across different HTML elements (paragraphs/sections/etc.)?
     - **Can I have comments that  partially overlap other comments?**
     - **Can I have comments that completely overlap other comments?**
     - When I click on a text selection that has been commented on, does the sidebar open, scroll to the comment, highlight/pulse the comment, blur the other comments, and make the text selection's CSS more opaque?
     - When I click on a comment in the sidebar does the page scroll to the text selection, make the text selection's CSS more opaque, and have a visual connection between the two?
     - When I delete a comment and there is no other comments referring to a text selection, does the text selection return to normal? (no css, etc)
     - When I delete a comment but there is more comments referring to the same exact text selection, does the text selection stay the same? (keeps css, link to comments, etc.)
     - **When there are multiple comments on the same text selection (exact same highlight , partially overlapping highlight, and completely overlapping highlight), do all matching/linked comments get highlighted/pulsed, focused (not blurred), etc. ?**
     - Is there any CSS clashing on different websites?

### Connecting Front End and Backend

- Testing Steps
	- Open any website
		- To find do a search then look at URL's. Choose any that dont start with https:
	- Open Console (F12 -> Console)
	- Click extension icon
	- login/register an account
	- click highlight button
	- console will print the *4* words before and after along with rangy ID (can change number variable)
		- then refresh page to see the same highlight response from loading the page

- Errors and Notes

	- cant have more then one highlight per page
	- can only work on http pages
	- for work and latest quickfinds search for "// NOTE"

- Message Passing How To
	- To send a message must add the {type:"typeString", message:"messageContent"}
	- Message receive must have a switch case to catch all of the options possible (every listen is notified, so we switch to only do the one we want)

- Comment Creation Method
    - For this explination only (C = content.js, J = jquery-comments, I = init-comments, -> means messaged passed)
    - C     The comment button first creates the same arguments as a highlight
    - C     Then the arguments are passed to the createHighlight function
    - C     The highlight function ID from the server is returned
    - C->J  Message pass {the server's response of ID}
    - J     localStorage the ID
    - I     on blue button 'Send' click the localStorage is read and arguments created
    - I->C  The comment is made based on the arguments


## How to Run:
https://github.com/ryan-meyers/commenadu/wiki

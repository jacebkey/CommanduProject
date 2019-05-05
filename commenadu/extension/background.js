// chrome.runtime.onInstalled.addListener(function()
// {
//     // chrome.storage.sync.set({color: '#3aa757'}, function()
//     // {
//     //   console.log("The color is green.");
//     // });

//     chrome.declarativeContent.onPageChanged.removeRules(undefined, function()
//     {
//         chrome.declarativeContent.onPageChanged.addRules([
//         {
//             conditions: [new chrome.declarativeContent.PageStateMatcher({
//                             //pageUrl: {hostEquals: 'developer.chrome.com'},
//                         })],
//             actions: [new chrome.declarativeContent.ShowPageAction()]
//         }]);
//     });
// });

/*Put page action icon on all tabs*/
chrome.tabs.onUpdated.addListener(function(tabId)
{
    chrome.pageAction.show(tabId);
});

chrome.tabs.getSelected(null, function(tab)
{
    chrome.pageAction.show(tab.id);
});

/*Send request to current tab when page action is clicked*/
chrome.pageAction.onClicked.addListener(function(tab)
{
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs)
    {
        chrome.tabs.sendMessage(tabs[0].id, {type:"toggleSidebar"});
    });
});

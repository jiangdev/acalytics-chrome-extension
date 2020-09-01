chrome.runtime.onInstalled.addListener(function () {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
    chrome.declarativeContent.onPageChanged.addRules([
      {
        conditions: [
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: {
              pathContains: "scholar/stack",
              hostEquals: "scholars.umsystem.edu",
            },
          }),
        ],
        actions: [new chrome.declarativeContent.ShowPageAction()],
      },
    ])
  })
})

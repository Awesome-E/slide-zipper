let api = null
let browserAction = 'browserAction'
if (typeof browser !== 'undefined') {
  api = browser
} else if (typeof chrome !== 'undefined') {
  api = chrome
  browserAction = 'action'
}
let activeWindow = -1

api.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
  switch (request.type) {
    case 'icon-set': {
      console.log('icon', sender)
      api[browserAction].setIcon({ tabId: sender.tab.id, path: '/icons/pack-icon-64.png' })
      api[browserAction].setPopup({ tabId: sender.tab.id, popup: '/popup/index.html' })
      sendResponse('success')
      break
    }
    case 'conversion-request': {
      api.tabs.query({ active: true, currentWindow: true }, tabs => {
        const tab = tabs[0]
        if (!tab) return
        api.tabs.sendMessage(tab.id, { type: 'download', data: request.downloadType })
      })
      sendResponse('forwarding to page')
      break
    }
    case 'get-progress': {
      api.tabs.query({ active: true, currentWindow: true }, tabs => {
        const tab = tabs[0]
        if (!tab) return
        api.tabs.sendMessage(tab.id, { type: 'get-progress' })
      })
      sendResponse({ activeWindow })
    }
  }
})

api.tabs.onActivated.addListener(active => {
  console.log(active)
})
chrome.windows.onFocusChanged.addListener(id => {
  activeWindow = id
})

if (typeof module !== 'undefined') module.exports = {}

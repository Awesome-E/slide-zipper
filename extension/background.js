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
      api[browserAction].setIcon({ tabId: sender.tab.id, path: '/icons/pack-icon-64.png' })
      api[browserAction].setPopup({ tabId: sender.tab.id, popup: '/popup/index.html' })
      sendResponse('success')
      break
    }
    case 'text-set': {
      api[browserAction].setBadgeText({ tabId: sender.tab.id, text: request.data.text })
      api[browserAction].setBadgeBackgroundColor({ tabId: sender.tab.id, color: request.data.background })
      sendResponse('success')
      break
    }
    case 'conversion-request': {
      api.tabs.query({ active: true, currentWindow: true }, tabs => {
        const tab = tabs[0]
        if (!tab) return
        api.tabs.sendMessage(tab.id, { type: 'download', data: Object.assign({ format: request.downloadType }, request.options) })
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
      break
    }
    case 'cancel-download': {
      api.tabs.query({ active: true, currentWindow: true }, tabs => {
        const tab = tabs[0]
        if (!tab) return
        api.tabs.sendMessage(tab.id, { type: 'cancel-download' })
      })
      sendResponse('cancelling')
    }
  }
})

api.windows.getCurrent(window => {
  activeWindow = window.id
})
api.windows.onFocusChanged.addListener(id => {
  activeWindow = id
})

if (typeof module !== 'undefined') module.exports = {}

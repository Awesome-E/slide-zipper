let api = null
// let browserAction = 'browserAction'
if (typeof browser !== 'undefined') {
  api = browser
} else if (typeof chrome !== 'undefined') {
  api = chrome
  // browserAction = 'action'
}

api.runtime.sendMessage({ type: 'download', data: {} })

if (typeof module !== 'undefined') module.exports = {}

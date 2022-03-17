let api = null
if (typeof browser !== 'undefined') {
  api = browser
} else if (typeof chrome !== 'undefined') {
  api = chrome
}
let activeWindow = -1

const picker = document.getElementById('picker')
const progress = document.getElementById('progress-container')

document.body.addEventListener('click', e => {
  if (!e.target.classList.contains('picker-button')) return
  api.runtime.sendMessage({
    type: 'conversion-request',
    downloadType: e.target.dataset.value
  }, () => {})
})
document.getElementById('progress-label').addEventListener('click', e => {
  // Cancel Active Tab Download
  api.runtime.sendMessage({
    type: 'cancel-download'
  }, () => {})
})

function updateProgress (value, label) {
  picker.style.display = 'none'
  progress.style.display = 'block'
  document.querySelector('progress').value = value
  document.getElementById('progress-label').innerText = label
}

api.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
  if (request.type !== 'progress-update') return
  const isFromActiveTab = sender.tab.windowId === activeWindow && sender.tab.active
  console.log(sender.tab.windowId, activeWindow, sender.tab.active)
  if (!isFromActiveTab) return
  if (!request.data) {
    picker.style.display = 'block'
    progress.style.display = 'none'
    return
  }
  updateProgress(request.data.value, request.data.label)
  sendResponse('received')
})

api.runtime.sendMessage({
  type: 'get-progress'
}, response => {
  activeWindow = response.activeWindow
})

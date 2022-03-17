/* eslint-disable no-unused-vars, no-undef */
let api = null
if (typeof chrome !== 'undefined') api = chrome
if (typeof browser !== 'undefined') api = browser

let currentlyActive = false
let lastUpdate = null

function sendUpdate (value, label) {
  lastUpdate = { value, label }
  api.runtime.sendMessage({
    type: 'progress-update',
    data: lastUpdate
  }, () => {})
}

function download (format) {
  console.log(`Initiating ${format} download...`)

  // Get list of Slide IDs
  const slideIdList = [...document.querySelectorAll('.punch-filmstrip-thumbnail defs[cursor] + g[id*="filmstrip-slide"]')]
    .map(x => x.id.replace(/^filmstrip-slide-\d+-/, ''))

  function cycleDownload (list, index = 0) {
    const current = list[index]
    if (!current) {
      sendUpdate(index / list.length, 'Creating ZIP Archive')
      // Zipping files
      zip.generateAsync({ type: 'blob' })
        .then(content => {
          saveAs(content, `${document.title.replace(/ - Google Slides$/, '')}.zip`)
          currentlyActive = false
          lastUpdate = null
          api.runtime.sendMessage({ type: 'progress-update', data: lastUpdate })
        })
      return
    }
    index++
    fetch(`https://docs.google.com/presentation/d/1bnBP7zM5GhcEv1yLMisdAtGCGtPoD9IIX9ueBNCSJt0/export/${format}?id=1bnBP7zM5GhcEv1yLMisdAtGCGtPoD9IIX9ueBNCSJt0&pageid=${current}`).then(r => r.blob()).then(data => {
      // Add slide to ZIP
      zip.file(`slide${index}.${format}`, data)
      sendUpdate(index / list.length, `Downloading slides (${index}/${list.length})`)
      cycleDownload(list, index)
    })
  }

  const zip = new JSZip()
  cycleDownload(slideIdList)
}

function init (format) {
  currentlyActive = true

  // Scroll to bottom of slides to load everything
  const containerParent = document.querySelector('.punch-filmstrip-scroll')
  const pickerContainer = containerParent.querySelector('svg.punch-filmstrip-thumbnails')
  const height = parseInt(pickerContainer.getAttribute('height'))
  containerParent.scrollTo(0, height)

  sendUpdate(0, 'Starting Download')

  setTimeout(() => download(format), 1000)
}

api.runtime.sendMessage({ type: 'icon-set', data: 'pack-icon-48.png' }, () => {})
api.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'download': {
      init(message.data)
      break
    }
    case 'get-progress': {
      api.runtime.sendMessage({
        type: 'progress-update',
        data: lastUpdate
      }, () => {})
      sendResponse('sending update...')
      break
    }
  }
})

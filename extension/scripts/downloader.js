/* eslint-disable no-unused-vars, no-undef */
let api = null
if (typeof chrome !== 'undefined') api = chrome
if (typeof browser !== 'undefined') api = browser

let currentlyActive = false
let lastUpdate = null
const presentationId = location.href.match(/\/d\/([^/]+)/)[1]

function sendUpdate (value, label) {
  if (value != null && label != null) lastUpdate = { value, label }
  api.runtime.sendMessage({
    type: 'progress-update',
    data: lastUpdate
  }, () => {})
}

function download (format, includeSkipped) {
  console.log(`Initiating ${format} download...`)

  // Get list of Slide IDs
  const slideIdList = [...document.querySelectorAll('.punch-filmstrip-thumbnail defs[cursor] + g[id*="filmstrip-slide"]')]
    .filter(elm => includeSkipped || !elm.nextElementSibling) // If next element sibling exists, slide is hidden
    .map(x => x.id.replace(/^filmstrip-slide-\d+-/, ''))

  function cycleDownload (list, index = 0) {
    const current = list[index]
    if (!currentlyActive) return
    if (!current) {
      sendUpdate(index / list.length, 'Creating ZIP Archive')
      // Zipping files
      zip.generateAsync({ type: 'blob' })
        .then(content => {
          if (!currentlyActive) return
          saveAs(content, `${document.title.replace(/ - Google Slides$/, '')}.zip`)
          currentlyActive = false
          lastUpdate = null
          api.runtime.sendMessage({ type: 'progress-update', data: lastUpdate })
        })
      return
    }
    index++
    fetch(`https://docs.google.com/presentation/d/${presentationId}/export/${format}?id=${presentationId}&pageid=${current}`).then(r => r.blob()).then(data => {
      if (!currentlyActive) return
      // Add slide to ZIP
      zip.file(`slide${index}.${format}`, data)
      sendUpdate(index / list.length, `Downloading slides (${index}/${list.length})`)
      cycleDownload(list, index)
    })
  }

  const zip = new JSZip()
  cycleDownload(slideIdList)
}

function init (options) {
  if (document.readyState !== 'complete') return

  currentlyActive = true

  // Scroll to bottom of slides to load everything
  const containerParent = document.querySelector('.punch-filmstrip-scroll')
  const pickerContainer = containerParent.querySelector('svg.punch-filmstrip-thumbnails')
  const height = parseInt(pickerContainer.getAttribute('height'))
  containerParent.scrollTo(0, height)

  sendUpdate(0, 'Starting Download')

  setTimeout(() => download(options.format, options.includeSkipped), 1000)
}

window.addEventListener('beforeunload', () => sendUpdate())

api.runtime.sendMessage({ type: 'icon-set', data: 'pack-icon-48.png' }, () => {})
api.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'download': {
      init(message.data)
      break
    }
    case 'get-progress': {
      sendUpdate()
      sendResponse('sending update...')
      break
    }
    case 'cancel-download': {
      currentlyActive = false
      lastUpdate = null
      sendUpdate()
      break
    }
  }
})

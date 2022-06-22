/* eslint-disable no-unused-vars, no-undef */
let api = null
if (typeof chrome !== 'undefined') api = chrome
if (typeof browser !== 'undefined') api = browser

let currentlyActive = false
let currentExportId = null
let lastUpdate = null
const presentationId = location.href.match(/\/d\/([^/]+)/)[1]

function sendUpdate (value, label) {
  if (value != null && label != null) lastUpdate = { value, label }
  api.runtime.sendMessage({
    type: 'progress-update',
    data: lastUpdate
  }, () => {})
}

function download (id, format, includeSkipped, matchList) {
  console.log(`Initiating ${format} download...`)
  const slideList = matchList.filter(slide => includeSkipped || !slide.skip)

  function cycleDownload (list, index = 0) {
    const current = list[index]
    if (!currentlyActive || currentExportId !== id) return
    if (!current) {
      sendUpdate(index / list.length, 'Creating ZIP Archive')
      // Zipping files
      zip.generateAsync({ type: 'blob' })
        .then(content => {
          if (!currentlyActive || currentExportId !== id) return
          api.runtime.sendMessage({ type: 'text-set', data: { text: '', color: '#fff' } }, () => {})
          saveAs(content, `${document.title.replace(/ - Google Slides$/, '')}.zip`)
          currentlyActive = false
          lastUpdate = null
          api.runtime.sendMessage({ type: 'progress-update', data: lastUpdate })
        })
      return
    }
    const currentId = current.id
    index++
    fetch(`https://docs.google.com/presentation/d/${presentationId}/export/${format}?id=${presentationId}&pageid=${currentId}`).then(r => r.blob()).then(data => {
      if (!currentlyActive || currentExportId !== id) return
      // Add slide to ZIP
      zip.file(`slide${index}.${format}`, data)
      sendUpdate(index / list.length, `Downloading slides (${index}/${list.length})`)
      cycleDownload(list, index)
    })
  }

  const zip = new JSZip()
  cycleDownload(slideList)
}

function init (options) {
  if (document.readyState !== 'complete') return

  currentExportId = Date.now().toString(36)
  currentlyActive = true

  sendUpdate(0, 'Starting Download')

  const firstLetter = options.format[0].toUpperCase()
  const backgroundColors = {
    S: '#139a0e',
    P: '#d51d10',
    J: '#5383ec'
  }
  api.runtime.sendMessage({ type: 'text-set', data: { text: firstLetter, color: '#fff', background: backgroundColors[firstLetter] } }, () => {})

  const errors = []
  fetch(`https://docs.google.com/presentation/d/${presentationId}/edit`).then(r => r.text()).then(data => {
    const idMatcher = '(p|g[a-zA-Z0-9_]{8,25})(?=:notes)'
    const expression = new RegExp(`DOCS_modelChunk\\s=\\s?\\[(?:.(?!;\\s?DOCS))*${idMatcher}(?:.(?!;\\s?DOCS))*\\]`, 'g')
    const matches = data.match(expression).map(instance => {
      const id = instance.match(new RegExp(idMatcher, 'g'))[0]
      try {
        const data = JSON.parse(instance.replace(/^DOCS_modelChunk\s?=\s?/, ''))
        const slideMetadata = data.find(item => item[1] === id)
        const skippedSlide = slideMetadata[4][5] === 0
        return { id, data, skip: skippedSlide }
      } catch (e) {
        errors.push(e)
        return { id, data: instance }
      }
    })
    if (errors.length > 0) {
      sendUpdate(0, 'Error!')
      return setTimeout(() => {
        currentlyActive = false
        lastUpdate = null
        api.runtime.sendMessage({ type: 'text-set', data: { text: '', color: '#fff' } }, () => {})
        sendUpdate()
      }, 1000)
    }
    download(currentExportId, options.format, options.includeSkipped, matches)
  })
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
      api.runtime.sendMessage({ type: 'text-set', data: { text: '', color: '#fff' } }, () => {})
      sendUpdate()
      break
    }
  }
})

/* eslint-disable no-unused-vars, no-undef */
let api = null
if (typeof chrome !== 'undefined') api = chrome
if (typeof browser !== 'undefined') api = browser

function download () {
  const slideIdList = [...document.querySelectorAll('.punch-filmstrip-thumbnail defs[cursor] + g[id*="filmstrip-slide"]')].map(x => x.id.replace(/^filmstrip-slide-\d+-/, ''))

  function cycleDownload (list, index = 0) {
    const current = list[index]
    if (!current) {
      // Zipping files
      zip.generateAsync({ type: 'blob' })
        .then(content => saveAs(content, 'Slides.zip'))
      return
    }
    index++
    console.log('fetching slide ' + index)
    fetch('https://docs.google.com/presentation/d/1bnBP7zM5GhcEv1yLMisdAtGCGtPoD9IIX9ueBNCSJt0/export/svg?id=1bnBP7zM5GhcEv1yLMisdAtGCGtPoD9IIX9ueBNCSJt0&pageid=' + current).then(r => r.blob()).then(data => {
      // Add slide to ZIP
      zip.file(`slide${index}.svg`, data)
      cycleDownload(list, index)
    })
  }

  const zip = new JSZip()
  cycleDownload(slideIdList)
}

// api.runtime.sendMessage({ type: 'get-site-packages' }, data => console.log(data))
api.runtime.onMessage.addListener(message => {
  if (message.type !== 'download') return
  console.log(message, download)
})

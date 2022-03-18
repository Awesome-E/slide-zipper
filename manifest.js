module.exports = function (isFF) {
  const manifest = {
    name: 'Slide Zipper',
    description: 'A browser extension that allows you to download a ZIP file containing images of each slide in a Google Slides Presentation',
    version: '0.1',
    host_permissions: ['https://docs.google.com/'],
    permissions: ['storage'],
    web_accessible_resources: [],
    background: isFF ? { scripts: ['background.js'] } : { service_worker: 'background.js' },
    content_scripts: [
      {
        matches: ['https://docs.google.com/presentation/*'],
        js: ['scripts/jszip.js', 'scripts/downloader.js']
      }
    ],
    icons: {
      16: 'icons/pack-icon-16.png',
      32: 'icons/pack-icon-32.png',
      48: 'icons/pack-icon-48.png'
    },
    minimum_chrome_version: '80.0.3987',
    manifest_version: isFF ? 2 : 3 // ,
    // options_page: './options/index.html'
  }
  if (isFF) manifest.browser_specific_settings = { gecko: { id: '{90bbe48f-041c-4953-a664-2bd5f4e647e4}' } }
  manifest[isFF ? 'browser_action' : 'action'] = {
    default_title: 'Slide Zipper',
    default_icon: 'icons/pack-icon-inactive-64.png',
    default_popup: ''
  }
  return manifest
}

module.exports = function (isFF) {
  const manifest = {
    name: 'Slide Zipper',
    description: 'Allows you to download a ZIP file of each slide of a Google Slide as an image',
    version: '0.1',
    host_permissions: ['https://docs.google.com/'],
    permissions: [],
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
  if (isFF) manifest.browser_specific_settings = { gecko: { id: '{b8f1f5ea-0b21-47d1-bb89-d2e41507819a}' } }
  manifest[isFF ? 'browser_action' : 'action'] = {
    default_title: 'Homebrew Finder',
    default_icon: 'icons/pack-icon-inactive-64.png',
    default_popup: ''
  }
  return manifest
}

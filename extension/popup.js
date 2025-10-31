/* globals chrome */
'use strict'

document.addEventListener('DOMContentLoaded', () => {
  console.debug('popup.js: DOMContentLoaded Event fired')

  document.querySelector('#config').addEventListener('click', () => {
    console.debug('popup.js: #config click() fired')
    window.open(chrome.runtime.getURL('options.html'))
  })

  document.querySelector('#about').addEventListener('click', () => {
    console.debug('popup.js: #about click() fired')
    window.open('https://github.com/buggyj/saveTiddlers')
  })
})

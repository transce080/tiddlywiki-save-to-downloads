/* globals chrome */
'use strict'

document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('#config').addEventListener('click', () => {
    window.open(chrome.runtime.getURL('options.html'))
  })

  document.querySelector('#about').addEventListener('click', () => {
    window.open('https://github.com/buggyj/saveTiddlers')
  })
})

(function () {
  'use strict'
  document.querySelector('form').addEventListener('submit', event => {
    event.preventDefault()
    const input = event.target.querySelector('input'); const error = event.target.querySelector('[role="alert"]')
    try {
      location.href = window.QijieBrowserNavigation.resolveAddress(input.value)
    } catch (failure) { error.textContent = failure.message; error.hidden = false; input.focus() }
  })
})()

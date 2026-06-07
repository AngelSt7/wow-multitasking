console.log('[Wow Multitasking] Service worker loaded')

self.addEventListener('install', () => {
	console.log('[Wow Multitasking] Service worker install event')
})

self.addEventListener('activate', () => {
	console.log('[Wow Multitasking] Service worker activate event')
})

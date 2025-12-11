const arr = [] // particles
const c = document.querySelector('canvas')
const ctx = c.getContext('2d')
const cw = (c.width = 3000)
const ch = (c.height = 3000)
const c2 = c.cloneNode(true) //document.querySelector(".fixed-bg").append(c2);
const ctx2 = c2.getContext('2d', { willReadFrequently: true })

// Funkcja do obliczania pozycji latarni względem viewportu
function getViewportToCanvasCoords(vx, vy) {
	const rect = c.getBoundingClientRect()
	const scaleX = cw / rect.width
	const scaleY = ch / rect.height
	return {
		x: (vx - rect.left) * scaleX,
		y: (vy - rect.top) * scaleY
	}
}

// Draw text "Happy New 2026" on canvas
ctx2.fillStyle = '#fff'
ctx2.font = 'bold 350px Arial, sans-serif'
ctx2.textAlign = 'center'
ctx2.textBaseline = 'middle'
ctx2.fillText('Happy New 2026', cw / 2, ch / 2)

for (let i = 0; i < 1300; i++) makeFlake(i, true)

function makeFlake(i, ff) {
	arr.push({ i: i, x: 0, x2: 0, y: 0, s: 0 })
	arr[i].t = gsap
		.timeline({ repeat: -1, repeatRefresh: true })
		.fromTo(
			arr[i],
			{
				x: () => -400 + (cw + 800) * Math.random(),
				y: -15,
				s: () => gsap.utils.random(1.8, 7),
				x2: -500,
			},
			{
				ease: 'none',
				y: ch,
				x: (i, target) => target.x + gsap.utils.random(-400, 400),
				x2: 500,
			}
		)
		.seek(ff ? Math.random() * 99 : 0) // fast-forward to fill initial state
		.timeScale(arr[i].s / 55) // time scale based on flake size (zwolnione padanie)
}

ctx.fillStyle = '#fff'

// Optymalizacja renderowania z GSAP ticker
let lastFrameTime = 0
const targetFPS = 60
const frameInterval = 1000 / targetFPS

function optimizedRender() {
	const now = performance.now()
	if (now - lastFrameTime >= frameInterval) {
		lastFrameTime = now
		render()
	}
}

// Użyj GSAP ticker dla lepszej synchronizacji z animacjami
gsap.ticker.add(optimizedRender)

// Latarnia - pozycja i parametry (prawy górny róg viewportu)
let lanternX = 0
let lanternBaseY = 0
const lanternHeight = 300
let windTime = 0
let isRendering = false
let enableTextCollision = false // Kolizja z tekstem aktywna dopiero po zniknięciu timera

// Funkcja do aktualizacji pozycji latarni
function updateLanternPosition() {
	const rect = c.getBoundingClientRect()
	// Pozycja w viewport: prawy górny róg (95% od prawej, 5% od góry)
	const viewportX = window.innerWidth * 0.95
	const viewportY = window.innerHeight * 0.05
	const coords = getViewportToCanvasCoords(viewportX, viewportY)
	lanternX = coords.x
	lanternBaseY = coords.y
}

// Inicjalizacja pozycji latarni
updateLanternPosition()

// Throttling dla resize (optymalizacja wydajności)
let resizeTimeout
window.addEventListener('resize', () => {
	clearTimeout(resizeTimeout)
	resizeTimeout = setTimeout(() => {
		updateLanternPosition()
	}, 100)
})

function render() {
	if (isRendering) return
	isRendering = true
	
	ctx.clearRect(0, 0, cw, ch)
	
	// Aktualizuj czas wiatru (synchronizacja z animacją śniegu)
	windTime += 0.01
	const windSway = Math.sin(windTime) * 5 // Kołysanie od wiatru (5 stopni)
	
	// Pozycja źródła światła (w latarni)
	const lightSourceX = lanternX
	const lightSourceY = lanternBaseY - lanternHeight + 30
	
	// Rysuj światło z latarni padające w dół (stożek światła)
	ctx.save()
	ctx.translate(lightSourceX, lightSourceY)
	ctx.rotate((windSway * Math.PI) / 180) // Światło kołysze się razem z latarnią
	
	// Tworzenie gradientu stożkowego (światło padające w dół)
	const lightGradient = ctx.createLinearGradient(0, 0, 0, ch)
	lightGradient.addColorStop(0, 'rgba(255, 255, 200, 0.5)')
	lightGradient.addColorStop(0.1, 'rgba(255, 255, 200, 0.4)')
	lightGradient.addColorStop(0.3, 'rgba(255, 255, 200, 0.25)')
	lightGradient.addColorStop(0.6, 'rgba(255, 255, 200, 0.15)')
	lightGradient.addColorStop(1, 'rgba(255, 255, 200, 0)')
	
	// Rysuj stożek światła
	ctx.fillStyle = lightGradient
	ctx.beginPath()
	ctx.moveTo(-300, 0) // Szerokość u góry
	ctx.lineTo(300, 0)
	ctx.lineTo(800, ch) // Szerokość u dołu
	ctx.lineTo(-800, ch)
	ctx.closePath()
	ctx.fill()
	
	// Dodatkowy efekt świetlny (promień)
	const radialGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 200)
	radialGradient.addColorStop(0, 'rgba(255, 255, 200, 0.6)')
	radialGradient.addColorStop(0.5, 'rgba(255, 255, 200, 0.3)')
	radialGradient.addColorStop(1, 'rgba(255, 255, 200, 0)')
	
	ctx.fillStyle = radialGradient
	ctx.beginPath()
	ctx.arc(0, 0, 200, 0, Math.PI * 2)
	ctx.fill()
	
	ctx.restore()
	
	// Rysuj cząsteczki śniegu
	arr.forEach(c => {
		// Kolizja z tekstem tylko po zniknięciu timera
		if (enableTextCollision && c.t) {
			if (c.t.isActive()) {
				const d = ctx2.getImageData(c.x + c.x2, c.y, 1, 1)
				if (d.data[3] > 150 && Math.random() > 0.5) {
					c.t.pause()
					if (arr.length < 9000) makeFlake(arr.length, false)
				}
			}
		}
		ctx.fillStyle = '#fff'
		ctx.beginPath()
		ctx.arc(
			c.x + c.x2,
			c.y,
			c.s * gsap.utils.interpolate(1, 0.2, c.y / ch),
			0,
			Math.PI * 2
		)
		ctx.fill()
	})
	
	isRendering = false
}

// Timer do nowego roku
function getNewYearDate() {
	const now = new Date()
	const currentYear = now.getFullYear()
	// Nowy rok następnego roku o północy (1 stycznia)
	const newYear = new Date(currentYear + 1, 0, 1, 0, 0, 0, 0)
	return newYear
}

let countdownFinished = false

function updateCountdown() {
	if (countdownFinished) return
	
	const now = new Date()
	const newYear = getNewYearDate()
	const diff = newYear - now
	
	if (diff <= 0) {
		// Nowy rok nadszedł! Ukryj timer z animacją
		countdownFinished = true
		const countdownContainer = document.querySelector('.countdown-container')
		if (countdownContainer) {
			gsap.to(countdownContainer, {
				opacity: 0,
				scale: 0.8,
				duration: 1,
				ease: 'power2.in',
				onComplete: () => {
					countdownContainer.style.display = 'none'
					// Włącz kolizję z tekstem po zniknięciu timera
					enableTextCollision = true
				}
			})
		}
		return
	}
	
	const days = Math.floor(diff / (1000 * 60 * 60 * 24))
	const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
	const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
	const seconds = Math.floor((diff % (1000 * 60)) / 1000)
	
	document.getElementById('days').textContent = String(days).padStart(2, '0')
	document.getElementById('hours').textContent = String(hours).padStart(2, '0')
	document.getElementById('minutes').textContent = String(minutes).padStart(2, '0')
	document.getElementById('seconds').textContent = String(seconds).padStart(2, '0')
}

// Inicjalizacja timera
updateCountdown()
setInterval(updateCountdown, 1000)

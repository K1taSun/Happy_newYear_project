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
		.timeScale(arr[i].s / 100) // time scale based on flake size (zwolnione padanie)
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


gsap.ticker.add(optimizedRender)

// Latarnia - pozycja i parametry (prawy górny róg viewportu)
let lanternX = 0
let lanternBaseY = 0
const lanternHeight = 300
let windTime = 0
let isRendering = false
let enableTextCollision = false // Kolizja z tekstem aktywna dopiero po zniknięciu timera
let lightIntensity = 1.0 // Intensywność światła (1.0 = pełna, 0.0 = zgaszona)



const fireworks = [] // Tablica cząsteczek fajerwerków
let fireworksActive = false
let fireworksStartTime = 0
const FIREWORKS_DURATION = 24 * 60 * 60 * 1000 // 24 godziny w milisekundach (1 dzień)
const MAX_PARTICLES = 2500 // Limit cząsteczek dla stabilnego 60 FPS
let lastFireworkTime = 0
let fireworkInterval = 800

// Cache kolorów dla wydajności
const colorCache = new Map()
function hexToRgba(hex, alpha) {
	// Zaokrąglamy alpha do 2 miejsc po przecinku dla lepszego cache'owania
	const a = Math.round(alpha * 100) / 100
	const key = `${hex}-${a}`
	if (colorCache.has(key)) return colorCache.get(key)
	
	const r = parseInt(hex.slice(1, 3), 16)
	const g = parseInt(hex.slice(3, 5), 16)
	const b = parseInt(hex.slice(5, 7), 16)
	const rgba = `rgba(${r}, ${g}, ${b}, ${a})`
	colorCache.set(key, rgba)
	// Czyść cache jeśli za duży
	if (colorCache.size > 1000) colorCache.clear()
	return rgba
}

function createFirework(x, y) {
	if (fireworks.length > MAX_PARTICLES) return
	
	const colors = [
		'#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
		'#ff8800', '#8800ff', '#ff0088', '#88ff00', '#0088ff', '#ffffff'
	]
	const color = colors[Math.floor(Math.random() * colors.length)]
	
	// Losuj typ wybuchu (z większą szansą na duże saluty)
	// 50% szans na duży, 30% na średni, 20% na mały
	const explosionType = Math.random()
	let particleCount, speedBase, sizeBase, decayBase
	
	if (explosionType < 0.5) {
		// Duży wybuch (50% szans)
		particleCount = 200 + Math.random() * 100 // Dużo cząsteczek
		speedBase = 10 // Duży zasięg
		sizeBase = 3 // Większe cząsteczki
		decayBase = 0.008 // Dłuższy czas trwania (wolniejszy zanik)
	} else if (explosionType < 0.8) {
		// Średni wybuch (30% szans)
		particleCount = 100 + Math.random() * 50
		speedBase = 7
		sizeBase = 2
		decayBase = 0.015
	} else {
		// Mały wybuch (20% szans)
		particleCount = 50 + Math.random() * 40
		speedBase = 4
		sizeBase = 1.5
		decayBase = 0.025
	}
	
	for (let i = 0; i < particleCount; i++) {
		const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5
		const speed = 2 + Math.random() * speedBase
		
		fireworks.push({
			x: x,
			y: y,
			vx: Math.cos(angle) * speed,
			vy: Math.sin(angle) * speed,
			life: 1.0,
			decay: decayBase + Math.random() * 0.005,
			size: sizeBase + Math.random() * 2,
			color: color
		})
	}
}

function updateFireworks() {
	if (!fireworksActive) return
	
	const now = Date.now()
	if (now - fireworksStartTime > FIREWORKS_DURATION) {
		fireworksActive = false
		fireworks.length = 0
		return
	}
	
	// Nowe wybuchy
	if (now - lastFireworkTime > fireworkInterval) {
		lastFireworkTime = now
		fireworkInterval = 400 + Math.random() * 1000 // Losowy interwał 0.4s - 1.4s
		createFirework(
			cw * 0.1 + Math.random() * cw * 0.8, // Szerokość 10% - 90%
			ch * 0.1 + Math.random() * ch * 0.4  // Wysokość 10% - 50%
		)
	}
	
	// Aktualizacja cząsteczek
	for (let i = fireworks.length - 1; i >= 0; i--) {
		const f = fireworks[i]
		f.x += f.vx
		f.y += f.vy
		f.vy += 0.08 // Grawitacja
		f.vx *= 0.98 // Opór
		f.vy *= 0.98
		f.life -= f.decay
		
		if (f.life <= 0 || f.y > ch) {
			fireworks.splice(i, 1) // Usuń martwe
		}
	}
}

function drawFireworks() {
	if (fireworks.length === 0) return
	
	ctx.save()
	// Grupujemy rysowanie (nie idealne, ale szybsze niż zmiana stylu dla każdego punktu)
	fireworks.forEach(f => {
		ctx.fillStyle = hexToRgba(f.color, f.life)
		
		// Używamy fillRect zamiast arc dla wydajności (małe kwadraty wyglądają jak punkty)
		if (f.size < 3) {
			ctx.fillRect(f.x, f.y, f.size, f.size)
		} else {
			ctx.beginPath()
			ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2)
			ctx.fill()
		}
	})
	ctx.restore()
}

function startFireworks() {
	fireworksActive = true
	fireworksStartTime = Date.now()
	createFirework(cw / 2, ch / 3) // Pierwszy wybuch
}

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
	
	// Tworzenie gradientu stożkowego (światło padające w dół) z kontrolą intensywności
	const lightGradient = ctx.createLinearGradient(0, 0, 0, ch)
	lightGradient.addColorStop(0, `rgba(255, 255, 200, ${0.5 * lightIntensity})`)
	lightGradient.addColorStop(0.1, `rgba(255, 255, 200, ${0.4 * lightIntensity})`)
	lightGradient.addColorStop(0.3, `rgba(255, 255, 200, ${0.25 * lightIntensity})`)
	lightGradient.addColorStop(0.6, `rgba(255, 255, 200, ${0.15 * lightIntensity})`)
	lightGradient.addColorStop(1, 'rgba(255, 255, 200, 0)')
	
	// Rysuj stożek światła tylko jeśli lampka nie jest zgaszona
	if (lightIntensity > 0) {
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
		radialGradient.addColorStop(0, `rgba(255, 255, 200, ${0.6 * lightIntensity})`)
		radialGradient.addColorStop(0.5, `rgba(255, 255, 200, ${0.3 * lightIntensity})`)
		radialGradient.addColorStop(1, 'rgba(255, 255, 200, 0)')
		
		ctx.fillStyle = radialGradient
		ctx.beginPath()
		ctx.arc(0, 0, 200, 0, Math.PI * 2)
		ctx.fill()
	}
	
	ctx.restore()
	
	// Aktualizuj i rysuj fajerwerki
	if (fireworksActive) {
		updateFireworks()
		drawFireworks()
	}
	
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
	
	// testowy nowy rok	
	//const newYear = new Date(2025, 11, 11, 2, 10, 0, 0) 
															

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
					// Rozpocznij animację migania lampki
					startLanternBlinking()
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

// Funkcja do migania lampki
function startLanternBlinking() {
	// Obiekt do animacji
	const lightObj = { intensity: 1.0 }
	
	// Animacja migania: kilka szybkich mignięć, potem zgaszenie
	const blinkTimeline = gsap.timeline({
		onUpdate: () => {
			lightIntensity = lightObj.intensity
		},
		onComplete: () => {
			lightIntensity = 0 // Zgaś lampkę na końcu
		}
	})
	
	// 5 mignięć (włącz-wyłącz)
	for (let i = 0; i < 5; i++) {
		blinkTimeline.to(lightObj, { intensity: 0, duration: 0.1, ease: 'power2.in' })
		blinkTimeline.to(lightObj, { intensity: 1, duration: 0.1, ease: 'power2.out' })
	}
	
	// Na końcu zgaś lampkę i uruchom timer do fajerwerków
	blinkTimeline.to(lightObj, { 
		intensity: 0, 
		duration: 0.3, 
		ease: 'power2.in',
		onComplete: () => {
			lightIntensity = 0
			// Uruchom fajerwerki po 3 sekundach (3000 ms) od zgaszenia lampki
			setTimeout(startFireworks, 3000)
		}
	})
}

// Inicjalizacja timera
updateCountdown()
setInterval(updateCountdown, 1000)

"use client"

import { AudioConverter } from "@/components/audio-converter"
import { Preview } from "@/components/preview"
import { RecordControls } from "@/components/record-controls"
import { Waveform } from "@/components/waveform"
import { fmtTime } from "@/utils"
import { useCallback, useEffect, useRef, useState } from "react"

export default function VoiceRecorderPage() {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const audioPlayerRef = useRef<HTMLAudioElement>(null)
	const mediaRecorderRef = useRef<MediaRecorder | null>(null)
	const chunksRef = useRef<Blob[]>([])
	const streamRef = useRef<MediaStream | null>(null)
	const analyserRef = useRef<AnalyserNode | null>(null)
	const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null)
	const animFrameRef = useRef<number>(0)
	const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
	const startTimeRef = useRef<number>(0)
	const audioBlobRef = useRef<Blob | null>(null)
	const audioURLRef = useRef<string>("")

	const [recording, setRecording] = useState(false)
	const [playing, setPlaying] = useState(false)
	const [elapsed, setElapsed] = useState(0)
	const [status, setStatus] = useState("ready")
	const [hasRecording, setHasRecording] = useState(false)
	const [progress, setProgress] = useState(0)
	const [duration, setDuration] = useState(0)

	const resizeCanvas = useCallback(() => {
		const canvas = canvasRef.current
		if (!canvas) return
		canvas.width = canvas.offsetWidth * window.devicePixelRatio
		canvas.height = canvas.offsetHeight * window.devicePixelRatio
	}, [])

	const drawIdle = useCallback(() => {
		const canvas = canvasRef.current
		if (!canvas) return
		resizeCanvas()
		const ctx = canvas.getContext("2d")
		if (!ctx) return
		const w = canvas.width,
			h = canvas.height
		ctx.clearRect(0, 0, w, h)
		ctx.strokeStyle = "rgba(148,163,184,0.25)"
		ctx.lineWidth = 1
		ctx.beginPath()
		ctx.moveTo(0, h / 2)
		ctx.lineTo(w, h / 2)
		ctx.stroke()
	}, [resizeCanvas])

	const drawWave = useCallback(() => {
		const analyser = analyserRef.current
		const dataArray = dataArrayRef.current
		const canvas = canvasRef.current
		if (!analyser || !dataArray || !canvas) return
		animFrameRef.current = requestAnimationFrame(drawWave)
		analyser.getByteTimeDomainData(dataArray)
		const ctx = canvas.getContext("2d")
		if (!ctx) return
		const w = canvas.width,
			h = canvas.height
		ctx.clearRect(0, 0, w, h)
		ctx.strokeStyle = "#f87171"
		ctx.lineWidth = 1.5 * window.devicePixelRatio
		ctx.beginPath()
		const sliceW = w / dataArray.length
		let x = 0
		for (let i = 0; i < dataArray.length; i++) {
			// Fix 2: nullish coalesce to 128 (silence) if index is somehow undefined
			const sample = dataArray[i] ?? 128
			const v = sample / 128.0
			const y = (v * h) / 2
			i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
			x += sliceW
		}
		ctx.lineTo(w, h / 2)
		ctx.stroke()
	}, [])

	useEffect(() => {
		drawIdle()
		window.addEventListener("resize", drawIdle)
		return () => window.removeEventListener("resize", drawIdle)
	}, [drawIdle])

	const handleStop = useCallback(() => {
		const blob = new Blob(chunksRef.current, { type: "audio/webm" })
		audioBlobRef.current = blob
		const url = URL.createObjectURL(blob)
		audioURLRef.current = url
		const player = audioPlayerRef.current
		if (player) {
			player.src = url
			player.onloadedmetadata = () => setDuration(player.duration)
		}
		setHasRecording(true)
		setStatus(`recorded ${fmtTime(elapsed)}`)
	}, [elapsed])

	const toggleRecord = useCallback(async () => {
		if (!recording) {
			try {
				const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
				streamRef.current = stream
				const audioCtx = new (
					window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
				)()
				const analyser = audioCtx.createAnalyser()
				analyser.fftSize = 2048
				analyserRef.current = analyser
				// Fix 1 continued: ArrayBuffer constructor ensures correct type
				dataArrayRef.current = new Uint8Array(new ArrayBuffer(analyser.fftSize))
				const src = audioCtx.createMediaStreamSource(stream)
				src.connect(analyser)

				const mr = new MediaRecorder(stream)
				mediaRecorderRef.current = mr
				chunksRef.current = []
				mr.ondataavailable = (e) => chunksRef.current.push(e.data)
				mr.onstop = handleStop
				mr.start()

				setRecording(true)
				setStatus("recording…")
				setElapsed(0)
				startTimeRef.current = Date.now()
				timerIntervalRef.current = setInterval(() => {
					setElapsed((Date.now() - startTimeRef.current) / 1000)
				}, 100)
				drawWave()
			} catch {
				setStatus("mic access denied")
			}
		} else {
			mediaRecorderRef.current?.stop()
			streamRef.current?.getTracks().forEach((t) => t.stop())
			cancelAnimationFrame(animFrameRef.current)
			if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
			setRecording(false)
			setStatus("processing…")
			drawIdle()
		}
	}, [recording, handleStop, drawWave, drawIdle])

	const togglePlay = useCallback(() => {
		const player = audioPlayerRef.current
		if (!player || !audioURLRef.current) return
		if (playing) {
			player.pause()
			setPlaying(false)
		} else {
			player.play()
			setPlaying(true)
		}
	}, [playing])

	const seekAudio = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
		const player = audioPlayerRef.current
		if (!player || !player.duration) return
		const rect = e.currentTarget.getBoundingClientRect()
		const pct = (e.clientX - rect.left) / rect.width
		player.currentTime = pct * player.duration
	}, [])

	const downloadRecording = useCallback(() => {
		if (!audioBlobRef.current) return
		const a = document.createElement("a")
		a.href = audioURLRef.current
		a.download = `recording-${Date.now()}.webm`
		a.click()
	}, [])

	useEffect(() => {
		const player = audioPlayerRef.current
		if (!player) return
		const onTimeUpdate = () => {
			if (!player.duration) return
			setProgress((player.currentTime / player.duration) * 100)
		}
		const onEnded = () => {
			setPlaying(false)
			setProgress(0)
		}
		player.addEventListener("timeupdate", onTimeUpdate)
		player.addEventListener("ended", onEnded)
		return () => {
			player.removeEventListener("timeupdate", onTimeUpdate)
			player.removeEventListener("ended", onEnded)
		}
	}, [])

	return (
		<main className="flex min-h-screen items-center justify-center bg-neutral-950 p-6 font-mono">
			<div className="w-full max-w-md space-y-5">
				<p className="text-[10px] tracking-[0.15em] text-neutral-500 uppercase">voice recorder</p>

				<Waveform ref={canvasRef} />

				<RecordControls recording={recording} elapsed={elapsed} status={status} onToggle={toggleRecord} />

				<Preview
					ref={audioPlayerRef}
					playing={playing}
					hasRecording={hasRecording}
					progress={progress}
					duration={duration}
					onTogglePlay={togglePlay}
					onSeek={seekAudio}
					onDownload={downloadRecording}
				/>

				<AudioConverter blob={audioBlobRef.current} originalName="recording" />
			</div>
		</main>
	)
}

"use client"

import { cn } from "@/utils/classname"
import { FFmpeg } from "@ffmpeg/ffmpeg"
import { fetchFile } from "@ffmpeg/util"
import { useRef, useState } from "react"

type Format = "wav" | "mp3" | "ogg"

interface Props extends React.ComponentProps<"div"> {
	blob: Blob | null
	originalName?: string
}

export function AudioConverter({ blob, originalName = "recording", className, ...props }: Props) {
	const ffmpegRef = useRef<FFmpeg | null>(null)
	const [loading, setLoading] = useState(false)
	const [progress, setProgress] = useState(0)
	const [format, setFormat] = useState<Format>("wav")

	const load = async () => {
		if (ffmpegRef.current) return
		const ff = new FFmpeg()
		ff.on("progress", ({ progress }) => setProgress(Math.round(progress * 100)))
		await ff.load()
		ffmpegRef.current = ff
	}

	const convert = async () => {
		if (!blob) return
		setLoading(true)
		setProgress(0)
		try {
			await load()
			const ff = ffmpegRef.current!

			await ff.writeFile("input.webm", await fetchFile(blob))

			const args: Record<Format, string[]> = {
				wav: ["-i", "input.webm", "-ar", "22050", "-ac", "1", "output.wav"],
				mp3: ["-i", "input.webm", "-ar", "44100", "-ac", "2", "-b:a", "192k", "output.mp3"],
				ogg: ["-i", "input.webm", "-ar", "44100", "-ac", "2", "-q:a", "4", "output.ogg"],
			}

			await ff.exec(args[format])
			const data = await ff.readFile(`output.${format}`)
			const converted = new Blob([data as BlobPart], { type: `audio/${format}` })

			const url = URL.createObjectURL(converted)
			const a = document.createElement("a")
			a.href = url
			a.download = `${originalName}-${Date.now()}.${format}`
			a.click()
			URL.revokeObjectURL(url)
		} finally {
			setLoading(false)
			setProgress(0)
		}
	}

	const formats: Format[] = ["wav", "mp3", "ogg"]

	return (
		<div className={cn("flex items-center gap-2", className)} {...props}>
			{/* Format picker */}
			<div className="flex overflow-hidden rounded-lg border border-neutral-700">
				{formats.map((f) => (
					<button
						key={f}
						onClick={() => setFormat(f)}
						className={[
							"px-3 py-1.5 text-xs transition-colors",
							format === f ? "bg-neutral-700 text-neutral-100" : "text-neutral-500 hover:bg-neutral-800",
						].join(" ")}
					>
						{f}
					</button>
				))}
			</div>

			{/* Convert + download button */}
			<button
				onClick={convert}
				disabled={!blob || loading}
				className="flex items-center gap-1.5 rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-500 transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-30"
			>
				{loading ? (
					<>
						<span className="h-2 w-2 animate-spin rounded-full border border-neutral-500 border-t-transparent" />
						{progress > 0 ? `${progress}%` : "loading…"}
					</>
				) : (
					<>
						<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
							<path d="M6 1v7M3 5l3 3 3-3M1 10h10" strokeLinecap="round" strokeLinejoin="round" />
						</svg>
						export .{format}
					</>
				)}
			</button>
		</div>
	)
}

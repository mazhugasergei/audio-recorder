import { fmtTime } from "@/utils"

interface Props extends React.ComponentProps<"audio"> {
	playing: boolean
	hasRecording: boolean
	progress: number
	duration: number
	onTogglePlay: () => void
	onSeek: (e: React.MouseEvent<HTMLDivElement>) => void
	onDownload: () => void
}

export function Preview({ playing, hasRecording, progress, duration, onTogglePlay, onSeek, onDownload, ref }: Props) {
	return (
		<div className="space-y-3 rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
			<p className="text-[10px] tracking-[0.12em] text-neutral-600 uppercase">preview</p>

			<div className="flex items-center gap-3">
				{/* Play/Pause */}
				<button
					onClick={onTogglePlay}
					disabled={!hasRecording}
					aria-label={playing ? "Pause" : "Play"}
					className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-700 text-neutral-300 transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-30"
				>
					{playing ? (
						<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
							<rect x="2" y="2" width="4" height="10" rx="1" />
							<rect x="8" y="2" width="4" height="10" rx="1" />
						</svg>
					) : (
						<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
							<path d="M3 2.5l9 4.5-9 4.5V2.5z" />
						</svg>
					)}
				</button>

				{/* Progress bar */}
				<div className="h-1 flex-1 cursor-pointer rounded-full bg-neutral-800" onClick={onSeek}>
					<div
						className="pointer-events-none h-full rounded-full bg-neutral-400 transition-[width] duration-100"
						style={{ width: `${progress}%` }}
					/>
				</div>

				{/* Duration */}
				<span className="min-w-10 text-right text-xs text-neutral-600 tabular-nums">{fmtTime(duration)}</span>

				{/* Download */}
				<button
					onClick={onDownload}
					disabled={!hasRecording}
					className="flex items-center gap-1.5 rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-500 transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-30"
				>
					<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
						<path d="M6 1v7M3 5l3 3 3-3M1 10h10" strokeLinecap="round" strokeLinejoin="round" />
					</svg>
					save
				</button>
			</div>

			<audio ref={ref} className="hidden" />
		</div>
	)
}

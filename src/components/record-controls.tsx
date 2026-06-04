import { fmtTime } from "@/utils"

interface Props extends React.ComponentProps<"button"> {
	recording: boolean
	elapsed: number
	status: string
	onToggle: () => void
}

export function RecordControls({ recording, elapsed, status, onToggle }: Props) {
	return (
		<div className="flex items-center gap-4">
			<button
				onClick={onToggle}
				className={[
					"flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm transition-colors duration-150",
					recording
						? "border-red-400 bg-red-400/5 text-red-400 hover:bg-red-400/10"
						: "border-neutral-700 text-neutral-300 hover:bg-neutral-800",
				].join(" ")}
			>
				<span className={["h-2 w-2 rounded-full bg-current", recording ? "animate-pulse" : ""].join(" ")} />
				{recording ? "Stop" : "Record"}
			</button>

			<span className="min-w-12 text-sm text-neutral-400 tabular-nums">{fmtTime(elapsed)}</span>

			<span className="ml-auto text-xs text-neutral-600">{status}</span>
		</div>
	)
}

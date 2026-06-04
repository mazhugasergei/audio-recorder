export function Waveform({ ref }: React.ComponentProps<"canvas">) {
	return (
		<div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900">
			<canvas ref={ref} className="block h-20 w-full" />
		</div>
	)
}

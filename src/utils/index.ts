export function fmtTime(s: number): string {
	const m = Math.floor(s / 60)
	return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`
}

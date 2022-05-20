export function debounceByTime(
	fn: (...args: any[]) => any,
	timeout = 100
): (...args: any[]) => any {
	let timer: number;
	return (...args: any[]) => {
		window.clearTimeout(timer);
		timer = window.setTimeout(() => {
			fn.call(this, ...args);
		}, timeout);
	};
}

export function debounceByFrame(fn: (...args: any[]) => any): (...args: any[]) => any {
	let timer: number;
	return (...args: any[]) => {
		window.cancelAnimationFrame(timer);
		timer = window.requestAnimationFrame(() => {
			fn.call(this, ...args);
		});
	};
}

export default debounceByFrame;

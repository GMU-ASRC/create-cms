export type RecurrenceFrequency = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export type EventOccurrence = { start: Date; end: Date };

const maxOccurrences = 500;

function parseDay(value: unknown): Date | null {
	if (typeof value !== 'string' || !value.trim()) return null;
	const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
	if (!match) return null;
	return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function addInterval(date: Date, frequency: RecurrenceFrequency, interval: number): Date {
	const next = new Date(date);
	if (frequency === 'daily') next.setDate(next.getDate() + interval);
	else if (frequency === 'weekly') next.setDate(next.getDate() + interval * 7);
	else if (frequency === 'monthly') next.setMonth(next.getMonth() + interval);
	else if (frequency === 'yearly') next.setFullYear(next.getFullYear() + interval);
	return next;
}

export function eventOccurrences(
	doc: Record<string, unknown>,
	rangeStart: Date,
	rangeEnd: Date
): EventOccurrence[] {
	const start = parseDay(doc.date);
	if (!start) return [];
	const end = parseDay(doc.endDate) ?? start;
	const duration = end.getTime() - start.getTime();

	const recurrence = (doc.recurrence ?? {}) as {
		frequency?: string;
		interval?: number;
		until?: string;
	};
	const frequency = (recurrence.frequency ?? 'none') as RecurrenceFrequency;

	if (frequency === 'none') {
		return start <= rangeEnd && end >= rangeStart ? [{ start, end }] : [];
	}

	const interval = Math.max(1, Number(recurrence.interval) || 1);
	const until = parseDay(recurrence.until) ?? rangeEnd;
	const occurrences: EventOccurrence[] = [];
	let occurrenceStart = start;
	let count = 0;

	while (occurrenceStart <= rangeEnd && occurrenceStart <= until && count < maxOccurrences) {
		const occurrenceEnd = new Date(occurrenceStart.getTime() + duration);
		if (occurrenceEnd >= rangeStart) {
			occurrences.push({ start: occurrenceStart, end: occurrenceEnd });
		}
		occurrenceStart = addInterval(occurrenceStart, frequency, interval);
		count++;
	}

	return occurrences;
}

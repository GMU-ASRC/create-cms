export type EventStatusValue = 'Upcoming' | 'Ongoing' | 'Past' | 'Recurring';

export function dayNumber(value: unknown): number | null {
	if (typeof value !== 'string') return null;
	const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
	if (!match) return null;
	return Number(match[1]) * 10000 + Number(match[2]) * 100 + Number(match[3]);
}

function todayNumber(): number {
	const now = new Date();
	return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
}

function recurrenceFrequency(doc: Record<string, unknown>): string {
	const recurrence = (doc.recurrence ?? {}) as { frequency?: string };
	return recurrence.frequency ?? 'none';
}

function recurrenceEnded(doc: Record<string, unknown>): boolean {
	const recurrence = (doc.recurrence ?? {}) as { until?: string };
	const until = dayNumber(recurrence.until);
	if (until === null) return false;
	return todayNumber() > until;
}

export function eventStatus(doc: Record<string, unknown>): EventStatusValue | '' {
	const start = dayNumber(doc.date);
	if (start === null) return '';
	if (recurrenceFrequency(doc) !== 'none') {
		return recurrenceEnded(doc) ? 'Past' : 'Recurring';
	}
	const end = dayNumber(doc.endDate) ?? start;
	const today = todayNumber();
	if (today < start) return 'Upcoming';
	if (today > end) return 'Past';
	return 'Ongoing';
}

export function eventIsPast(doc: Record<string, unknown>): boolean {
	return eventStatus(doc) === 'Past';
}

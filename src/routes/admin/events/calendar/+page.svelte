<script lang="ts">
	import Icon from '@iconify/svelte';
	import { eventOccurrences } from '$lib/recurrence';

	let { data } = $props();

	const today = new Date();
	let viewYear = $state(today.getFullYear());
	let viewMonth = $state(today.getMonth());

	const monthLabel = $derived(
		new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
	);

	function isSameDay(a: Date, b: Date): boolean {
		return (
			a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
		);
	}

	type DayCell = {
		date: Date;
		inMonth: boolean;
		isToday: boolean;
		events: Array<{ id: string; title: string }>;
	};

	const days = $derived.by(() => {
		const firstOfMonth = new Date(viewYear, viewMonth, 1);
		const gridStart = new Date(firstOfMonth);
		gridStart.setDate(gridStart.getDate() - firstOfMonth.getDay());

		const cells: DayCell[] = [];
		for (let i = 0; i < 42; i++) {
			const date = new Date(gridStart);
			date.setDate(gridStart.getDate() + i);
			cells.push({
				date,
				inMonth: date.getMonth() === viewMonth,
				isToday: isSameDay(date, today),
				events: []
			});
		}
		const gridEnd = cells[cells.length - 1].date;

		for (const doc of data.events) {
			const occurrences = eventOccurrences(doc, gridStart, gridEnd);
			for (const occurrence of occurrences) {
				for (const cell of cells) {
					if (cell.date >= occurrence.start && cell.date <= occurrence.end) {
						cell.events.push({ id: doc.id, title: String(doc.title ?? '(untitled)') });
					}
				}
			}
		}
		return cells;
	});

	function prevMonth() {
		if (viewMonth === 0) {
			viewMonth = 11;
			viewYear -= 1;
		} else {
			viewMonth -= 1;
		}
	}

	function nextMonth() {
		if (viewMonth === 11) {
			viewMonth = 0;
			viewYear += 1;
		} else {
			viewMonth += 1;
		}
	}

	function goToday() {
		viewYear = today.getFullYear();
		viewMonth = today.getMonth();
	}
</script>

<svelte:head><title>Events Calendar | CREATE CMS</title></svelte:head>

<a
	href="/admin/events"
	class="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-gmu-green"
>
	<Icon icon="mdi:arrow-left" width="16" />
	Events
</a>
<h1 class="page-title mt-2">Events Calendar</h1>
<p class="page-subtitle">All events, including recurring occurrences.</p>

<div class="card mt-6 p-4">
	<div class="flex items-center justify-between gap-3">
		<button type="button" class="btn-secondary" onclick={prevMonth} aria-label="Previous month">
			<Icon icon="mdi:chevron-left" width="18" />
		</button>
		<div class="flex items-center gap-3">
			<span class="text-lg font-semibold text-slate-900">{monthLabel}</span>
			<button type="button" class="btn-secondary" onclick={goToday}>Today</button>
		</div>
		<button type="button" class="btn-secondary" onclick={nextMonth} aria-label="Next month">
			<Icon icon="mdi:chevron-right" width="18" />
		</button>
	</div>

	<div
		class="mt-4 grid grid-cols-7 gap-px overflow-hidden rounded-t-lg border border-b-0 border-slate-200 bg-slate-200 text-xs font-semibold text-muted uppercase"
	>
		{#each ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as label (label)}
			<div class="bg-slate-50 px-2 py-1.5 text-center">{label}</div>
		{/each}
	</div>
	<div class="grid grid-cols-7 gap-px overflow-hidden rounded-b-lg border border-slate-200 bg-slate-200">
		{#each days as cell (cell.date.getTime())}
			<div class="flex min-h-28 flex-col gap-1 bg-white p-1.5 {cell.inMonth ? '' : 'bg-slate-50'}">
				<span
					class="text-xs font-medium {cell.isToday
						? 'flex h-5 w-5 items-center justify-center rounded-full bg-gmu-green text-white'
						: cell.inMonth
							? 'text-slate-500'
							: 'text-slate-300'}"
				>
					{cell.date.getDate()}
				</span>
				<div class="flex flex-col gap-1 overflow-y-auto">
					{#each cell.events as event (event.id + cell.date.getTime())}
						<a
							href={`/admin/events/${event.id}`}
							class="truncate rounded bg-gmu-green-light px-1.5 py-0.5 text-xs font-medium text-gmu-green hover:bg-gmu-green hover:text-white"
							title={event.title}
						>
							{event.title}
						</a>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>

import { writable } from 'svelte/store';

export type ConfirmOptions = {
	title?: string;
	message: string;
	confirmLabel?: string;
	cancelLabel?: string;
	danger?: boolean;
};

type ConfirmRequest = ConfirmOptions & { resolve: (value: boolean) => void };

export const confirmRequest = writable<ConfirmRequest | null>(null);

export function confirmAction(options: ConfirmOptions | string): Promise<boolean> {
	const resolved = typeof options === 'string' ? { message: options } : options;
	return new Promise((resolve) => {
		confirmRequest.set({ ...resolved, resolve });
	});
}

export async function confirmSubmit(
	event: SubmitEvent,
	options: ConfirmOptions | string
): Promise<void> {
	const form = event.currentTarget as HTMLFormElement | null;
	if (!form) return;
	if (form.dataset.confirmed === 'true') {
		delete form.dataset.confirmed;
		return;
	}
	event.preventDefault();
	if (await confirmAction(options)) {
		form.dataset.confirmed = 'true';
		form.requestSubmit();
	}
}

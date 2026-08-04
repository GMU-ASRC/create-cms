<script lang="ts">
	import Icon from '@iconify/svelte';

	let { data } = $props();

	let copied = $state(false);

	function copyBaseUrl() {
		navigator.clipboard.writeText(data.origin);
		copied = true;
		setTimeout(() => (copied = false), 1500);
	}

	const exampleDocs: Record<string, unknown> = {
		siteInfo: {
			id: '64f1a2b3c4d5e6f7a8b9c0d1',
			logo: '/api/files/64f1a2b3c4d5e6f7a8b9c0aa',
			labName: 'CREATE Lab',
			labFullName: 'Collaborative Robotics, Embedded AI, and Teaming Environments Lab',
			institution: 'George Mason University',
			tagline: 'Building autonomous systems that work alongside people.',
			intro: 'We research embedded AI, multi-robot teaming, and human-robot collaboration.',
			heroImages: ['/api/files/64f1a2b3c4d5e6f7a8b9c0ab'],
			showAccessibility: true,
			alerts: [
				{
					message: 'Applications for Fall 2026 are open.',
					level: 'info',
					link: '/apply',
					linkText: 'Apply now',
					dismissible: true,
					active: true
				}
			],
			highlights: [],
			links: [{ href: 'https://cec.gmu.edu', icon: 'mdi:school-outline' }],
			contact: {
				department: 'Electrical and Computer Engineering',
				address: ['4400 University Dr', 'Fairfax, VA 22030'],
				email: 'create@gmu.edu'
			}
		},
		news: [
			{
				id: '64f1a2b3c4d5e6f7a8b9c0e2',
				title: 'CREATE Lab wins best paper at ICRA 2026',
				author: 'Jane Doe',
				date: '2026-05-14',
				body: '<p>Our paper on multi-robot coordination was recognized...</p>',
				linkType: 'article',
				slug: 'icra-2026-best-paper',
				gallery: [],
				files: []
			}
		],
		events: [
			{
				id: '64f1a2b3c4d5e6f7a8b9c0f3',
				title: 'Robotics Open House',
				linkType: 'article',
				slug: 'robotics-open-house',
				date: '2026-09-10',
				endDate: '',
				recurrence: { frequency: 'none' },
				location: 'Fairfax, VA',
				summary: '<p>Tour the lab and see live demos.</p>',
				image: '/api/files/64f1a2b3c4d5e6f7a8b9c0f4',
				content: '<p>Doors open at 10am...</p>',
				tags: ['open house', 'demos'],
				teamMembers: [],
				links: [{ label: 'Register', href: 'https://example.com/rsvp' }],
				gallery: [],
				files: []
			}
		],
		projects: [
			{
				id: '64f1a2b3c4d5e6f7a8b9c105',
				title: 'Swarm Coordination for Search and Rescue',
				summary: '<p>Decentralized coordination for multi-robot search.</p>',
				years: '2023-Present',
				featured: true,
				tags: ['swarm robotics', 'planning'],
				image: '/api/files/64f1a2b3c4d5e6f7a8b9c106',
				content: '<p>Full write-up of the project...</p>',
				teamMembers: [],
				funding: ['NSF'],
				links: [{ label: 'Paper', href: 'https://example.com/paper.pdf' }],
				gallery: [],
				files: [],
				relatedPublications: [],
				linkType: 'page',
				href: '',
				slug: 'swarm-coordination-search-rescue',
				order: 0
			}
		],
		researchArticles: [
			{
				id: '64f1a2b3c4d5e6f7a8b9c117',
				slug: 'swarm-coordination-search-rescue',
				title: 'Swarm Coordination for Search and Rescue',
				author: 'Jane Doe',
				status: 'Active',
				image: '/api/files/64f1a2b3c4d5e6f7a8b9c106',
				content: '<p>Extended research write-up...</p>',
				gallery: [],
				files: [],
				relatedPublications: []
			}
		],
		publications: [
			{
				id: '64f1a2b3c4d5e6f7a8b9c128',
				type: 'Conference Paper',
				title: 'Decentralized Task Allocation for Robot Swarms',
				authors: 'J. Doe, A. Smith',
				venue: 'ICRA 2026',
				date: '2026-05',
				doi: '10.1109/ICRA.2026.0001',
				pdf: '/api/files/64f1a2b3c4d5e6f7a8b9c129',
				award: 'Best Paper Award'
			}
		],
		team: [
			{
				id: '64f1a2b3c4d5e6f7a8b9c13a',
				name: 'Jane Doe',
				slug: 'jane-doe',
				role: 'professor',
				group: '',
				period: '',
				areaOfStudy: 'Robotics',
				photo: '/api/files/64f1a2b3c4d5e6f7a8b9c13b',
				note: '',
				bio: '<p>Jane leads the CREATE Lab...</p>',
				education: [{ degree: 'Ph.D., Robotics', institution: 'Carnegie Mellon University', years: '2014' }],
				email: 'jdoe',
				socials: [{ kind: 'scholar', href: 'https://scholar.google.com/citations?user=abc', icon: '' }],
				order: 0
			}
		],
		sponsors: [
			{
				id: '64f1a2b3c4d5e6f7a8b9c14c',
				name: 'National Science Foundation',
				image: '/api/files/64f1a2b3c4d5e6f7a8b9c14d',
				order: 0
			}
		],
		gallery: [
			{
				id: '64f1a2b3c4d5e6f7a8b9c15e',
				title: 'Lab demo day',
				image: '/api/files/64f1a2b3c4d5e6f7a8b9c15f',
				order: 0
			}
		]
	};

	function exampleFor(key: string): string {
		return JSON.stringify(exampleDocs[key] ?? [], null, 2);
	}
</script>

<div class="card space-y-3 p-5">
	<div class="flex items-center gap-2.5">
		<Icon icon="mdi:api" width="22" class="text-slate-400" />
		<h2 class="text-base font-semibold text-slate-900">Public content API</h2>
	</div>
	<p class="text-sm text-muted">
		Read-only JSON endpoints the public website (or any other client) can call to pull published content.
		No authentication is required and CORS is enabled.
	</p>
	<div class="flex items-center gap-2">
		<code class="flex-1 truncate rounded-lg bg-slate-900 px-3 py-2 font-mono text-xs text-slate-100">
			{data.origin}
		</code>
		<button type="button" class="btn-secondary px-3 py-2 text-sm" onclick={copyBaseUrl}>
			<Icon icon={copied ? 'mdi:check' : 'mdi:content-copy'} width="16" />
			{copied ? 'Copied' : 'Copy'}
		</button>
	</div>
</div>

<div class="card mt-4 space-y-4 p-5">
	<div class="flex items-center gap-2">
		<span class="rounded bg-gmu-green-light px-1.5 py-0.5 text-xs font-semibold text-gmu-green">GET</span>
		<code class="font-mono text-sm text-slate-800">/api/content/{'{type}'}</code>
	</div>
	<p class="text-sm text-muted">
		Returns published documents for a content type. Singleton types return a single object (or
		<code class="font-mono text-xs">null</code>); other types return an array, sorted the same way as the admin
		list view. Image and file fields hold a path like <code class="font-mono text-xs">/api/files/&lt;id&gt;</code>
		&mdash; resolve it against the base URL above.
	</p>

	<div>
		<p class="mb-1.5 text-xs font-semibold tracking-wide text-muted uppercase">Example request</p>
		<pre class="overflow-x-auto rounded-lg bg-slate-900 px-3 py-2 font-mono text-xs text-slate-100">curl {data.origin}/api/content/news</pre>
	</div>

	<div>
		<p class="mb-1.5 text-xs font-semibold tracking-wide text-muted uppercase">Response headers</p>
		<div class="overflow-x-auto">
			<table class="w-full text-left text-sm">
				<tbody class="divide-y divide-slate-100">
					<tr>
						<td class="py-2 pr-4 font-mono text-xs text-slate-800">Content-Type</td>
						<td class="py-2 text-muted">application/json</td>
					</tr>
					<tr>
						<td class="py-2 pr-4 font-mono text-xs text-slate-800">Access-Control-Allow-Origin</td>
						<td class="py-2 text-muted">* (or the configured CORS origin)</td>
					</tr>
					<tr>
						<td class="py-2 pr-4 font-mono text-xs text-slate-800">Access-Control-Allow-Methods</td>
						<td class="py-2 text-muted">GET, OPTIONS</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>

	<div>
		<p class="mb-1.5 text-xs font-semibold tracking-wide text-muted uppercase">Errors</p>
		<div class="overflow-x-auto">
			<table class="w-full text-left text-sm">
				<tbody class="divide-y divide-slate-100">
					<tr>
						<td class="py-2 pr-4 font-mono text-xs text-slate-800">404</td>
						<td class="py-2 text-muted">Unknown content type &mdash; <code class="font-mono text-xs">type</code> doesn't match any key below.</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>

	<div>
		<p class="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">Content types</p>
		<div class="space-y-2">
			{#each data.collections as collection (collection.key)}
				<details class="group rounded-lg border border-slate-200">
					<summary
						class="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 text-sm select-none [&::-webkit-details-marker]:hidden"
					>
						<span class="flex items-center gap-3">
							<code class="font-mono text-xs text-slate-800">{collection.key}</code>
							<span class="text-slate-700">{collection.label}</span>
						</span>
						<span class="flex items-center gap-2">
							<span class="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600">
								{collection.singleton ? 'Object' : 'Array'}
							</span>
							<Icon icon="mdi:chevron-down" width="18" class="text-slate-400 group-open:rotate-180" />
						</span>
					</summary>
					<pre class="overflow-x-auto border-t border-slate-200 bg-slate-900 px-3 py-2 font-mono text-xs text-slate-100">{exampleFor(
							collection.key
						)}</pre>
				</details>
			{/each}
		</div>
	</div>
</div>

<div class="card mt-4 space-y-4 p-5">
	<div class="flex items-center gap-2">
		<span class="rounded bg-gmu-green-light px-1.5 py-0.5 text-xs font-semibold text-gmu-green">GET</span>
		<code class="font-mono text-sm text-slate-800">/api/files/{'{id}'}</code>
	</div>
	<p class="text-sm text-muted">
		Redirects (302) to the file's storage URL. Use the file ID referenced by a content document's image or
		attachment field.
	</p>
	<div>
		<p class="mb-1.5 text-xs font-semibold tracking-wide text-muted uppercase">Example request</p>
		<pre class="overflow-x-auto rounded-lg bg-slate-900 px-3 py-2 font-mono text-xs text-slate-100">curl -L {data.origin}/api/files/&lt;file-id&gt;</pre>
	</div>
	<div>
		<p class="mb-1.5 text-xs font-semibold tracking-wide text-muted uppercase">Response headers</p>
		<div class="overflow-x-auto">
			<table class="w-full text-left text-sm">
				<tbody class="divide-y divide-slate-100">
					<tr>
						<td class="py-2 pr-4 font-mono text-xs text-slate-800">Location</td>
						<td class="py-2 text-muted">the file's storage URL</td>
					</tr>
					<tr>
						<td class="py-2 pr-4 font-mono text-xs text-slate-800">Cache-Control</td>
						<td class="py-2 text-muted">public, max-age=1800</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>
	<div>
		<p class="mb-1.5 text-xs font-semibold tracking-wide text-muted uppercase">Errors</p>
		<div class="overflow-x-auto">
			<table class="w-full text-left text-sm">
				<tbody class="divide-y divide-slate-100">
					<tr>
						<td class="py-2 pr-4 font-mono text-xs text-slate-800">404</td>
						<td class="py-2 text-muted">File not found.</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>
</div>

export const templates: Record<string, unknown> = {
	siteInfo: {
		logo: '',
		labName: 'CREATE Lab',
		labFullName: 'Control, Robotics, and Autonomy Lab',
		institution: 'George Mason University',
		tagline: 'Dynamics, controls, and robotics at George Mason University',
		intro: '',
		heroImages: [],
		showAccessibility: true,
		contact: { department: '', address: [''], email: '' }
	},
	news: { title: '', date: '', body: '', linkType: 'none', href: '', articleSlug: '', order: 0 },
	projects: {
		title: '',
		summary: '',
		status: 'Active',
		featured: false,
		tags: [],
		image: '',
		content: '',
		teamMembers: [],
		funding: [],
		links: [],
		gallery: [],
		relatedPublications: [],
		linkType: 'page',
		href: '',
		slug: '',
		order: 0
	},
	researchArticles: {
		slug: '',
		title: '',
		years: '',
		image: '',
		content: '',
		relatedPublications: []
	},
	publications: {
		type: 'Journal Articles',
		title: '',
		authors: '',
		venue: '',
		date: '',
		doi: '',
		pdf: '',
		award: ''
	},
	team: {
		name: '',
		slug: '',
		role: 'member',
		group: 'Ph.D. Students',
		period: '',
		photo: '',
		note: '',
		bio: '',
		education: [''],
		email: '',
		socials: [{ kind: 'scholar', href: '', icon: '' }],
		order: 0
	},
	sponsors: { name: '', image: '', order: 0 }
};

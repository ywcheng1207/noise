import Link from 'next/link'
import { Activity, Lightbulb, Link2, ListChecks, Users } from 'lucide-react'

export interface TopicLinkData {
	slug: string
	title: string
	note: string | null
}

interface TopicPageCharterLabels {
	digestHeading: string
	whyHeading: string
	criteriaHeading: string
	actorsHeading: string
	linksHeading: string
}

export function TopicPageCharter({
	digest,
	why,
	criteria,
	actors,
	links,
	lng,
	labels,
}: {
	digest: string | null
	why: string | null
	criteria: string | null
	actors: string[]
	links: TopicLinkData[]
	lng: string
	labels: TopicPageCharterLabels
}) {
	return (
		<div className='bg-secondary/30 flex flex-col gap-4 rounded-lg p-4 sm:p-5'>
			{digest ? (
				<section>
					<h2 className='text-muted-foreground mb-1.5 flex items-center gap-1.5 text-sm font-medium'>
						<Activity className='size-3.5' />
						{labels.digestHeading}
					</h2>
					<p className='text-sm leading-7 sm:text-base'>{digest}</p>
				</section>
			) : null}

			{why ? (
				<section>
					<h2 className='text-muted-foreground mb-1.5 flex items-center gap-1.5 text-sm font-medium'>
						<Lightbulb className='size-3.5' />
						{labels.whyHeading}
					</h2>
					<p className='text-sm leading-6 sm:text-base'>{why}</p>
				</section>
			) : null}

			{criteria ? (
				<section>
					<h2 className='text-muted-foreground mb-1.5 flex items-center gap-1.5 text-sm font-medium'>
						<ListChecks className='size-3.5' />
						{labels.criteriaHeading}
					</h2>
					<p className='text-sm leading-6 sm:text-base'>{criteria}</p>
				</section>
			) : null}

			{actors.length > 0 ? (
				<section>
					<h2 className='text-muted-foreground mb-1.5 flex items-center gap-1.5 text-sm font-medium'>
						<Users className='size-3.5' />
						{labels.actorsHeading}
					</h2>
					<div className='flex flex-wrap gap-1.5'>
						{actors.map((actor) => (
							<span
								key={actor}
								className='bg-secondary/60 text-muted-foreground rounded-lg px-2 py-0.5 text-xs'
							>
								{actor}
							</span>
						))}
					</div>
				</section>
			) : null}

			{links.length > 0 ? (
				<section>
					<h2 className='text-muted-foreground mb-1.5 flex items-center gap-1.5 text-sm font-medium'>
						<Link2 className='size-3.5' />
						{labels.linksHeading}
					</h2>
					<ul className='flex flex-col gap-1.5'>
						{links.map((link) => (
							<li key={link.slug}>
								<Link href={`/${lng}/topic/${link.slug}`} className='text-info text-sm hover:underline'>
									{link.title}
								</Link>
								{link.note ? (
									<span className='text-muted-foreground ml-1.5 text-xs'>— {link.note}</span>
								) : null}
							</li>
						))}
					</ul>
				</section>
			) : null}
		</div>
	)
}

'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
const links=[['/','⌂','Basecamp'],['/challenge','◷','The challenge'],['/builds','▦','Explore builds'],['/vote','✧','Rate builds'],['/leaderboard','♧','Leaderboard'],['/builders','◎','Meet the builders'],['/season','▤','Season archive'],['/spaces','◌','Around the fire']];
export function BasecampNav(){const path=usePathname();return <nav className="bc-nav" aria-label="Main navigation">{links.map(([href,icon,label])=><Link href={href} key={href} aria-current={(href==='/'?path==='/':path===href||path.startsWith(href+'/'))?'page':undefined}><span aria-hidden>{icon}</span>{label}</Link>)}</nav>}

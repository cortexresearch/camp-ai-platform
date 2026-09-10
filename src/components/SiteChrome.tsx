import Link from 'next/link';
import {getCurrentUser} from '@/lib/auth';
import {logoutAction} from '@/lib/actions';
import {BasecampNav} from './BasecampNav';
import {ThemeToggle} from './ThemeToggle';
export async function SiteHeader(){
 const user=await getCurrentUser();
 return <><aside className="bc-sidebar"><Link className="bc-brand" href="/">⌁ camp<span>ai</span><small>MAKE SOMETHING REAL.</small></Link><div className="bc-season">SEASON 02 / THE NEXT CHAPTER</div><BasecampNav/><div className="bc-rule"><span>THE CAMPFIRE RULE</span><p>Be curious.<br/>Build generously.<br/>Leave it better.</p></div><div className="bc-account">{user?<><Link href={`/u/${user.handle}`}>{user.name}<small>Your profile & work</small></Link><form action={logoutAction}><button type="submit">Log out</button></form></>:<><Link className="bc-join" href="/signup">Join the camp ↗</Link><Link href="/login">Log in</Link></>}</div></aside><header className="bc-topbar"><span>THE BUILDERS’ CAMPGROUND</span><ThemeToggle/><Link href={user?'/submit':'/login'}>{user?'Share your build ↗':'Already a camper? Log in →'}</Link></header></>;
}
export function SiteFooter(){return <footer className="bc-footer"><span>Made for people who make things. / Cortex Research Group</span><nav aria-label="Footer"><Link href="/rules">Rules</Link><Link href="/code-of-conduct">Campfire code</Link><Link href="/how-it-works">How it works</Link><Link href="/partnership">Partners</Link><Link href="/support">Support</Link><Link href="/contact">Contact</Link></nav></footer>}

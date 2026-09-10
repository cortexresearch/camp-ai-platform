import {pool} from '@/lib/db';
import {getCurrentEpisode,isEpisodeLiveNow,TONIGHT} from '@/lib/season';
import {BasecampHome,type BasecampBuild} from '@/components/BasecampHome';
import {SeasonCountdown} from '@/components/SeasonCountdown';
import {AutoRefresh} from '@/components/AutoRefresh';
export const dynamic='force-dynamic';
export const revalidate=0;
export default async function HomePage(){
 const [episode,builds,counts]=await Promise.all([
  getCurrentEpisode(),
  pool.query<BasecampBuild>(`select b.id,b.title,b.how_it_works,b.models_used,u.name as author_name,
   coalesce(r.avg_rating,0) as avg_rating,coalesce(r.rating_count,0) as rating_count
   from builds b join users u on u.id=b.user_id
   left join (select build_id,avg(stars) as avg_rating,count(distinct user_id) as rating_count from ratings group by build_id) r on r.build_id=b.id
   order by b.created_at desc,b.id limit 3`),
  pool.query<{builds:string;builders:string;episodes:string}>(`select
   (select count(*) from builds) as builds,
   (select count(*) from users where role='builder') as builders,
   (select count(*) from episodes) as episodes`)
 ]);
 const n=counts.rows[0];
 return <><AutoRefresh/><BasecampHome episode={episode} live={isEpisodeLiveNow(episode)} builds={builds.rows}
 counts={{builds:Number(n.builds),builders:Number(n.builders),episodes:Number(n.episodes)}}
 countdown={episode?.status!=='complete'?<SeasonCountdown start={TONIGHT.submissionStart} deadline={TONIGHT.submissionDeadline}/>:undefined}/></>;
}

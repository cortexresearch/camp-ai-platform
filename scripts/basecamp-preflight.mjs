import pg from 'pg';
if(!process.env.DATABASE_URL)throw new Error('Set DATABASE_URL to the staging database.');
const client=new pg.Client({connectionString:process.env.DATABASE_URL});
const tables=['users','sessions','builds','episodes','ratings','comments','portfolio_items','partner_inquiries','password_resets'];
try{
 await client.connect();
 await client.query('BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');
 await client.query("SET LOCAL statement_timeout = '15s'");
 const inventory={};
 for(const table of tables){const result=await client.query(`select count(*)::text as count from ${table}`);inventory[table]=result.rows[0].count;}
 const checks=await client.query(`select
  (select count(*) from builds b left join users u on u.id=b.user_id where u.id is null)::text as orphan_builds,
  (select count(*) from ratings r left join builds b on b.id=r.build_id left join users u on u.id=r.user_id where b.id is null or u.id is null)::text as orphan_ratings,
  (select count(*) from ratings where category not in ('name','pitch','product','ui') or stars not between 1 and 5)::text as invalid_ratings`);
 const violations=Object.values(checks.rows[0]).some(n=>n!=='0');
 console.log(JSON.stringify({schemaChangeRequired:false,tables:inventory,checks:checks.rows[0],passed:!violations},null,2));
 if(violations)process.exitCode=1;
 await client.query('ROLLBACK');
}finally{await client.end();}

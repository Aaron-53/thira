export const PERFORMANCE_BUDGETS={capable:{target:60,floor:45},mid:{target:60,floor:30},phone:{target:30,floor:24}};
const ladder=[
  {scale:1,rays:.5,bloom:.5,particles:1,reflection:1},
  {scale:.85,rays:.5,bloom:.5,particles:1,reflection:1},
  {scale:.75,rays:.5,bloom:.5,particles:1,reflection:1},
  {scale:.65,rays:.5,bloom:.5,particles:1,reflection:1},
  {scale:.65,rays:.25,bloom:.5,particles:1,reflection:1},
  {scale:.65,rays:.25,bloom:.25,particles:1,reflection:1},
  {scale:.65,rays:.25,bloom:.25,particles:.6,reflection:1},
  {scale:.65,rays:.25,bloom:.25,particles:.6,reflection:2},
  {scale:.65,rays:.25,bloom:.25,particles:.6,reflection:3},
];
export function createPerfMonitor(apply,{tier='mid',debug=false}={}){
  const budget=PERFORMANCE_BUDGETS[tier],samples=new Float64Array(60);
  let level=0,count=0,index=0,total=0,slow=0,fast=0,cooldown=0,transitions=0,overBudget=0;
  let recoverySeconds=6,sinceChange=Infinity,lastDirection=0;
  function reset(){samples.fill(0);count=index=total=slow=fast=overBudget=0;}
  function change(next){
    const previous=level,direction=Math.sign(next-level);
    if(direction>0&&lastDirection<0&&sinceChange<12)recoverySeconds=Math.min(60,recoverySeconds*2);
    lastDirection=direction;sinceChange=0;level=next;transitions++;reset();cooldown=2;
    apply(ladder[level]);if(debug)console.debug(`[THIRA quality] ${previous} -> ${level}`,ladder[level]);
  }
  return {
    get scale(){return ladder[level].scale;},
    get stats(){return {tier,...budget,level,transitions,recoverySeconds,averageMs:count?total/count*1000:0,...ladder[level]};},
    frame(dt){
      if(!Number.isFinite(dt)||dt<=0)return;
      // Hidden tabs reset sampling. Slow visible frames still count toward overload.
      dt=Math.min(dt,1);sinceChange+=dt;const threshold=1/budget.target*1.08;
      if(samples[index]>threshold)overBudget--;if(dt>threshold)overBudget++;
      total-=samples[index];samples[index]=dt;total+=dt;
      index=(index+1)%60;count=Math.min(60,count+1);cooldown=Math.max(0,cooldown-dt);
      if(count<60||cooldown>0)return;
      const average=total/60,target=1/budget.target;
      slow=average>target*1.08&&overBudget>=8?slow+dt:0;fast=average<target*1.02&&overBudget<10?fast+dt:0;
      if(slow>=1&&level<ladder.length-1)change(level+1);
      else if(fast>=recoverySeconds&&level>0)change(level-1);
    },
    reset(){reset();cooldown=2;},
  };
}

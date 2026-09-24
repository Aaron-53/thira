import ieeeURL from '../../sb logo/logowhiteieeemec.png?url';
import wieURL from '../../sb logo/wie_logo.png?url';

export function createPresenters(motion){
  const container=document.createElement('aside');container.id='presenters';container.setAttribute('aria-label','Presented by');container.setAttribute('aria-hidden','true');
  document.body.append(container);
  // Trim transparent source padding once, so both marks use their actual ink bounds.
  const ready=Promise.all([[ieeeURL,'IEEE MEC Student Branch'],[wieURL,'IEEE Women in Engineering']].map(async([url,label])=>{
    const image=new Image();image.src=url;await image.decode();
    const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
    const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);
    const {data}=ctx.getImageData(0,0,canvas.width,canvas.height);let left=canvas.width,top=canvas.height,right=0,bottom=0;
    for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++)if(data[(y*canvas.width+x)*4+3]>8){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
    const cropped=document.createElement('canvas');cropped.width=right-left+1;cropped.height=bottom-top+1;
    cropped.getContext('2d').drawImage(image,left,top,cropped.width,cropped.height,0,0,cropped.width,cropped.height);
    const mark=new Image();mark.alt=label;mark.src=cropped.toDataURL();await mark.decode();return mark;
  })).then(marks=>container.append(...marks));
  let resting=0,atEnd=false;
  return {ready,update(act,arrival,delta){
    // The final composition is complete at .99. Allow scroll rounding and
    // mobile viewport changes rather than requiring an exact bottom pixel.
    atEnd=act.progress>=(atEnd?.985:.99);
    const eligible=atEnd&&(motion.matches||arrival.settled);
    resting=eligible?resting+delta:0;
    const visible=eligible&&(motion.matches||resting>=.45);
    container.classList.toggle('visible',visible);container.setAttribute('aria-hidden',String(!visible));
    act.arrivalUI=act.progress<.94||motion.matches||arrival.settled&&resting>=.45;
  },dispose(){container.remove();}};
}

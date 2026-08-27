const daysRoot=document.querySelector('#days');
const foodRoot=document.querySelector('#food-list');
const isPt=(navigator.languages||[navigator.language]).some(language=>/^pt(?:-|$)/i.test(language));
const copy=isPt?{brand:'Hawaii',itinerary:'Roteiro',food:'O que comer',plan:'O roteiro da ilha',footer:'Feito para dias de ilha 🌺',loadItinerary:'Não foi possível carregar o roteiro.',loadFood:'Não foi possível carregar a lista de comidas.',empty:'Nenhum evento programado.',tried:'Já comi',tryIt:'Quero provar',markTried:'Marcar como provado',markNotTried:'Marcar como não provado'}:{brand:'Hawaii',itinerary:'Itinerary',food:'Things to eat',plan:'The island plan',footer:'Made for island days 🌺',loadItinerary:'Could not load the itinerary.',loadFood:'Could not load the food list.',empty:'No scheduled events yet.',tried:'Tried',tryIt:'Try it',markTried:'Mark as tried',markNotTried:'Mark as not tried'};
document.documentElement.lang=isPt?'pt-BR':'en';
document.title=isPt?'Roteiro do Havaí':'Hawaii Itinerary';
document.querySelector('meta[name="description"]').content=isPt?'Um roteiro pelo Havaí para Waikīkī e Ko Olina.':'A Hawaii itinerary for Waikīkī and Ko Olina.';
document.querySelectorAll('[data-i18n]').forEach(node=>node.textContent=copy[node.dataset.i18n]);
document.querySelector('.view-tabs').setAttribute('aria-label',isPt?'Seções da viagem':'Trip views');
document.querySelector('.hero h1').textContent=isPt?'2–8 set':'Sep 2–8';
const cellText=cell=>cell&&(cell.f??cell.v)!=null?String(cell.f??cell.v):'';
const esc=value=>String(value).replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
const safeImageUrl=value=>{try{const url=new URL(String(value));return url.protocol==='https:'?url.href:''}catch{return ''}};
const foodStorageKey='hawaii-itinerary-tried-foods';
const savedFoods=()=>{try{return JSON.parse(localStorage.getItem(foodStorageKey)||'{}')}catch{return {}}};

document.querySelectorAll('.view-tab').forEach(button=>button.addEventListener('click',()=>{
  const view=button.dataset.view;
  document.querySelectorAll('.view-tab').forEach(tab=>{const active=tab===button;tab.classList.toggle('is-active',active);tab.setAttribute('aria-selected',active)});
  document.querySelector('#itinerary-panel').hidden=view!=='itinerary';
  document.querySelector('#food-panel').hidden=view!=='food';
}));

function loadItinerary(response){
  if(!response||response.status==='error'){daysRoot.innerHTML=`<p class="error">${copy.loadItinerary}</p>`;return}
  const rows=response.table.rows.map(row=>row.c.map(cellText));
  const data=rows[0]?.[5]?.toLowerCase()==='event'?rows.slice(1):rows;
  const events=data.map(([date,day,order,time,emoji,event,details,hotel,description,image,timePt,eventPt,detailsPt,descriptionPt])=>({date:isPt?localizeDate(date):date,day:isPt?day.replace(/^Day/i,'Dia'):day,order:Number(order)||0,time:isPt?(timePt||localizeTime(time)):time,emoji,event:isPt?(eventPt||event):event,details:isPt?(detailsPt||details):details,hotel,description:isPt?(descriptionPt||description):description,image:safeImageUrl(image)}));
  const grouped=events.reduce((days,event)=>{(days[event.day]??=[]).push(event);return days},{});
  daysRoot.innerHTML=Object.entries(grouped).sort((a,b)=>Number(a[0].match(/\d+/)?.[0])-Number(b[0].match(/\d+/)?.[0])).map(([day,dayEvents])=>{
    dayEvents.sort((a,b)=>a.order-b.order);
    const info=dayEvents[0];
    const bubbles=dayEvents.filter(item=>item.event).map((item,index)=>{const hasMore=Boolean(item.description||item.image);const panelId=`event-${day.replace(/\D/g,'')}-${index}-details`;const content=`<div class="bubble-picture" aria-hidden="true"><span>${esc(item.emoji)||'📌'}</span></div><div class="bubble-copy"><div class="bubble-topline"><time>${esc(item.time)}</time></div><h4>${esc(item.event)}</h4>${item.details?`<p>${esc(item.details)}</p>`:''}</div>${hasMore?'<span class="expand-arrow" aria-hidden="true">⌄</span>':''}`;return `<article class="event-bubble${hasMore?' has-more':''}" data-emoji="${esc(item.emoji)}">${hasMore?`<button class="event-summary" type="button" aria-expanded="false" aria-controls="${panelId}">${content}</button><div class="event-extra" id="${panelId}" hidden>${item.image?`<img src="${esc(item.image)}" alt="${esc(item.event)}" loading="lazy">`:''}${item.description?`<p>${esc(item.description)}</p>`:''}</div>`:`<div class="event-summary">${content}</div>`}</article>`}).join('');
    return `<article class="day"><header><p class="day-number">${esc(day)}</p><h3 class="day-date">${esc(info.date)}</h3>${info.hotel?`<p class="day-hotel">🏨 ${esc(info.hotel)}</p>`:''}</header><div class="chronological-list">${bubbles||`<p class="no-events">${copy.empty}</p>`}</div></article>`;
  }).join('');
}

daysRoot.addEventListener('click',event=>{
  const card=event.target.closest('.event-bubble.has-more');
  if(!card)return;
  const button=card.querySelector('.event-summary');
  const panel=card.querySelector('.event-extra');
  const expanded=button.getAttribute('aria-expanded')==='true';
  button.setAttribute('aria-expanded',String(!expanded));
  panel.hidden=expanded;
  card.classList.toggle('is-expanded',!expanded);
});

function loadFood(response){
  if(!response||response.status==='error'){foodRoot.innerHTML=`<p class="error">${copy.loadFood}</p>`;return}
  const rows=response.table.rows.map(row=>row.c.map(cellText));
  const foods=rows[0]?.[1]?.toLowerCase()==='dish'?rows.slice(1):rows;
  const saved=savedFoods();
  foodRoot.innerHTML=foods.filter(row=>row[1]).map(([category,dish,place,area,notes,tried,categoryPt,dishPt,placePt,areaPt,notesPt])=>{const id=[category,dish,place,area].join('|').toLowerCase();if(isPt){category=categoryPt||category;dish=dishPt||dish;place=placePt||place;area=areaPt||area;notes=notesPt||notes}const checked=id in saved?saved[id]:String(tried).toUpperCase()==='TRUE';return `<article class="food-card ${checked?'is-tried':''}" data-food-id="${esc(id)}"><button class="tried-toggle" type="button" aria-pressed="${checked}" aria-label="${checked?copy.markNotTried:copy.markTried}: ${esc(dish)}"><span aria-hidden="true">${checked?'✓':''}</span>${checked?copy.tried:copy.tryIt}</button><p class="food-category">${esc(category)}</p><h3>${esc(dish)}</h3>${place||area?`<p class="food-meta">${esc([place,area].filter(Boolean).join(' · '))}</p>`:''}${notes?`<p class="food-notes">${esc(notes)}</p>`:''}</article>`}).join('');
}

foodRoot.addEventListener('click',event=>{
  const button=event.target.closest('.tried-toggle');
  if(!button)return;
  const card=button.closest('.food-card');
  const checked=button.getAttribute('aria-pressed')!=='true';
  const saved=savedFoods();
  saved[card.dataset.foodId]=checked;
  localStorage.setItem(foodStorageKey,JSON.stringify(saved));
  card.classList.toggle('is-tried',checked);
  button.setAttribute('aria-pressed',checked);
  button.setAttribute('aria-label',`${checked?copy.markNotTried:copy.markTried}: ${card.querySelector('h3').textContent}`);
  button.innerHTML=`<span aria-hidden="true">${checked?'✓':''}</span>${checked?copy.tried:copy.tryIt}`;
});

function localizeDate(value){const days={Sun:'Dom',Mon:'Seg',Tue:'Ter',Wed:'Qua',Thu:'Qui',Fri:'Sex',Sat:'Sáb'};const months={Jan:'jan',Feb:'fev',Mar:'mar',Apr:'abr',May:'mai',Jun:'jun',Jul:'jul',Aug:'ago',Sep:'set',Oct:'out',Nov:'nov',Dec:'dez'};return String(value).replace(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat) • (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d+)$/,(_,day,month,date)=>`${days[day]} • ${date} ${months[month]}`)}
function localizeTime(value){return String(value).replace(/Late morning/gi,'Fim da manhã').replace(/Early morning/gi,'Início da manhã').replace(/Late afternoon/gi,'Fim da tarde').replace(/Morning/gi,'Manhã').replace(/Afternoon/gi,'Tarde').replace(/Evening/gi,'Noite').replace(/Midday/gi,'Meio-dia').replace(/Optional/gi,'Opcional').replace(/After checkout/gi,'Após o check-out').replace(/After presentation/gi,'Após a apresentação').replace(/next day/gi,'dia seguinte').replace(/earliest reservation/gi,'primeiro horário disponível').replace(/est\./gi,'aprox.').replace(/AM/gi,'').replace(/PM/gi,'').replace(/\s+/g,' ').trim()}

window.loadItinerary=loadItinerary;
window.loadFood=loadFood;

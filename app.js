const daysRoot=document.querySelector('#days');
const foodRoot=document.querySelector('#food-list');
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
  if(!response||response.status==='error'){daysRoot.innerHTML='<p class="error">Could not load the itinerary.</p>';return}
  const rows=response.table.rows.map(row=>row.c.map(cellText));
  const data=rows[0]?.[5]?.toLowerCase()==='event'?rows.slice(1):rows;
  const events=data.map(([date,day,order,time,emoji,event,details,hotel,description,image])=>({date,day,order:Number(order)||0,time,emoji,event,details,hotel,description,image:safeImageUrl(image)}));
  const grouped=events.reduce((days,event)=>{(days[event.day]??=[]).push(event);return days},{});
  daysRoot.innerHTML=Object.entries(grouped).sort((a,b)=>Number(a[0].match(/\d+/)?.[0])-Number(b[0].match(/\d+/)?.[0])).map(([day,dayEvents])=>{
    dayEvents.sort((a,b)=>a.order-b.order);
    const info=dayEvents[0];
    const bubbles=dayEvents.filter(item=>item.event).map((item,index)=>{const hasMore=Boolean(item.description||item.image);const panelId=`event-${day.replace(/\D/g,'')}-${index}-details`;const content=`<div class="bubble-picture" data-emoji="${esc(item.emoji)}" aria-hidden="true"><span>${esc(item.emoji)||'📌'}</span></div><div class="bubble-copy"><div class="bubble-topline"><time>${esc(item.time)}</time></div><h4>${esc(item.event)}</h4>${item.details?`<p>${esc(item.details)}</p>`:''}</div>${hasMore?'<span class="expand-arrow" aria-hidden="true">↓</span>':''}`;return `<article class="event-bubble${hasMore?' has-more':''}">${hasMore?`<button class="event-summary" type="button" aria-expanded="false" aria-controls="${panelId}">${content}</button><div class="event-extra" id="${panelId}" hidden>${item.image?`<img src="${esc(item.image)}" alt="${esc(item.event)}" loading="lazy">`:''}${item.description?`<p>${esc(item.description)}</p>`:''}</div>`:`<div class="event-summary">${content}</div>`}</article>`}).join('');
    return `<article class="day"><header><p class="day-number">${esc(day)}</p><h3 class="day-date">${esc(info.date)}</h3>${info.hotel?`<p class="day-hotel">🏨 ${esc(info.hotel)}</p>`:''}</header><div class="chronological-list">${bubbles||'<p class="no-events">No scheduled events yet.</p>'}</div></article>`;
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
  if(!response||response.status==='error'){foodRoot.innerHTML='<p class="error">Could not load the food list.</p>';return}
  const rows=response.table.rows.map(row=>row.c.map(cellText));
  const foods=rows[0]?.[1]?.toLowerCase()==='dish'?rows.slice(1):rows;
  const saved=savedFoods();
  foodRoot.innerHTML=foods.filter(row=>row[1]).map(([category,dish,place,area,notes,tried])=>{const id=[category,dish,place,area].join('|').toLowerCase();const checked=id in saved?saved[id]:String(tried).toUpperCase()==='TRUE';return `<article class="food-card ${checked?'is-tried':''}" data-food-id="${esc(id)}"><button class="tried-toggle" type="button" aria-pressed="${checked}" aria-label="Mark ${esc(dish)} as ${checked?'not tried':'tried'}"><span aria-hidden="true">${checked?'✓':''}</span>${checked?'Tried':'Try it'}</button><p class="food-category">${esc(category)}</p><h3>${esc(dish)}</h3>${place||area?`<p class="food-meta">${esc([place,area].filter(Boolean).join(' · '))}</p>`:''}${notes?`<p class="food-notes">${esc(notes)}</p>`:''}</article>`}).join('');
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
  button.setAttribute('aria-label',`Mark ${card.querySelector('h3').textContent} as ${checked?'not tried':'tried'}`);
  button.innerHTML=`<span aria-hidden="true">${checked?'✓':''}</span>${checked?'Tried':'Try it'}`;
});

window.loadItinerary=loadItinerary;
window.loadFood=loadFood;

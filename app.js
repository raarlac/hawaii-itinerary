const daysRoot=document.querySelector('#days');
const foodRoot=document.querySelector('#food-list');
const cellText=cell=>cell&&(cell.f??cell.v)!=null?String(cell.f??cell.v):'';
const esc=value=>String(value).replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
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
  const dates=rows[0].slice(1),labels=rows[1].slice(1),categories=rows.slice(2).map(row=>({label:row[0],values:row.slice(1)}));
  daysRoot.innerHTML=dates.map((date,index)=>{
    const items=categories.map(category=>({label:category.label,value:category.values[index]})).filter(item=>item.value&&item.value.trim().toLowerCase()!=='open');
    const hotel=items.find(item=>/Hotel/i.test(item.label));
    const travel=items.find(item=>/Travel/i.test(item.label));
    const hotelLines=(hotel?.value||'').split('\n').filter(Boolean);
    const hotelName=hotelLines.map(line=>line.replace(/^→\s*/, '').replace(/\s*(check-?in|check-?out).*$/i,'').trim()).filter(Boolean).join(' → ');
    const slots={Morning:[],Afternoon:[],Evening:[]};
    const slotFor=text=>{const match=text.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);if(!match)return'Afternoon';let hour=Number(match[1])%12;if(match[3].toUpperCase()==='PM')hour+=12;return hour<12?'Morning':hour<17?'Afternoon':'Evening'};
    items.filter(item=>/Morning|Afternoon|Evening/i.test(item.label)).forEach(item=>{const slot=Object.keys(slots).find(name=>item.label.includes(name));if(slot)slots[slot].push({type:'Activity',icon:'🌴',value:item.value})});
    hotelLines.filter(line=>/check-?in|check-?out/i.test(line)).forEach(line=>{const checkout=/check-?out/i.test(line);slots[checkout?'Morning':slotFor(line)].push({type:checkout?'Hotel checkout':'Hotel check-in',icon:checkout?'🧳':'🔑',value:line})});
    if(travel){const lines=travel.value.split('\n').filter(Boolean);const departure=lines.find(line=>/Depart/i.test(line));const arrival=lines.find(line=>/Arrive/i.test(line));if(departure&&arrival){const flightMeta=lines.filter(line=>line!==departure&&line!==arrival).join(' · ');const departureSlot=slotFor(departure);slots[departureSlot].push({type:'Flight departure',icon:'✈️',value:departure,meta:flightMeta});slots[/next day/i.test(arrival)?departureSlot:slotFor(arrival)].push({type:/next day/i.test(arrival)?'Arrival · next day':'Flight arrival',icon:'🛬',value:arrival})}else{slots[slotFor(travel.value)].push({type:/transfer/i.test(travel.value)?'Transfer':'Travel',icon:'🚐',value:travel.value})}}
    const renderSlot=name=>`<section class="time-slot"><p class="slot-label">${name}</p><div class="bubble-stack">${slots[name].map(item=>`<div class="event-bubble ${item.value==='Open'?'is-open':''}"><div class="bubble-icon" aria-hidden="true">${item.icon}</div><div><span class="bubble-type">${item.type}</span><p>${esc(item.value)}</p>${item.meta?`<small>${esc(item.meta)}</small>`:''}</div></div>`).join('')}</div></section>`;
    return `<article class="day"><header><p class="day-number">${esc(labels[index]||`Day ${index+1}`)}</p><h3 class="day-date">${esc(date)}</h3>${hotelName?`<p class="day-hotel">🏨 ${esc(hotelName)}</p>`:''}</header><div class="day-content">${Object.keys(slots).map(renderSlot).join('')}</div></article>`;
  }).join('');
}

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

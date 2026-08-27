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
  const isLogistics=label=>/Hotel|Travel/i.test(label);
  daysRoot.innerHTML=dates.map((date,index)=>{
    const items=categories.map(category=>({label:category.label,value:category.values[index]})).filter(item=>item.value);
    const timeline=items.filter(item=>!isLogistics(item.label));
    const logistics=items.filter(item=>isLogistics(item.label));
    const renderItem=item=>`<div class="event ${item.value==='Open'?'is-open':''}"><p class="event-label">${esc(item.label)}</p><p class="event-text">${esc(item.value)}</p></div>`;
    return `<article class="day"><header><p class="day-number">${esc(labels[index]||`Day ${index+1}`)}</p><h3 class="day-date">${esc(date)}</h3></header><div class="day-content"><div class="timeline"><p class="group-label">Day timeline</p><div class="events">${timeline.map(renderItem).join('')}</div></div>${logistics.length?`<aside class="logistics"><p class="group-label">Stay & travel</p>${logistics.map(renderItem).join('')}</aside>`:''}</div></article>`;
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

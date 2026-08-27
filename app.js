const daysRoot=document.querySelector('#days');
const foodRoot=document.querySelector('#food-list');
const cellText=cell=>cell&&(cell.f??cell.v)!=null?String(cell.f??cell.v):'';
const esc=value=>String(value).replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));

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
  daysRoot.innerHTML=dates.map((date,index)=>`<article class="day"><header><p class="day-number">${esc(labels[index]||`Day ${index+1}`)}</p><h3 class="day-date">${esc(date)}</h3></header><div class="events">${categories.map(category=>({label:category.label,value:category.values[index]})).filter(item=>item.value).map(item=>`<div class="event ${item.value==='Open'?'is-open':''}"><p class="event-label">${esc(item.label)}</p><p class="event-text">${esc(item.value)}</p></div>`).join('')}</div></article>`).join('');
}

function loadFood(response){
  if(!response||response.status==='error'){foodRoot.innerHTML='<p class="error">Could not load the food list.</p>';return}
  const rows=response.table.rows.map(row=>row.c.map(cellText));
  const foods=rows[0]?.[1]?.toLowerCase()==='dish'?rows.slice(1):rows;
  foodRoot.innerHTML=foods.filter(row=>row[1]).map(([category,dish,place,area,notes,tried])=>`<article class="food-card">${String(tried).toUpperCase()==='TRUE'?'<span class="tried-badge">Tried ✓</span>':''}<p class="food-category">${esc(category)}</p><h3>${esc(dish)}</h3>${place||area?`<p class="food-meta">${esc([place,area].filter(Boolean).join(' · '))}</p>`:''}${notes?`<p class="food-notes">${esc(notes)}</p>`:''}</article>`).join('');
}

window.loadItinerary=loadItinerary;
window.loadFood=loadFood;

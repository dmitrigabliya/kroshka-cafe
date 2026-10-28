(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const rub = (value) => `${new Intl.NumberFormat('ru-RU').format(value)} ₽`;
  const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalize = (value) => value.toLocaleLowerCase('ru-RU').replace(/ё/g, 'е').trim();
  const categories = { coffee: 'Кофе', drinks: 'Другие напитки', bakery: 'Выпечка', breakfast: 'Завтраки' };
  // Fictional recipes. B/J/U values are illustrative per 100 g or 100 ml.
  // Energy is consistently derived using 4/9/4; kJ = kcal × 4.184.
  const catalogue = [
    { id:'cappuccino', category:'coffee', name:'Капучино', price:290, photo:'hero', description:'Двойной эспрессо и молочная пена.', ingredients:'Эспрессо, молоко.', allergens:'Молоко в базовом рецепте.', portion:250, unit:'мл', sizes:[[250,0],[350,70]], milk:true, decaf:true, macros:[2.6,2.7,3.8], pair:'croissant' },
    { id:'croissant', category:'bakery', name:'Круассан', price:240, photo:'pastry', description:'Классический круассан на сливочном масле.', ingredients:'Пшеничная мука, сливочное масло, молоко, сахар, дрожжи, яйцо, соль.', allergens:'Пшеница, молоко, яйца.', portion:85, unit:'г', macros:[8,21,43], pair:'cappuccino' },
    { id:'scramble', category:'breakfast', name:'Скрэмбл на бриоши', price:490, photo:'breakfast', description:'Мягкие яйца, тёплая бриошь и томаты.', ingredients:'Яйца, бриошь, сливочное масло, сливки, томаты, зелень, соль.', allergens:'Яйца, пшеница, молоко.', portion:260, unit:'г', macros:[10,12,15], pair:'americano' },
    { id:'raf', category:'coffee', name:'Раф с кардамоном', price:350, photo:'raf', description:'Эспрессо, сливки и немного кардамона.', ingredients:'Эспрессо, сливки, сахар, кардамон.', allergens:'Молоко.', portion:300, unit:'мл', sizes:[[300,0],[400,60]], decaf:true, macros:[2,8,8], pair:'cheesecake' },
    { id:'cheesecake', category:'bakery', name:'Баскский чизкейк', price:390, photo:'cheesecake', description:'Кремовая середина и запечённая корочка.', ingredients:'Творожный сыр, сливки, яйца, сахар, пшеничная мука, ваниль.', allergens:'Молоко, яйца, пшеница.', portion:140, unit:'г', macros:[6,29,21], pair:'filter' },
    { id:'avocado', category:'breakfast', name:'Бриошь с авокадо', price:540, photo:'avocado', description:'Авокадо, яйцо пашот и свежая зелень.', ingredients:'Бриошь, авокадо, яйцо, оливковое масло, зелень, лимонный сок, соль.', allergens:'Яйца, пшеница, молоко.', portion:280, unit:'г', macros:[8,14,19], pair:'filter' },
    { id:'latte', category:'coffee', name:'Латте', price:310, photo:'hero', description:'Больше молока и тонкий слой пены.', ingredients:'Эспрессо, молоко.', allergens:'Молоко в базовом рецепте.', portion:300, unit:'мл', sizes:[[300,0],[400,70]], milk:true, decaf:true, macros:[2.6,2.7,4.5], pair:'cinnamon' },
    { id:'espresso', category:'coffee', name:'Эспрессо', price:180, photo:'filter', description:'Небольшая порция насыщенного чёрного кофе.', ingredients:'Молотый кофе, вода.', allergens:'В базовом рецепте нет основных аллергенов; это не гарантия отсутствия следов.', portion:40, unit:'мл', sizes:[[40,0],[80,60]], decaf:true, macros:[.1,0,.4], pair:'cheesecake' },
    { id:'americano', category:'coffee', name:'Американо', price:230, photo:'filter', description:'Эспрессо с горячей водой, без молока.', ingredients:'Эспрессо, горячая вода.', allergens:'В базовом рецепте нет основных аллергенов; это не гарантия отсутствия следов.', portion:200, unit:'мл', sizes:[[200,0],[300,40]], decaf:true, macros:[.1,0,.2], pair:'almond' },
    { id:'filter', category:'coffee', name:'Фильтр', price:250, photo:'filter', description:'Чёрный кофе, заваренный через бумажный фильтр.', ingredients:'Молотый кофе, вода. Завариваем через бумажный фильтр без давления.', allergens:'В базовом рецепте нет основных аллергенов; это не гарантия отсутствия следов.', portion:250, unit:'мл', sizes:[[250,0],[350,60]], decaf:true, macros:[.1,0,.2], pair:'croissant' },
    { id:'matcha', category:'drinks', name:'Айс матча', price:350, photo:'matcha', description:'Матча, молоко и лёд. Подаём холодной.', ingredients:'Матча, молоко, сахарный сироп, лёд.', allergens:'Молоко в базовом рецепте.', portion:300, unit:'мл', sizes:[[300,0],[400,60]], milk:true, macros:[2,2.5,6], pair:'cheesecake' },
    { id:'cocoa', category:'drinks', name:'Какао', price:290, photo:'cocoa', description:'Горячее какао с молоком и тёмным шоколадом.', ingredients:'Молоко, какао, тёмный шоколад, сахар.', allergens:'Молоко; возможна соя в шоколаде.', portion:250, unit:'мл', sizes:[[250,0],[350,60]], milk:true, macros:[3,3.2,13], pair:'cinnamon' },
    { id:'tea', category:'drinks', name:'Ягодный чай', price:280, photo:'tea', description:'Малина, чёрный чай и тимьян.', ingredients:'Вода, чёрный чай, малина, ягодное пюре с сахаром, тимьян.', allergens:'Возможны индивидуальные реакции на ягоды.', portion:350, unit:'мл', sizes:[[350,0],[500,80]], macros:[0,0,6], pair:'almond' },
    { id:'lemonade', category:'drinks', name:'Лимонад с мятой', price:320, photo:'lemonade', description:'Лимон, мята, газированная вода и лёд.', ingredients:'Газированная вода, лимонный сок, сахарный сироп, лимон, мята, лёд.', allergens:'Возможны индивидуальные реакции на цитрусовые.', portion:350, unit:'мл', sizes:[[350,0],[500,70]], macros:[0,0,8], pair:'avocado' },
    { id:'almond', category:'bakery', name:'Миндальный круассан', price:320, photo:'almond', description:'Круассан с миндальным кремом и лепестками.', ingredients:'Пшеничная мука, сливочное масло, молоко, миндаль, сахар, яйцо, дрожжи, соль.', allergens:'Миндаль, пшеница, молоко, яйца.', portion:105, unit:'г', macros:[9,25,41], pair:'latte' },
    { id:'cinnamon', category:'bakery', name:'Булочка с корицей', price:290, photo:'cinnamon', description:'Сдобная булочка со сливочной глазурью.', ingredients:'Пшеничная мука, молоко, сливочное масло, сахар, корица, творожный сыр, яйцо, дрожжи.', allergens:'Пшеница, молоко, яйца.', portion:125, unit:'г', macros:[5.5,16,50], pair:'cappuccino' },
    { id:'syrniki', category:'breakfast', name:'Сырники', price:450, photo:'syrniki', description:'Три сырника, сметана и ягодный соус.', ingredients:'Творог, яйцо, пшеничная мука, сахар, сметана, ягоды, растительное масло.', allergens:'Молоко, яйца, пшеница.', portion:220, unit:'г', macros:[11,9,23], pair:'latte' },
    { id:'granola', category:'breakfast', name:'Гранола с йогуртом', price:390, photo:'granola', description:'Густой йогурт, гранола, ягоды и мёд.', ingredients:'Греческий йогурт, овсяные хлопья, миндаль, мёд, клубника, голубика.', allergens:'Молоко, миндаль, овёс; возможен глютен.', portion:250, unit:'г', macros:[7,9,22], pair:'matcha' },
  ];
  const byId = new Map(catalogue.map((item) => [item.id, item]));
  const panel = $('#menu-panel');
  const tabs = $$('[data-category]');
  const search = $('#menu-search');
  const more = $('#show-more');
  const productDialog = $('#product-dialog');
  const trayDialog = $('#tray-dialog');
  const cart = new Map();
  let category = 'all';
  let limit = 6;
  let selected;
  let sizeIndex = 0;
  let milk = 'regular';
  let decaf = false;
  let quantity = 1;
  let nutritionMode = 'portion';
  let productTrigger;
  let trayTrigger;
  let toastTimer;
  const lockScroll = () => document.body.classList.toggle('modal-open', !!document.querySelector('dialog[open]'));
  const milkOptions = [{id:'regular',name:'Обычное',extra:0},{id:'oat',name:'Овсяное',extra:60},{id:'coconut',name:'Кокосовое',extra:60}];

  function notify(message) {
    clearTimeout(toastTimer);
    const toast = $('#menu-toast');
    toast.textContent = message;
    toast.classList.add('is-visible');
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2400);
  }
  function card(item, index) {
    return `<article class="menu-item product-card" style="--card-delay:${Math.min(index,5)*40}ms">
      <button class="product-card-open" type="button" data-product="${item.id}" aria-label="${esc(item.name)}: состав и пищевая ценность" aria-haspopup="dialog" aria-controls="product-dialog"></button>
      <div class="menu-image"><img src="./assets/${item.photo}.jpg" loading="lazy" width="1024" height="1024" alt="${esc(item.name)}"></div>
      <div class="product-card-body"><p class="product-category">${categories[item.category]} · ${item.portion} ${item.unit}</p><h3>${item.name}</h3><p class="item-description">${item.description}</p><div class="product-card-bottom"><strong>${rub(item.price)}</strong></div></div></article>`;
  }
  function renderMenu() {
    const query = normalize(search.value);
    const filtered = catalogue.filter((item) => (category === 'all' || item.category === category) && (!query || normalize(`${item.name} ${item.description} ${item.ingredients}`).includes(query)));
    panel.setAttribute('aria-labelledby', `tab-${category}`);
    if (!filtered.length) {
      panel.innerHTML = '<div class="menu-empty"><span aria-hidden="true">⌕</span><h3>Ничего не нашлось</h3><p>Попробуйте другое название или откройте всё меню.</p><button class="outline-button" type="button" id="reset-menu">Сбросить поиск</button></div>';
      $('#reset-menu').addEventListener('click', () => {search.value=''; selectCategory(tabs[0]); search.focus();});
    } else panel.innerHTML = filtered.slice(0,limit).map(card).join('');
    $('#menu-result-count').textContent = query ? `Найдено: ${filtered.length}` : `В разделе: ${filtered.length} · показано: ${Math.min(limit,filtered.length)}`;
    more.hidden = filtered.length <= limit;
    more.innerHTML = `Показать ещё ${Math.max(0,filtered.length-limit)} <span aria-hidden="true">↓</span>`;
  }
  function selectCategory(tab) {
    category = tab.dataset.category;
    limit = 6;
    tabs.forEach((item) => {const active=item===tab;item.setAttribute('aria-selected',String(active));item.tabIndex=active?0:-1;});
    renderMenu();
  }
  tabs.forEach((tab,index) => {
    tab.addEventListener('click',() => selectCategory(tab));
    tab.addEventListener('keydown',(event) => {
      const next = event.key==='ArrowRight'?(index+1)%tabs.length:event.key==='ArrowLeft'?(index-1+tabs.length)%tabs.length:event.key==='Home'?0:event.key==='End'?tabs.length-1:undefined;
      if(next!==undefined){event.preventDefault();tabs[next].focus();selectCategory(tabs[next]);tabs[next].scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});}
    });
  });
  search.addEventListener('input',() => {limit=6;renderMenu();});
  more.addEventListener('click',() => {
    const visibleCount = $$('.product-card', panel).length;
    limit=catalogue.length;
    renderMenu();
    $$('.product-card-open', panel)[visibleCount]?.focus();
  });
  panel.addEventListener('click',(event) => {
    const opener=event.target.closest('[data-product]');
    if(opener)openProduct(opener.dataset.product,opener);
  });

  function configuration(item, index=0, milkId='regular', withoutCaffeine=false) {
    const portion=item.sizes?item.sizes[index][0]:item.portion;
    const extra=item.sizes?item.sizes[index][1]:0;
    const milkChoice=milkOptions.find((option)=>option.id===milkId)||milkOptions[0];
    const milkExtra=item.milk?milkChoice.extra:0;
    const options=[`${portion} ${item.unit}`];
    if(item.milk)options.push(`${milkChoice.name.toLowerCase()} молоко`);
    if(withoutCaffeine&&item.decaf)options.push('без кофеина');
    return {key:[item.id,index,item.milk?milkId:'regular',item.decaf&&withoutCaffeine?1:0].join('|'),item,portion,unitPrice:item.price+extra+milkExtra,options:options.join(' · ')};
  }
  function addToTray(item,index=0,milkId='regular',withoutCaffeine=false,count=1) {
    const entry=configuration(item,index,milkId,withoutCaffeine);
    const previous=cart.get(entry.key);
    const next=(previous?previous.quantity:0)+count;
    if(next>20){notify('В демоподносе можно до 20 одинаковых позиций.');return false;}
    cart.set(entry.key,{...entry,quantity:next});
    updateTray();
    notify(`${item.name} на подносе`);
    return true;
  }
  function openProduct(id,trigger) {
    selected=byId.get(id);if(!selected)return;
    productTrigger=trigger;sizeIndex=0;milk='regular';decaf=false;quantity=1;nutritionMode='portion';
    $('#product-image').src=`./assets/${selected.photo}.jpg`;
    $('#product-image').alt=selected.name;
    $('#product-category').textContent=categories[selected.category];
    $('#product-title').textContent=selected.name;
    $('#product-description').textContent=selected.description;
    $('#product-ingredients').textContent=selected.ingredients;
    $('#product-allergens').textContent=selected.allergens;
    $('#product-sizes').hidden=!selected.sizes;
    if(selected.sizes)$('#size-options').innerHTML=selected.sizes.map(([value,extra],index)=>`<label><input type="radio" name="size" value="${index}" ${index===0?'checked':''}><span>${value} мл${extra?` <small>+${extra} ₽</small>`:''}</span></label>`).join('');
    $('#product-milks').hidden=!selected.milk;
    $('#milk-options').innerHTML=milkOptions.map((option)=>`<label><input type="radio" name="milk" value="${option.id}" ${option.id==='regular'?'checked':''}><span>${option.name}${option.extra?` <small>+${option.extra} ₽</small>`:''}</span></label>`).join('');
    $('#decaf-label').hidden=!selected.decaf;$('#product-decaf').checked=false;
    $('#nutrition-unit').textContent=selected.unit==='мл'?'На 100 мл':'На 100 г';
    $$('.nutrition-toggle button').forEach((button)=>button.setAttribute('aria-pressed',String(button.dataset.nutrition==='portion')));
    const companion=byId.get(selected.pair);
    const pairing=$('#product-pairing');
    pairing.innerHTML=`<img src="./assets/${companion.photo}.jpg" width="48" height="48" alt=""><span><small>Можно добавить к заказу</small><strong>${companion.name} · ${rub(companion.price)}</strong></span><span aria-hidden="true">+</span>`;
    pairing.classList.remove('is-added');
    pairing.onclick=()=>{if(addToTray(companion)){pairing.classList.add('is-added');pairing.lastElementChild.textContent='✓';}};
    updateProduct();
    productDialog.showModal();productDialog.scrollTop=0;lockScroll();
  }
  function updateProduct() {
    const config=configuration(selected,sizeIndex,milk,decaf);
    $('#product-price').textContent=rub(config.unitPrice*quantity);
    $('#product-quantity').textContent=String(quantity);
    $('#product-minus').disabled=quantity<=1;
    $('#product-plus').disabled=quantity>=6;
    let macros=selected.macros.slice();
    if(selected.milk&&milk!=='regular') {
      const dairy=[2.6,2.7,4.5];
      const alternative=milk==='oat'?[1,2,6]:[.6,2.2,3.6];
      macros=macros.map((value,index)=>Math.max(0,value+(alternative[index]-dairy[index])*.85));
    }
    const scale=nutritionMode==='portion'?config.portion/100:1;
    const [protein,fat,carbs]=macros.map((value)=>value*scale);
    const kcal=Math.round(protein*4+fat*9+carbs*4);
    const kj=Math.round(kcal*4.184);
    const grams=(value)=>`${new Intl.NumberFormat('ru-RU',{maximumFractionDigits:1}).format(value)} г`;
    $('#nutrition-kcal').textContent=String(kcal);
    $('#nutrition-kj').textContent=`${kj} кДж`;
    $('#nutrition-protein').textContent=grams(protein);
    $('#nutrition-fat').textContent=grams(fat);
    $('#nutrition-carbs').textContent=grams(carbs);
    $('#nutrition-serving').textContent=nutritionMode==='portion'?`Одна порция · ${config.portion} ${selected.unit}`:`На 100 ${selected.unit}`;
  }
  $('#product-form').addEventListener('change',(event)=>{
    if(event.target.name==='size')sizeIndex=Number(event.target.value);
    if(event.target.name==='milk')milk=event.target.value;
    if(event.target.id==='product-decaf')decaf=event.target.checked;
    updateProduct();
  });
  $('#product-minus').addEventListener('click',()=>{quantity=Math.max(1,quantity-1);updateProduct();});
  $('#product-plus').addEventListener('click',()=>{quantity=Math.min(6,quantity+1);updateProduct();});
  $$('.nutrition-toggle button').forEach((button)=>button.addEventListener('click',()=>{
    nutritionMode=button.dataset.nutrition;
    $$('.nutrition-toggle button').forEach((item)=>item.setAttribute('aria-pressed',String(item===button)));
    updateProduct();
  }));
  $('#product-form').addEventListener('submit',(event)=>{
    event.preventDefault();
    if(addToTray(selected,sizeIndex,milk,decaf,quantity))productDialog.close();
  });
  $('[data-close-product]').addEventListener('click',()=>productDialog.close());
  productDialog.addEventListener('close',()=>{lockScroll();if(productTrigger&&productTrigger.isConnected)productTrigger.focus({preventScroll:true});});

  function updateTray() {
    const entries=[...cart.values()];
    const count=entries.reduce((sum,entry)=>sum+entry.quantity,0);
    const total=entries.reduce((sum,entry)=>sum+entry.unitPrice*entry.quantity,0);
    $$('[data-tray-count]').forEach((element)=>element.textContent=String(count));
    $('.floating-tray').hidden=count===0;
    $('#floating-total').textContent=rub(total);
    $('#tray-total').textContent=rub(total);
    $('#tray-footer').hidden=count===0;
    if(!entries.length){
      $('#tray-content').innerHTML='<div class="tray-empty"><span aria-hidden="true">◡</span><h3>Пока пусто</h3><p>Выберите напиток и блюдо к нему.</p><button type="button" class="outline-button" id="back-to-menu">Посмотреть меню</button></div>';
      $('#back-to-menu').addEventListener('click',()=>trayDialog.close());
    } else $('#tray-content').innerHTML=entries.map((entry)=>`<article class="tray-row"><img src="./assets/${entry.item.photo}.jpg" width="80" height="80" alt="${esc(entry.item.name)}"><div class="tray-row-info"><h3>${entry.item.name}</h3><p>${entry.options}</p><div class="tray-row-bottom"><div class="quantity-stepper"><button type="button" data-tray-change="-1" data-key="${entry.key}" aria-label="Уменьшить: ${esc(entry.item.name)}">−</button><span>${entry.quantity}</span><button type="button" data-tray-change="1" data-key="${entry.key}" ${entry.quantity>=20?'disabled':''} aria-label="Увеличить: ${esc(entry.item.name)}">+</button></div><strong>${rub(entry.unitPrice*entry.quantity)}</strong></div></div><button type="button" class="remove-item" data-remove="${entry.key}" aria-label="Убрать ${esc(entry.item.name)} с подноса">×</button></article>`).join('');
    document.body.classList.toggle('has-tray',count>0);
  }
  $$('[data-open-tray]').forEach((button)=>button.addEventListener('click',()=>{trayTrigger=button;updateTray();trayDialog.showModal();lockScroll();}));
  $('[data-close-tray]').addEventListener('click',()=>trayDialog.close());
  trayDialog.addEventListener('close',()=>{lockScroll();if(trayTrigger&&!trayTrigger.hidden)trayTrigger.focus({preventScroll:true});});
  $('#tray-content').addEventListener('click',(event)=>{
    const change=event.target.closest('[data-tray-change]');
    const remove=event.target.closest('[data-remove]');
    if(change){
      const entry=cart.get(change.dataset.key);if(!entry)return;
      const next=entry.quantity+Number(change.dataset.trayChange);
      if(next<=0)cart.delete(change.dataset.key);else entry.quantity=Math.min(20,next);
      const key=change.dataset.key,delta=change.dataset.trayChange;
      updateTray();
      const restore=$(`[data-tray-change="${delta}"][data-key="${key}"]`);
      (restore||$('[data-close-tray]')).focus({preventScroll:true});
    }
    if(remove){cart.delete(remove.dataset.remove);updateTray();$('[data-close-tray]').focus({preventScroll:true});}
  });
  $('#clear-tray').addEventListener('click',()=>{cart.clear();updateTray();$('#back-to-menu').focus();notify('Поднос очищен');});
  [productDialog,trayDialog].forEach((dialog)=>dialog.addEventListener('click',(event)=>{
    if(event.target!==dialog)return;
    const box=dialog.getBoundingClientRect();
    if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();
  }));
  renderMenu();updateTray();
})();

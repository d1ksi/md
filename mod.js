
function createStore(reducer) {
   let state = reducer(undefined, {}) //стартова ініціалізація стану, запуск редьюсера зі state === undefined
   let cbs = []                     //масив передплатників
   const getState = () => state            //функція, що повертає змінну із замикання
   const subscribe = cb => (cbs.push(cb),   //запам'ятовуємо передплатників у масиві
      () => cbs = cbs.filter(c => c !== cb)) //повертаємо функцію unsubscribe, яка видаляє передплатника зі списку
   const dispatch = action => {
      if (typeof action === 'function') { //якщо action – не об'єкт, а функція
         return action(dispatch, getState) //запускаємо цю функцію і даємо їй dispatch і getState для роботи
      }
      const newState = reducer(state, action) //пробуємо запустити редьюсер
      if (newState !== state) { //перевіряємо, чи зміг ред'юсер обробити action
         state = newState //якщо зміг, то оновлюємо state 
         for (let cb of cbs) cb() //та запускаємо передплатників
      }
   }
   return {
      getState, //додавання функції getState в результуючий об'єкт
      dispatch,
      subscribe //додавання subscribe в об'єкт
   }
}
function combineReducers(reducers) {
   function totalReducer(totalState = {}, action) {
      const newTotalState = {} //об'єкт, який зберігатиме лише нові стани дочірніх редьюсерів
      //цикл + квадратні дужки дозволяють написати код, який працюватиме з будь-якою кількістю дочірніх ред'юсерів
      for (const [reducerName, childReducer] of Object.entries(reducers)) {
         const newState = childReducer(totalState[reducerName], action) //запуск дочірнього ред'юсера
         if (newState !== totalState[reducerName]) { //якщо він відреагував на action
            newTotalState[reducerName] = newState //додаємо його в NewTotalState
         }
      }
      //Універсальна перевірка на те, що хоча б один дочірній редьюсер створив новий стейт:
      if (Object.values(newTotalState).length) {
         return { ...totalState, ...newTotalState } //створюємо новий загальний стейт, накладаючи новий стейти дочірніх редьюсерів на старі
      }
      return totalState //якщо екшен був зрозумілий жодним із дочірніх редьюсерів, повертаємо загальний стейт як був.
   }
   return totalReducer
}
const actionPromise = (promiseName, promise) => {
   return async dispatch => {
      try {
         dispatch(actionPending(promiseName));
         const result = await promise;
         dispatch(actionFulfilled(promiseName, result));
         return result;
      } catch (error) {
         dispatch(actionRejected(promiseName, error));
      }
   };
}

const actionPending = (promiseName) => ({
   type: "PROMISE",
   status: "PENDING",
   promiseName
});

const actionFulfilled = (promiseName, payload) => ({
   type: "PROMISE",
   status: "FULFILLED",
   promiseName,
   payload
});

const actionRejected = (promiseName, error) => ({
   type: "PROMISE",
   status: "REJECTED",
   promiseName,
   error
});

const mise = (promiseName, promise) => {
   return async (dispatch) => {
      try {
         dispatch(actionPending(promiseName));
         const payload = await promise;
         dispatch(actionFulfilled(promiseName, payload));
      } catch (error) {
         dispatch(actionRejected(promiseName, error));
      }
   };
}

const promiseReducer = (state = {}, action) => {
   if (action.type === 'PROMISE') {
      return {
         ...state,
         [action.promiseName]: {
            status: action.status,
            payload: action.payload,
            error: action.error
         }
      };
   }
   return state;
}

// //PROVERKA
// const store = createStore(promiseReducer)
// store.subscribe(() => console.log(store.getState())) //має запускатися 6 разів
// store.dispatch(actionPromise('delay', delay(1000)))
// store.dispatch(actionPromise('luke', fetch("https://swapi.dev/api/people/1").then(res => res.json())))
// store.dispatch(actionPromise('tatooine', fetch("https://swapi.dev/api/planets/1").then(res => res.json())))

// function jwtDecode(token) {
//    const [, payload] = token.split(".");
//    const secretPart = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
//    return JSON.parse(secretPart);
// }
function jwtDecode(token) {
   if (typeof token !== 'undefined' && token.length > 0) {
      const [, payload] = token.split(".");
      const secretPart = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
      return JSON.parse(secretPart);
   }
   return null; // или другое значение по умолчанию, если token не является корректным
}


const actionAuthLogin = (token) => ({ type: "AUTH_LOGIN", token });
const actionAuthLogout = () => ({ type: "AUTH_LOGOUT" });



function authReducer(state = {}, { type, token }) {
   if (type === "AUTH_LOGIN") {
      const payload = jwtDecode(token);
      // console.log(payload);
      localStorage.authToken = token;
      // console.log(token);
      // if (localStorage.authToken) {
      //    userName.innerHTML = `Добро пожаловать,${payload.sub.login}`;
      // }
      return { token, payload };
   }
   if (type === "AUTH_LOGOUT") {
      delete localStorage.authToken;
      userName.innerHTML = "";
      return {};
   }
   return state;
}


// // Проверка
// const actionAuthLogin = token => ({ type: 'AUTH_LOGIN', token })
// const actionAuthLogout = () => ({ type: 'AUTH_LOGOUT' })
// const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOnsiaWQiOiI2Mzc3ZTEzM2I3NGUxZjVmMmVjMWMxMjUiLCJsb2dpbiI6InRlc3Q1IiwiYWNsIjpbIjYzNzdlMTMzYjc0ZTFmNWYyZWMxYzEyNSIsInVzZXIiXX0sImlhdCI6MTY2ODgxMjQ1OH0.t1eQlRwkcP7v9JxUPMo3dcGKprH-uy8ujukNI7xE3A0"
// const store = createStore(authReducer)
// store.subscribe(() => console.log(store.getState()))
// store.dispatch(actionAuthLogin(token))
// store.dispatch(actionAuthLogout())

const cartReducer = (state = {}, action) => {
   if (action.type === 'CART_ADD') {// добавление товара в корзину
      const existingItem = state[action.good._id];
      if (existingItem) {
         return {
            ...state,
            [action.good._id]: {
               count: existingItem.count + action.count, //Количество товара
               good: action.good//Объект товара
            }
         };
      } else {
         return {
            ...state,
            [action.good._id]: {
               count: action.count,
               good: action.good
            }
         };
      }
   } else if (action.type === 'CART_SUB') {//Уменьшения товара кол. тов. в корзине
      const existingItem = state[action.good._id];
      if (existingItem) {
         const updatedCount = existingItem.count - action.count;//В результате выполнения этого действия, количество указанного товара в корзине уменьшается на указанное количество count
         if (updatedCount <= 0) { // меньше или равно 0 вернет корзину без этого товара
            const updatedState = { ...state };
            delete updatedState[action.good._id];
            return updatedState;
         } else {
            return {
               ...state,
               [action.good._id]: {
                  ...existingItem,
                  count: updatedCount
               }
            };
         }
      } else {
         return state;
      }
   } else if (action.type === 'CART_DEL') { //Выполняется при удалении товара из корзины
      const updatedState = { ...state };
      delete updatedState[action.good._id];
      return state;
   } else if (action.type === 'CARD_SET') { //Установка определенного кол. тов. в корзине
      if (action.count <= 0) {
         const updatedState = { ...state };
         delete updatedState[action.good._id];
         return state;
      } else {
         return {
            ...state,
            [action.good._id]: {
               count: action.count,
               good: action.good
            }
         };
      }
   } else if (action.type === 'CARD_CLEAR') { //При очистке корзины 
      return {};
   } else {
      return state;
   }
};
const actionCartAdd = (good, count = 1) => ({//товар с указанным идентификатором good._id добавляется в корзину с указанным количеством count
   type: 'CART_ADD',
   good,
   count
});
const actionCartSub = (good, count = 1) => ({//В результате выполнения этого действия, количество указанного товара в корзине уменьшается на указанное количество count
   type: 'CART_SUB',
   good,
   count
});
const actionCartDel = (good) => ({//В результате выполнения этого действия, указанный товар удаляется из корзины
   type: 'CART_DEL',
   good
});
const actionCartSet = (good, count) => ({//В результате выполнения этого действия, количество указанного товара в корзине устанавливается на указанное количество count
   type: 'CART_SET',
   good,
   count
});
const actionCartClear = () => ({ //В результате выполнения этого действия, корзина полностью очищается и становится пустой
   type: 'CART_CLEAR'
});



// //ПРОВЕРКА
// store.subscribe(() => console.log(store.getState())) //
// console.log(store.getState()) //{}
// store.dispatch(actionCartAdd({ _id: 'пиво', price: 50 }))
// // {пиво: {good: {_id: 'пиво', price: 50}, count: 1}}
// store.dispatch(actionCartAdd({ _id: 'чіпси', price: 75 }))
// // {
// // пиво: {good: {_id: 'пиво', price: 50}, count: 1},
// // чіпси: {good: {_id: 'чіпси', price: 75}, count: 1},
// //}
// store.dispatch(actionCartAdd({ _id: 'пиво', price: 50 }, 5))
// // {
// // пиво: {good: {_id: 'пиво', price: 50}, count: 6},
// // чіпси: {good: {_id: 'чіпси', price: 75}, count: 1},
// //}
// store.dispatch(actionCartSet({ _id: 'чіпси', price: 75 }, 2))
// // {
// // пиво: {good: {_id: 'пиво', price: 50}, count: 6},
// // чіпси: {good: {_id: 'чіпси', price: 75}, count: 2},
// //}
// store.dispatch(actionCartSub({ _id: 'пиво', price: 50 }, 4))
// // {
// // пиво: {good: {_id: 'пиво', price: 50}, count: 2},
// // чіпси: {good: {_id: 'чіпси', price: 75}, count: 2},
// //}
// store.dispatch(actionCartDel({ _id: 'чіпси', price: 75 }))
// // {
// // пиво: {good: {_id: 'пиво', price: 50}, count: 2},
// //}
// store.dispatch(actionCartClear()) // {}


async function gql(query, variables) {
   const url = "http://shop-roles.node.ed.asmer.org.ua/graphql";
   const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
   };
   if (localStorage.authToken) {
      headers.Authorization = "Bearer " + localStorage.authToken;
   }
   const result = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ query: query, variables: variables }),
   });
   const data = await result.json();
   return data;
}

//Кореневі категорії
const gqlRootCats = () => {
   const catQuery = `query cats($q: String){
      CategoryFind(query: $q){ 
      _id name
      }
   }`;
   const varRootCats = { q: "[{}]" };
   return gql(catQuery, varRootCats);
};

const actionRootCats = () => actionPromise("rootCats", gqlRootCats());

//Запит для отримання однієї категорії з товарами та картинками
const gqlCatOne = (id) => {
   const catOneQuery = `query oneCatWithGoodsImgs($q: String){
      CategoryFindOne(query: $q){ _id name image{url}
      goods{_id name price images{url}}
   }}`;
   return gql(catOneQuery, { q: JSON.stringify([{ _id: id }]) });
};

const actionCatOne = (id) => actionPromise("CategoryFindOne", gqlCatOne(id));

//Запит на отримання товару з описом та картинками
const gqlGoodOne = (id) => {
   const goodOneQuery = `query catsWithImgsDescription($q: String) {
      GoodFindOne(query: $q) {
      _id
      images {
         url
      }
      name
      price
      description
      }
   }`;
   return gql(goodOneQuery, {
      q: JSON.stringify([{ _id: `${id}` }])
   });
};

const actionGoodOne = (id) => actionPromise("GoodFindOne", gqlGoodOne(id));

//Запит на реєстрацію
const gqlRegister = (login, password) => {
   const registerQuery = `mutation reg($login: String!, $password: String!) {
      UserUpsert(user: { login: $login, password: $password }) {
      _id
      createdAt
      login
      }
   }`;
   return gql(registerQuery, { login: login, password: password });
};

const actionRegister = (log, pass) =>
   actionPromise("Registration", gqlRegister(log, pass));

//Логін
const actionLogin = (login, password) => {
   const gqlLogin = (login, password) => {
      const loginQuery = `query login($login:String, $password:String){
      login(login:$login, password:$password)
      }`;
      return gql(loginQuery, { login: login, password: password });
   };
   return actionPromise("Login", gqlLogin(login, password));
};

//Запит історії замовлень
const actionHistory = () => {
   const gqlHistory = () => {
      const historyQuery = `query OrderFind ($q: String) {OrderFind (query: $q) {
      _id 
      createdAt 
      total
      }}`;
      return gql(historyQuery, { q: "[{}]" });
   };
   return actionPromise("History", gqlHistory());
};

//Запит оформлення замовлення
const actionOrder = (count, id) => {
   const gqlOrder = (count, id) => {
      const orderQuery = `mutation newOrder($goods: [OrderGoodInput]) {
         OrderUpsert(order: {orderGoods: $goods}) {
         _id createdAt total
      }
      }`;
      return gql(orderQuery, { goods: [{ count, good: { _id: `${id}` } }] });
   };
   return actionPromise("Order", gqlOrder(count, id));
};


function localStoredReducer(originalReducer, localStorageKey) {
   function wrapper(state, action) {
      // Перший запуск - спроба відновлення стану з localStorage
      if (!wrapper.initialized) {
         try {
            const storedState = localStorage.getItem(localStorageKey);
            if (storedState !== null) {
               const parsedState = JSON.parse(storedState);
               wrapper.initialized = true;
               return parsedState;
            }
         } catch (error) {
            console.error('Error retrieving state from localStorage:', error);
         }
      }
      // Виклик оригінального редуктора
      const nextState = originalReducer(state, action);
      // Збереження стану в localStorage
      try {
         const serializedState = JSON.stringify(nextState);
         localStorage.setItem(localStorageKey, serializedState);
      } catch (error) {
         console.error('Error saving state to localStorage:', error);
      }
      return nextState;
   }
   // Початкове значення флагу ініціалізації
   wrapper.initialized = false;
   return wrapper;
}
const reducers = {
   promise: promiseReducer, auth: authReducer, cart: cartReducer
};
const store = createStore(combineReducers(reducers));
console.log(store);
const asideElement = document.getElementById("aside");

store.dispatch(actionRootCats())




function onhashchange() {
   // Ваши действия при изменении хэша
   console.log("Хэш изменен");
   // Дополнительный код, который нужно выполнить
}



function asideRootCata(resultOfGetState) {
   let rootCategories = resultOfGetState.promise?.rootCats?.payload?.data.CategoryFind;
   if (!rootCategories) {
      return;
   }
   let aside = document.getElementById("aside");
   aside.innerText = "";
   for (let category of rootCategories) {
      let div = document.createElement("div");
      div.className = "wraperCatCategory";
      let a = document.createElement("a");
      a.className = "asideCatCategory";
      a.href = `#/category/${category._id}`;
      a.innerText = category.name;
      div.appendChild(a);
      aside.appendChild(div);
   }
}
window.addEventListener('hashchange', () => {
   const newHash = window.location.hash;// полная ссылка после #
   const id = newHash.split('/').pop();//получаем текс после 2 / => айди нашей категории 
   if (newHash.includes('category')) {
      store.dispatch(actionPromise("CategoryFindOne", gqlCatOne(id)));
   }
   if (newHash.includes('good')) {
      store.dispatch(actionPromise("GoodFindOne", gqlGoodOne(id)));
   }
   console.log(id);
});


function sectionCartCat(resultOfGetState) {
   let rootCategories =
      resultOfGetState.promise?.CategoryFindOne?.payload?.data.CategoryFindOne.goods;
   // console.log(resultOfGetState.promise.CategoryFindOne.payload.data.CategoryFindOne.goods);
   if (!rootCategories || !rootCategories.length) {
      return;
   }
   let section = document.getElementById("section");
   section.innerHTML = ""; // Используйте innerText, чтобы удалить все содержимое
   for (let good of rootCategories) {
      let div = document.createElement("div"); // Создайте отдельный div для каждой ссылки
      div.id = "wraperCart"
      let img = document.createElement("img");
      img.className = "img-card";
      img.src = "http://shop-roles.node.ed.asmer.org.ua/" + good.images[0].url;
      div.appendChild(img);
      let p = document.createElement("p");
      p.className = "itemName";
      p.innerText = good.name;
      div.appendChild(p);
      let price = document.createElement("p");
      price.className = "itemPrice";
      price.innerText = good.price + ' ГРН';
      div.appendChild(price);
      let aButton = document.createElement("a");
      aButton.className = "buttonHrefCard";
      aButton.href = `#/good/${good._id}`;
      aButton.innerText = 'Подробнее';
      div.appendChild(aButton);
      section.appendChild(div); // Добавьте div в section
      // console.log(good)
   }
}


function GoodOne(resultOfGetState) {
   const goods = resultOfGetState?.promise?.GoodFindOne?.payload?.data?.GoodFindOne;
   // console.log(resultOfGetState?.promise?.GoodFindOne?.payload?.data?.GoodFindOne);
   const [, key] = window.location.hash.split("/");
   console.log(goods, key);
   let section = document.getElementById("section");
   section.innerHTML = "";
   if (!goods || key !== "good") {
      return;
   }
   let divgfo = document.createElement("div");
   divgfo.id = "gfo-card";
   let img = document.createElement("img");
   img.className = "gfo-img";
   img.src = "http://shop-roles.node.ed.asmer.org.ua/" + goods.images[0].url;
   divgfo.appendChild(img);
   let p = document.createElement("p");
   p.className = "gfo-name";
   p.innerText = goods.name;
   divgfo.appendChild(p);
   let description = document.createElement("p");
   description.className = "gfo-description";
   description.innerText = goods.description;
   divgfo.appendChild(description);
   let price = document.createElement("p");
   price.className = "gfo-price";
   price.innerText = goods.price + ' ГРН';
   divgfo.appendChild(price);
   let gfoButton = document.createElement("a");
   gfoButton.className = "gfo-button";
   // gfoButton.href = ``;
   gfoButton.innerText = 'Добавить в корзину';
   divgfo.appendChild(gfoButton);
   section.appendChild(divgfo);
}



let isLinksVisible = false; // Переменная для отслеживания состояния ссылок

function clickProfile() {
   const linksContainer = document.getElementById("linksContainer");
   if (isLinksVisible) {
      // Если ссылки уже видимы, скрыть их
      linksContainer.innerHTML = "";
      isLinksVisible = false;
   } else {
      const loginLink = document.createElement("a");
      loginLink.href = `#/login`;
      loginLink.id = "login";
      loginLink.textContent = "Login"
      loginLink.addEventListener("click", (event) => {
         event.preventDefault();
         loginLinkClick();
      });
      const registerLink = document.createElement("a");
      registerLink.href = `#/register`;
      registerLink.id = "register";
      registerLink.textContent = "Register";
      registerLink.addEventListener("click", (event) => {
         event.preventDefault();
         registerLinkClick();
      });
      const logoutLink = document.createElement("a");
      logoutLink.href = ``;
      logoutLink.id = "logout";
      logoutLink.textContent = "Logout";
      logoutLink.onclick = logoutLinkClick;
      linksContainer.innerHTML = "";
      linksContainer.appendChild(loginLink);
      linksContainer.appendChild(registerLink);
      linksContainer.appendChild(logoutLink);
      isLinksVisible = true;
   }
}



function loginLinkClick() {
   const linksContainer = document.getElementById("linksContainer");
   linksContainer.innerHTML = ""; // Очистка контейнера ссылок перед построением новой логики
   //Поле для ввода логина
   const loginInput = document.createElement("input");
   loginInput.type = "text";
   loginInput.id = "liText";
   loginInput.placeholder = "Login";
   //Поле для ввода пароля
   const passwordInput = document.createElement("input");
   passwordInput.type = "password";
   passwordInput.id = "piText";
   passwordInput.placeholder = "Password";
   //Чекбокс для пароля (по нажатию показывает пароль)
   const showPasswordCheckbox = document.createElement("input");
   showPasswordCheckbox.type = "checkbox";
   showPasswordCheckbox.textContent = "Show Password";
   showPasswordCheckbox.addEventListener("change", function () {
      if (showPasswordCheckbox.checked) {
         passwordInput.type = "text";
      } else {
         passwordInput.type = "password";
      }
   });
   //Кнопка для отправки данных на вход
   const submitButton = document.createElement("button");
   submitButton.textContent = "Login";
   submitButton.id = "profileButtonLogin";
   submitButton.addEventListener("click", function (event) {
      event.preventDefault();
      const login = loginInput.value;
      const password = passwordInput.value;
      store.dispatch(actionFullLogin(login, password));
      loginInput.value = "";
      passwordInput.value = "";
      console.log(login, password);
   });
   linksContainer.appendChild(loginInput);
   linksContainer.appendChild(passwordInput);
   linksContainer.appendChild(showPasswordCheckbox);
   linksContainer.appendChild(submitButton);
}

function registerLinkClick() {
   const linksContainer = document.getElementById("linksContainer");
   linksContainer.innerHTML = ""; // Очистка контейнера ссылок перед построением новой логики
   //Поле для ввода логина
   const loginInput = document.createElement("input");
   loginInput.type = "text";
   loginInput.id = "liText";
   loginInput.placeholder = "Login";
   //Поле для ввода пароля
   const passwordInput = document.createElement("input");
   passwordInput.type = "text";
   passwordInput.id = "piText";
   passwordInput.placeholder = "Password";
   //Кнопка для отправки данных на вход
   const submitButton = document.createElement("button");
   submitButton.textContent = "Register";
   submitButton.id = "profileButtonRegister";
   submitButton.addEventListener("click", function (event) {
      event.preventDefault();
      const login = loginInput.value;
      const password = passwordInput.value;
      store.dispatch(actionFullRegister(login, password));
      loginInput.value = "";
      passwordInput.value = "";
      console.log(login, password);
   });
   linksContainer.appendChild(loginInput);
   linksContainer.appendChild(passwordInput);
   linksContainer.appendChild(submitButton);
}

function actionFullRegister(login, password) {
   return async (dispatch) => {
      try {
         console.log(login)
         console.log(password)
         const data = await gqlRegister(login, password);
         console.log(data)
         if (data?.data?.UserUpsert?.login) {
            await dispatch(actionFullLogin(login, password));
            // console.log(login, password )
         }
         if (data.errors && data.errors.length > 0) {
            // Ошибка: пользователь уже существует
            alert('Пользователь уже зарегистрирован, выберите другой Login');
         }
      } catch (error) {
         console.log(error);
      }
   };
}
function actionFullLogin(login, password) {
   return async (dispatch) => {
      const data = await dispatch(actionLogin(login, password));
      console.log(data);
      if (data && data.login) {
         await dispatch(actionAuthLogin(data.login));
      };
      if (data?.data?.login.length > 0) {
         const linksContainer = document.getElementById("linksContainer");
         linksContainer.innerHTML = "";
      }
      if (data?.data?.login === null) {
         alert("Не верные данные для входа")
      };
   };
}


function logoutLinkClick() {
   let outRegistr = document.getElementById("logout");
   outRegistr.onclick = () => {
      store.dispatch(actionAuthLogout());
      fullLogin.value = "";
      fullpassword.value = "";
      console.log("Logout");
   };
}

window.addEventListener("DOMContentLoaded", () => {
   const token = localStorage.authToken;
   if (token) {
      const payload = jwtDecode(token);
      console.log(`${payload.sub.login}`);
   }
});










store.subscribe(() => {
   console.log(store.getState());
   asideRootCata(store.getState());
});
store.subscribe(() => {
   const newHash = window.location.hash;
   if (newHash.includes('category')) {
      sectionCartCat(store.getState());
   }
   console.log(store.getState());
});
store.subscribe(() => {
   const newHash = window.location.hash;
   if (newHash.includes('good')) {
      GoodOne(store.getState());
   }
   console.log(store.getState());
});

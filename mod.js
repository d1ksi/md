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

const actionPromise = (promiseName, promise) => {
   return async (dispatch) => {
      try {
         dispatch(actionPending(promiseName));
         const result = await promise;
         dispatch(actionFulfilled(promiseName, result));
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

const authReducer = (state = {}, action) => {
   if (action.type === 'AUTH_LOGIN') {
      try {
         const payload = decodeToken(action.token);
         return {
            token: action.token,
            payload: payload
         };
      } catch (error) {
         return {};
      }
   } else if (action.type === 'AUTH_LOGOUT') {
      return {};
   } else {
      return state;
   }
};


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


(async () => {
   const endpoint = "http://shop-roles.node.ed.asmer.org.ua/graphql";
   const gqlRequest = await getGql(endpoint);
   const catQuery = `query cf {
      CategoryFind(query: "[{\\"parent\\":null}]" ) {
         _id
         createdAt
         name
      }
   }`;
   try {
      const categories = await gqlRequest(catQuery);
      console.log(categories);
   } catch (error) {
      console.error('GraphQL request error:', error);
   }
   const catOneQuery = `query cfo {
      CategoryFindOne(query:"[{\\"_id\\":\\"63dd6537d5e3301cba63a345\\"}]"){
         _id
         name
         goods{
            _id
            name
            price
            images{
               url
            }
         }
         subCategories{
            _id
            name
         }
      }
   }`;
   try {
      const category = await gqlRequest(catOneQuery);
      console.log(category);
   } catch (error) {
      console.error('GraphQL request error:', error);
   }
   const registerMutation = `mutation register($login:String, $password: String){
      UserUpsert(user: {login:$login, password: $password}){
         _id
         login
         createdAt
      }
   }`;
   try {
      const registerResult = await gqlRequest(registerMutation, { login: "test", password: "password" });
      console.log(registerResult);
   } catch (error) {
      console.error('GraphQL request error:', error);
   }
   const loginQuery = `query login($login:String, $password:String){
      login(login:$login, password:$password)
   }`;
   try {
      const token = await gqlRequest(loginQuery, { login: "test", password: "password" });
      console.log(token);
   } catch (error) {
      console.error('GraphQL request error:', error);
   }
   const orderQuery = `query orger{
      OrderFind(query: "[{}]") {
         _id
         createdAt
         total
      }
   }`;
   try {
      const orders = await gqlRequest(orderQuery);
      console.log(orders);
   } catch (error) {
      console.error('GraphQL request error:', error);
   }
   const newOrderMutation = `mutation newOrder($goods: [OrderGoodInput]) {
      OrderUpsert(order: {orderGoods: $goods}) {
         _id
         createdAt
         total
      }
   }`;
   try {
      const newOrderResult = await gqlRequest(newOrderMutation, { goods: [{ name: "Product 1", price: 10 }, { name: "Product 2", price: 20 }] });
      console.log(newOrderResult);
   } catch (error) {
      console.error('GraphQL request error:', error);
   }
})();

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
const store = createStore(localStoredReducer(cartReducer, 'cart'))
store.subscribe(() => console.log(store.getState())) //
store.dispatch(actionCartAdd({ _id: 'пиво', price: 50 }))
store.dispatch(actionCartAdd({ _id: 'чіпси', price: 75 }))
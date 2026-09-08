import{c as n,r as o,z as r,j as e}from"./index-BHmC62XB.js";/**
 * @license lucide-react v0.301.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const l=n("LayoutDashboard",[["rect",{width:"7",height:"9",x:"3",y:"3",rx:"1",key:"10lvy0"}],["rect",{width:"7",height:"5",x:"14",y:"3",rx:"1",key:"16une8"}],["rect",{width:"7",height:"9",x:"14",y:"12",rx:"1",key:"1hutg5"}],["rect",{width:"7",height:"5",x:"3",y:"16",rx:"1",key:"ldoo1y"}]]);/**
 * @license lucide-react v0.301.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const u=n("LogOut",[["path",{d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",key:"1uf3rs"}],["polyline",{points:"16 17 21 12 16 7",key:"1gabdz"}],["line",{x1:"21",x2:"9",y1:"12",y2:"12",key:"1uyos4"}]]);/**
 * @license lucide-react v0.301.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const d=n("WifiOff",[["line",{x1:"2",x2:"22",y1:"2",y2:"22",key:"a6p6uj"}],["path",{d:"M8.5 16.5a5 5 0 0 1 7 0",key:"sej527"}],["path",{d:"M2 8.82a15 15 0 0 1 4.17-2.65",key:"11utq1"}],["path",{d:"M10.66 5c4.01-.36 8.14.9 11.34 3.76",key:"hxefdu"}],["path",{d:"M16.85 11.25a10 10 0 0 1 2.22 1.68",key:"q734kn"}],["path",{d:"M5 13a10 10 0 0 1 5.24-2.76",key:"piq4yl"}],["line",{x1:"12",x2:"12.01",y1:"20",y2:"20",key:"of4bc4"}]]);function c(){const[t,i]=o.useState(navigator.onLine);return o.useEffect(()=>{const s=()=>{i(!0),r.success("Connexion rétablie — données actualisées",{id:"network-status",duration:4e3})},a=()=>{i(!1),r.error("Hors ligne — affichage des données en cache",{id:"network-status",duration:1/0})};return window.addEventListener("online",s),window.addEventListener("offline",a),()=>{window.removeEventListener("online",s),window.removeEventListener("offline",a)}},[]),t}function f(){return c()?null:e.jsxs("div",{className:"fixed top-0 inset-x-0 z-50 bg-amber-500 text-white text-sm font-medium py-2 px-4 flex items-center justify-center gap-2 shadow-md",children:[e.jsx(d,{className:"w-4 h-4 flex-shrink-0"}),e.jsx("span",{children:"Vous êtes hors ligne — données affichées depuis le cache"})]})}export{l as L,f as O,u as a};

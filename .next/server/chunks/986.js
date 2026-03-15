exports.id=986,exports.ids=[986],exports.modules={12312:(a,b,c)=>{Promise.resolve().then(c.bind(c,46553))},22040:(a,b,c)=>{Promise.resolve().then(c.bind(c,62106))},38391:(a,b,c)=>{"use strict";c.d(b,{Y:()=>q});var d=c(21124),e=c(89369),f=c(41831),g=c(14682),h=c(48627),i=c(51254),j=c(18490),k=c(65144),l=c(90293),m=c(24204);function n(){let{mode:a,toggleMode:b}=(0,m.b)();return(0,d.jsx)(l.A,{icon:(0,d.jsx)(j.In,{icon:"fint"===a?"mdi:weather-sunny":"mdi:weather-night"}),label:"fint"===a?"Light":"Dark",onClick:b,color:"primary",variant:"fint"===a?"outlined":"filled",sx:{fontWeight:700,fontSize:"0.85rem",cursor:"pointer"}})}var o=c(84342),p=c(42378);function q({title:a}){let{partner:b,signOut:c}=(0,o.A)(),l=(0,p.useRouter)();return(0,d.jsx)(e.A,{position:"sticky",color:"inherit",elevation:0,children:(0,d.jsxs)(f.A,{sx:{justifyContent:"space-between",minHeight:60,px:2.5},children:[(0,d.jsxs)(h.A,{children:[(0,d.jsx)(g.A,{variant:"h6",fontWeight:700,letterSpacing:"-0.02em",lineHeight:1.2,children:a}),b&&(0,d.jsxs)(g.A,{variant:"caption",color:"text.secondary",letterSpacing:"0.01em",children:["med ",b.name]})]}),(0,d.jsxs)(h.A,{sx:{display:"flex",alignItems:"center",gap:.5},children:[(0,d.jsx)(n,{}),(0,d.jsx)(k.A,{title:"Inst\xe4llningar",children:(0,d.jsx)(i.A,{onClick:()=>l.push("/settings"),size:"small",color:"inherit","aria-label":"Inst\xe4llningar",sx:{opacity:.6,"&:hover":{opacity:1}},children:(0,d.jsx)(j.In,{icon:"mdi:cog"})})}),(0,d.jsx)(k.A,{title:"Logga ut",children:(0,d.jsx)(i.A,{onClick:c,size:"small",color:"inherit","aria-label":"Logga ut",sx:{opacity:.6,"&:hover":{opacity:1}},children:(0,d.jsx)(j.In,{icon:"mdi:logout"})})})]})]})})}},42842:(a,b,c)=>{"use strict";c.d(b,{A:()=>t});var d=c(38301),e=c(43249),f=c(76069),g=c(78871),h=c(98134),i=c(72646),j=c(18539),k=c(35763),l=c(46127);function m(a){return(0,l.Ay)("MuiSkeleton",a)}(0,k.A)("MuiSkeleton",["root","text","rectangular","rounded","circular","pulse","wave","withChildren","fitContent","heightAuto"]);var n=c(21124);let o=(0,g.i7)`
  0% {
    opacity: 1;
  }

  50% {
    opacity: 0.4;
  }

  100% {
    opacity: 1;
  }
`,p=(0,g.i7)`
  0% {
    transform: translateX(-100%);
  }

  50% {
    /* +0.5s of delay between each loop */
    transform: translateX(100%);
  }

  100% {
    transform: translateX(100%);
  }
`,q="string"!=typeof o?(0,g.AH)`
        animation: ${o} 2s ease-in-out 0.5s infinite;
      `:null,r="string"!=typeof p?(0,g.AH)`
        &::after {
          animation: ${p} 2s linear 0.5s infinite;
        }
      `:null,s=(0,h.Ay)("span",{name:"MuiSkeleton",slot:"Root",overridesResolver:(a,b)=>{let{ownerState:c}=a;return[b.root,b[c.variant],!1!==c.animation&&b[c.animation],c.hasChildren&&b.withChildren,c.hasChildren&&!c.width&&b.fitContent,c.hasChildren&&!c.height&&b.heightAuto]}})((0,i.A)(({theme:a})=>{let b=String(a.shape.borderRadius).match(/[\d.\-+]*\s*(.*)/)[1]||"px",c=parseFloat(a.shape.borderRadius);return{display:"block",backgroundColor:a.vars?a.vars.palette.Skeleton.bg:a.alpha(a.palette.text.primary,"light"===a.palette.mode?.11:.13),height:"1.2em",variants:[{props:{variant:"text"},style:{marginTop:0,marginBottom:0,height:"auto",transformOrigin:"0 55%",transform:"scale(1, 0.60)",borderRadius:`${c}${b}/${Math.round(c/.6*10)/10}${b}`,"&:empty:before":{content:'"\\00a0"'}}},{props:{variant:"circular"},style:{borderRadius:"50%"}},{props:{variant:"rounded"},style:{borderRadius:(a.vars||a).shape.borderRadius}},{props:({ownerState:a})=>a.hasChildren,style:{"& > *":{visibility:"hidden"}}},{props:({ownerState:a})=>a.hasChildren&&!a.width,style:{maxWidth:"fit-content"}},{props:({ownerState:a})=>a.hasChildren&&!a.height,style:{height:"auto"}},{props:{animation:"pulse"},style:q||{animation:`${o} 2s ease-in-out 0.5s infinite`}},{props:{animation:"wave"},style:{position:"relative",overflow:"hidden",WebkitMaskImage:"-webkit-radial-gradient(white, black)","&::after":{background:`linear-gradient(
                90deg,
                transparent,
                ${(a.vars||a).palette.action.hover},
                transparent
              )`,content:'""',position:"absolute",transform:"translateX(-100%)",bottom:0,left:0,right:0,top:0}}},{props:{animation:"wave"},style:r||{"&::after":{animation:`${p} 2s linear 0.5s infinite`}}}]}})),t=d.forwardRef(function(a,b){let c=(0,j.b)({props:a,name:"MuiSkeleton"}),{animation:d="pulse",className:g,component:h="span",height:i,style:k,variant:l="text",width:o,...p}=c,q={...c,animation:d,component:h,variant:l,hasChildren:!!p.children},r=(a=>{let{classes:b,variant:c,animation:d,hasChildren:e,width:g,height:h}=a;return(0,f.A)({root:["root",c,d,e&&"withChildren",e&&!g&&"fitContent",e&&!h&&"heightAuto"]},m,b)})(q);return(0,n.jsx)(s,{as:h,ref:b,className:(0,e.A)(r.root,g),ownerState:q,...p,style:{width:o,height:i,...k}})})},46553:(a,b,c)=>{"use strict";c.r(b),c.d(b,{default:()=>d});let d=(0,c(97954).registerClientReference)(function(){throw Error("Attempted to call the default export of \"/home/albin/Documents/Kod/onska/src/app/(app)/layout.tsx\" from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"/home/albin/Documents/Kod/onska/src/app/(app)/layout.tsx","default")},62106:(a,b,c)=>{"use strict";c.r(b),c.d(b,{default:()=>o});var d=c(21124);c(38301);var e=c(42378),f=c(84342),g=c(86171),h=c(73191),i=c(99900),j=c(18490),k=c(20481);function l(){let a=(0,k.c)("nav"),b=(0,e.usePathname)(),c=(0,e.useRouter)(),f=[{to:"/",icon:(0,d.jsx)(j.In,{icon:"mdi:home",width:28}),label:a("home")},{to:"/wishes",icon:(0,d.jsx)(j.In,{icon:"mdi:inbox",width:28}),label:a("orders")},{to:"/calendar",icon:(0,d.jsx)(j.In,{icon:"mdi:calendar-today",width:28}),label:a("calendar")},{to:"/ideas",icon:(0,d.jsx)(j.In,{icon:"mdi:heart-outline",width:28}),label:a("services")}],l=f.findIndex(a=>a.to===b);return(0,d.jsx)(i.A,{component:"nav","aria-label":a("aria_label"),elevation:0,sx:{paddingBottom:"env(safe-area-inset-bottom)",flexShrink:0},children:(0,d.jsx)(g.A,{value:-1===l?0:l,onChange:(a,b)=>c.push(f[b].to),children:f.map(a=>(0,d.jsx)(h.A,{label:a.label,icon:a.icon,sx:{borderRadius:2,mx:.5,transition:"all 0.15s ease","&:hover":{bgcolor:"action.hover"}}},a.to))})})}var m=c(48627),n=c(10659);function o({children:a}){let{user:b,profile:c,loading:g}=(0,f.A)();return((0,e.useRouter)(),!g&&b&&c?.partner_id)?(0,d.jsxs)(m.A,{display:"flex",flexDirection:"column",height:"100dvh",bgcolor:"background.default",children:[(0,d.jsx)(m.A,{component:"main",flex:1,overflow:"auto",children:a}),(0,d.jsx)(l,{})]}):(0,d.jsx)(m.A,{minHeight:"100dvh",display:"flex",alignItems:"center",justifyContent:"center",bgcolor:"background.default",children:(0,d.jsx)(n.A,{color:"primary"})})}}};
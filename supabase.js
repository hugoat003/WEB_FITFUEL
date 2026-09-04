/* FITFUEL — cliente de Supabase, fuera del camino crítico.
   supabase-js pesa 213 KB (55 KB comprimidos), el 40% del bundle, y nada de lo que hace
   falta para pintar la portada lo necesita: solo sesión, stock, reseñas y pedidos, que
   ocurren después de montar. Cargándolo estático, la primera pintura esperaba a que se
   descargara y se parseara entero.

   Se carga aparte, pero `window.sb` existe desde el primer instante con la misma forma de
   siempre, así que los 23 sitios que lo usan no cambian. Las llamadas que lleguen antes de
   que el cliente esté listo se quedan esperando en vez de reventar. En cuanto llega, se
   sustituye el intermediario por el cliente real y a partir de ahí no hay ninguna capa. */

const URL = "https://dwdxnpyybzpcjetxedyq.supabase.co";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3ZHhucHl5YnpwY2pldHhlZHlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwNTAyOTMsImV4cCI6MjA5ODYyNjI5M30.4bRrW810z2C0Yjc6KdqZyQEEQKt_9nFa6vAxHEv75Y8";

const ready = import("@supabase/supabase-js").then(({ createClient }) => {
  const client = createClient(URL, KEY);
  window.sb = client;                 // a partir de aquí, sin intermediario
  window.dispatchEvent(new CustomEvent("ff:supabase"));
  return client;
});

window.ffSb = () => ready;

/* Constructor de consultas diferido. Va anotando la cadena (.select().eq().single()…) y no
   la ejecuta hasta que alguien la espera, que es lo que hacen todas sin excepción. */
function deferQuery(pick) {
  const chain = [];
  const run = () => ready.then((client) => {
    let cur = pick(client);
    for (const [name, args] of chain) cur = cur[name](...args);
    return cur;                        // los constructores de supabase ya son "thenables"
  });
  const proxy = new Proxy(function () {}, {
    get(_, prop) {
      if (prop === "then") return (ok, err) => run().then(ok, err);
      if (prop === "catch") return (err) => run().catch(err);
      if (prop === "finally") return (fn) => run().finally(fn);
      if (typeof prop === "symbol") return undefined;
      return (...args) => { chain.push([prop, args]); return proxy; };
    },
  });
  return proxy;
}

const passthrough = (name) => (...args) => ready.then((c) => c.auth[name](...args));

window.sb = {
  from: (table) => deferQuery((c) => c.from(table)),
  rpc: (fn, params) => deferQuery((c) => c.rpc(fn, params)),
  auth: {
    getSession: passthrough("getSession"),
    signInWithPassword: passthrough("signInWithPassword"),
    signUp: passthrough("signUp"),
    signInWithOAuth: passthrough("signInWithOAuth"),
    resetPasswordForEmail: passthrough("resetPasswordForEmail"),
    signOut: passthrough("signOut"),
    updateUser: passthrough("updateUser"),
    // Devuelve su resultado de forma síncrona (app.jsx lo desestructura al vuelo para
    // guardarse la suscripción), así que hay que imitar esa forma sin esperar.
    onAuthStateChange: (cb) => {
      let real = null, cancelled = false;
      ready.then((c) => {
        if (cancelled) return;
        real = c.auth.onAuthStateChange(cb).data.subscription;
      });
      return { data: { subscription: { unsubscribe() { cancelled = true; if (real) real.unsubscribe(); } } } };
    },
  },
};

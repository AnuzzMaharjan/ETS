import Elysia from "elysia"

const setHeaders = (set:any)=>{
    set.headers = {
        'Cache-Control':'no-store',
        'Pragma':'no-cache',
        'Expires':'0'
    }
}

export const headers = new Elysia().derive(({as:'global'}),({set})=>{
    setHeaders(set);
});
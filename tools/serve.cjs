const http=require('http'),fs=require('fs'),path=require('path');
const root=process.cwd();
const port=Number(process.argv[2]||8123);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.md':'text/markdown; charset=utf-8'};
http.createServer((req,res)=>{
  let p=decodeURIComponent(req.url.split('?')[0]);
  if(p.endsWith('/')) p+='index.html';
  const fp=path.join(root,p);
  if(!fp.startsWith(root)){res.writeHead(403);return res.end('forbidden');}
  fs.readFile(fp,(e,buf)=>{
    if(e){res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});return res.end('404 '+p);}
    res.writeHead(200,{'Content-Type':types[path.extname(fp).toLowerCase()]||'application/octet-stream'});
    res.end(buf);
  });
}).listen(port,'127.0.0.1',()=>console.log('serving http://127.0.0.1:'+port));

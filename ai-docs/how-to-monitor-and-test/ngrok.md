# How to use ngrok
When you test login system on Android use the following steps:

## vite.config.ts

```ts
   return {
+    server: {
+      // Allow any tunnel/proxy host during local dev (ngrok, etc.)
+      allowedHosts: true
+    },
     plugins: [
       sveltekit(),
       ...
```

## start local and ngrok
```bash
# terminal 1
npx vite dev --host 
# or
pnpm dev --host
```
This will show:
```bash
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.83:5173/
  ➜  press h + enter to show help
```

```bash
# terminal 2
ngrok http http://localhost:5173
```
This will show:
```bash
ngrok                                                     (Ctrl+C to quit)
                                                                          
🚪 One gateway for every AI model. Available in early access *now*: https:
                                                                          
Session Status                online                                      
Account                       okada.shin@gmail.com (Plan: Free)           
Version                       3.39.8                                      
Region                        Europe (eu)                                 
Latency                       33ms                                        
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://wildland-idealism-resort.ngrok-free.dev -> http://localhost:5173
                                                                          
Connections                   ttl     opn     rt1     rt5     p50     p90 
                              78      1       0.01    0.09    0.07    0.61
                                                                          
HTTP Requests                                                             
-------------                                                             
                          
```

Then go to https://wildland-idealism-resort.ngrok-free.dev/ on a browser.

Add https://wildland-idealism-resort.ngrok-free.dev/ to Supabase → Authentication → URL Configuration → Redirect URLs, 
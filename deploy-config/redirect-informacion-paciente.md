# True 301 redirect for /informacion-paciente.html → /es/informacion-paciente.html
(June 2026 v5 — replaces the meta-refresh stub with a real server-side redirect.
The stub file remains in the bundle as a graceful fallback until this is live.)

## Option A — CloudFront Function (recommended; works regardless of S3 setup)
Create a CloudFront Function (viewer-request) and attach it to the default behavior:

```js
function handler(event) {
  var request = event.request;
  var redirects = {
    '/informacion-paciente.html': '/es/informacion-paciente.html',
    '/wisdom-teeth-removal.html': '/tooth-extractions.html'
  };
  if (redirects[request.uri]) {
    return {
      statusCode: 301,
      statusDescription: 'Moved Permanently',
      headers: {
        location: { value: 'https://springvalleydentistry.com' + redirects[request.uri] },
        'cache-control': { value: 'max-age=31536000' }
      }
    };
  }
  return request;
}
```

CLI:
```
aws cloudfront create-function \
  --name svd-redirects \
  --function-config Comment="SVD 301 redirects",Runtime="cloudfront-js-2.0" \
  --function-code fileb://svd-redirects.js
# test, then publish and associate with the distribution's default behavior (viewer-request)
```

## Option B — S3 static website routing rule
Only if the distribution origin is the S3 *website* endpoint (not the REST endpoint).
Bucket → Properties → Static website hosting → Redirection rules:

```json
[
  {
    "Condition": { "KeyPrefixEquals": "informacion-paciente.html" },
    "Redirect": {
      "HostName": "springvalleydentistry.com",
      "ReplaceKeyWith": "es/informacion-paciente.html",
      "HttpRedirectCode": "301",
      "Protocol": "https"
    }
  }
]
```

## Also verify while in the console (from the audit)
1. **404 status**: request a nonsense URL (e.g. /zzz.html) with `curl -I` — it must
   return HTTP 404 (with 404.html as the body), NOT 200. If it returns 200, set the
   CloudFront custom error response: 404 → /404.html with response code 404.
2. After the redirect is live, the meta-refresh stub informacion-paciente.html can be
   deleted from the bucket in a future deploy.

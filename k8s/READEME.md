### Notes
You'll need an ingress controller such as Traefik or nginx to leverage the ingress YAML. If not, you'll have to modify the service to be NodePort instead.

### Quickstart
```$ kubectl apply -f ./k8s```

You should see one client, one primary master, and one secondary master when executing ```$ kubectl --namespace cronicle get pod``` similar to below.
```
NAME                               READY   STATUS    RESTARTS   AGE
cronicle-client-586ff8fb6d-zxp4q   1/1     Running   0          32m
cronicle-server-primary-0          1/1     Running   0          32m
cronicle-server-secondary-0        1/1     Running   0          32m
```

Once all the pods are *running* you can hit http://cronicle.example.com and see cronicle. Remember *cronicle.example.com* to the right IP in your hosts file.
